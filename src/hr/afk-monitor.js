/**
 * This plugin for Headless Haxball Manager (HHM) monitors the player
 * activity and kicks the players that idle too long.
 */
let room = HBInit();
room.pluginSpec = {
  name: `hr/afk-monitor`,
  author: `salamini`,
  version: `1.0.0`,
  dependencies: [
    `sav/game-state`,
  ],
  // All times in the config are in seconds.
  config: {
    // If true, then only admins will be monitored.
    adminsOnly: true,
    // Max time player can be afk.
    maxIdleTime: 5 * 60,
    // Max time player can be AFK when he is playing.
    maxIdleTimeWhenPlaying: 15,
    // Max time player can be AFK when he is playing and game is paused.
    maxIdleTimeWhenPaused: 30,
    // Max time admins can be AFK when game is paused before all of them 
    // getting kicked.
    maxAdminIdleTimeWhenPaused: 15,
    // Max time admins can be AFK when game is stopped before all of them 
    // getting kicked.
    maxAdminIdleTimeWhenStopped: 20,
    // How many seconds beforehand to warn the player before getting kicked.
    warnBefore: 7,
    // Message to send to player when he is kicked.
    kickMessage: 'AFK'
  }
};

const debug = (msg) => { console.debug(`hr/afk-monitor: ${msg}`)};

const gameState = room.getPlugin('sav/game-state');

let afkTimeouts = new Map();
let warnAfkTimeouts = new Map();
let lastActiveTimes = new Map();

// Count player chatting as an activity too.
function onPlayerChat(player) {
  onPlayerActivity(player);
}

// Set the initial timers when player joins.
function onPlayerJoin(player) {
  let adminsOnly = room.getConfig('adminsOnly');
  if (!adminsOnly) {
    refreshLastActiveTime(player.id);
    refreshTimeout(player.id);
  }
}

// When players admin status changes, update the timeouts.
function onPlayerAdminChange(changedPlayer, byPlayer) {
  if (byPlayer.id !== 0) {
    onAdminActivity(byPlayer);
  }
  refreshTimeout(changedPlayer.id);
  let adminsOnly = room.getConfig('adminsOnly');
  if (adminsOnly && !changedPlayer.admin) {
    removeLastActiveTime(changedPlayer.id);
    removeTimeout(changedPlayer.id);
  }
}

// When players team change, update the timeouts.
function onPlayerTeamChange(changedPlayer, byPlayer) {
  refreshTimeout(changedPlayer.id);
  if (byPlayer.id !== 0 && byPlayer.admin) {
    onAdminActivity(byPlayer);
  }
}

// When player leaves, clear the timeouts.
function onPlayerLeave(player) {
  removeLastActiveTime(player.id);
  removeTimeout(player.id);
}

function onGameStart(player) {
  if (player.id !== 0) {
    onAdminActivity(player);
  }
}

function onGameStop(player) {
  if (player && player.id !== 0) {
    onAdminActivity(player);
  }
}

function onGamePause(player) {
  if (player.id !== 0) {
    onAdminActivity(player);
  }
}

function onGameUnpause(player) {
  if (player.id !== 0) {
    onAdminActivity(player);
  }
}

function onPlayerKicked(kickedPlayer, reason, ban, byPlayer) {
  if (byPlayer && byPlayer.id !== 0) {
    onAdminActivity(byPlayer);
  }
}

// When the game state changes, update all timeouts.
function onGameStateChanged(state) {
  refreshAllTimeouts();
}

// Whenever the player does something, update the time that he was last active
// and update the timeouts.
function onPlayerActivity(player) {
  if (player.id === 0) return;
  refreshLastActiveTime(player.id);
  refreshTimeout(player.id);
}

// Whenever an admin does something, update the time that he was last active
// and update the timeouts.
function onAdminActivity(player) {
  if (player.id === 0) return;
  refreshLastActiveTime(player.id);
  refreshTimeout(player.id);
}

/**
 * Returns an array of player ids in the room.
 */
function getPlayerIds() {
  return room.getPlayerList().filter((p) => p.id !== 0).map((p) => p.id);
}

/**
 * Returns an array of admin ids in the room.
 */
function getAdminIds() {
  return room.getPlayerList()
    .filter((p) => p.id !== 0 && p.admin)
    .map((p) => p.id);
}

/**
 * Updates the last active time of the player with given id to be the current
 * time.
 * 
 * @param {number} playerId - Id of the player.
 */
function refreshLastActiveTime(playerId) {
  let adminsOnly = room.getConfig('adminsOnly');
  let player = room.getPlayer(playerId);
  if (adminsOnly && !player.admin) return;
  return lastActiveTimes.set(playerId, Date.now());
}

/**
 * Removes the tracking of last active time from the player with given id.
 * 
 * @param {number} playerId - Id of the player.
 */
function removeLastActiveTime(playerId) {
  return lastActiveTimes.delete(playerId);
}

/**
 * Removes the warning and kick timeouts from the player with given id.
 * 
 * @param {number} playerId - Id of the player.
 */
function removeTimeout(playerId) {
  let timeout = afkTimeouts.get(playerId);
  if (timeout) clearTimeout(timeout);
  timeout = warnAfkTimeouts.get(playerId);
  if (timeout) clearTimeout(timeout);
  afkTimeouts.delete(playerId);
  warnAfkTimeouts.delete(playerId);
}

/**
 * Refreshes the warn and kick timeouts of all players in the room.
 */
function refreshAllTimeouts() {
  let adminsOnly = room.getConfig('adminsOnly');
  const players = adminsOnly ? getAdminIds() : getPlayerIds();
  for (let playerId of players) {
    refreshTimeout(playerId);
  }
}

/**
 * Refreshes the kick and warning and kick timeouts of the player with given id.
 * Calculates the new times based on the game state, player admin status and
 * players last active time.
 * 
 * @param {number} playerId - Id of the player.
 */
function refreshTimeout(playerId) {
  let player = room.getPlayer(playerId);
  if (!player) {
    removeLastActiveTime(playerId);
    removeTimeout(playerId);
    return;
  }

  let adminsOnly = room.getConfig('adminsOnly');
  if (adminsOnly && !player.admin) return;

  let maxIdleTime = 0;
  let currentTime = Date.now();
  let lastActiveTime = lastActiveTimes.get(player.id);
  lastActiveTime = lastActiveTime || currentTime;

  switch (gameState.getGameState()) {
    case gameState.states.STOPPED:
      if (player.admin) {
        maxIdleTime = room.getConfig('maxAdminIdleTimeWhenStopped');
        lastActiveTime = currentTime; // ignores the last active time
      } else {
        maxIdleTime = room.getConfig('maxIdleTime');
      }
      debug(`Game stopped and maxIdleTime for ${player.id} is ${maxIdleTime} seconds.`);
      break;

    case gameState.states.STARTED:
      if (player.team === 0) {
        maxIdleTime = room.getConfig('maxIdleTime');
      } else {
        maxIdleTime = room.getConfig('maxIdleTimeWhenPlaying');
        lastActiveTime = currentTime; // ignores the last active time
      }
      debug(`Game started and maxIdleTime for ${player.id} is ${maxIdleTime} seconds.`);
      break;

    case gameState.states.PAUSED:
      if (player.admin) {
        maxIdleTime = room.getConfig('maxAdminIdleTimeWhenPaused');
        lastActiveTime = currentTime; // ignores the last active time
      } else if (player.team === 0) {
        maxIdleTime = room.getConfig('maxIdleTime');
      } else {
        maxIdleTime = room.getConfig('maxIdleTimeWhenPaused');
        lastActiveTime = currentTime; // ignores the last active time
      }
      debug(`Game paused and maxIdleTime for ${player.id} is ${maxIdleTime} seconds.`);
      break;
  }

  maxIdleTimeInMs = maxIdleTime * 1000;
  maxIdleTimeInMs -= currentTime - lastActiveTime;
  let timeToWarn = maxIdleTimeInMs - (room.getConfig('warnBefore') * 1000);

  removeTimeout(player.id);
  debug(`Kicking player ${player.id} in ${maxIdleTimeInMs / 1000} seconds.`);
  debug(`Warning player ${player.id} in ${timeToWarn / 1000} seconds.`);

  let timeout = setTimeout(kickInactivePlayer, maxIdleTimeInMs, player.id);
  let warnTimeout = setTimeout(warnInactivePlayer, timeToWarn, player.id);
  afkTimeouts.set(player.id, timeout);
  warnAfkTimeouts.set(player.id, warnTimeout);
}

/**
 * Kicks the player when he has been idling too long.
 * 
 * @param {number} playerId - Id of the player.
 */
function kickInactivePlayer(playerId) {
  const kickMessage = room.getConfig('kickMessage');
  room.kickPlayer(playerId, kickMessage, false);
}

/**
 * Warns the player when he has been idling too long.
 * 
 * @param {number} playerId - Id of the player.
 */
function warnInactivePlayer(playerId) {
  room.sendChat(
    `Press movement keys or X or you will be kicked for being AFK!`,
    playerId
  );
}

room.onRoomLink = function onRoomLink() {
  room.onPlayerChat = onPlayerChat;
  room.onPlayerAdminChange = onPlayerAdminChange;
  room.onPlayerTeamChange = onPlayerTeamChange;
  room.onPlayerJoin = onPlayerJoin;
  room.onPlayerLeave = onPlayerLeave;
  room.onGameStart = onGameStart;
  room.onGameStop = onGameStop;
  room.onGamePause = onGamePause;
  room.onGameUnpause = onGameUnpause;
  room.onPlayerKicked = onPlayerKicked;
  room.onPlayerActivity = onPlayerActivity;
  room.onGameStateChanged = onGameStateChanged;
}
