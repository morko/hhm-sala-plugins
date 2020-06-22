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
    `sav/cron`
  ],
  // All times in the config are in seconds.
  config: {
    // If true, then only admins will be monitored.
    adminsOnly: true,
    // Max time player can be AFK.
    maxIdleTime: 5 * 60,
    // Max time player can be AFK when he is playing.
    maxIdleTimeWhenPlaying: 20,
    // Max time admins can be AFK when they are required to take action.
    maxAdminIdleTime: 20,
    // How many seconds beforehand to warn the player before getting kicked.
    warnBefore: 7,
    // Message to send to player when he is kicked.
    kickMessage: 'AFK',
    // Enables debugging messages to console (use only if developing).
    debug: false
  }
};

const debug = room.getConfig('debug') 
  ? (msg) => { console.debug(`hr/afk-monitor: ${msg}`)} 
  : () => {};

let afkTimeouts = new Map();
let warnAfkTimeouts = new Map();
let lastActiveTimes = new Map();
let lastAdminActivityTime = 0;

let gameStates;

function onPlayerChat(player) {
  onPlayerActivity(player);
}

function onPlayerJoin(player) {
  refreshLastActiveTime(player);

  let gameState = room.getPlugin('sav/game-state').getGameState();
  refreshTimeout(player, gameState);
}

function onPlayerAdminChange(changedPlayer, byPlayer) {
  let gameState = room.getPlugin('sav/game-state').getGameState();

  let players = room.getPlayerList().filter(p => p !== 0);
  let admins = players.filter(p => p.admin);
  if (players.length === 1 || admins.length > 1) {
    lastAdminActivityTime = Date.now();
  }

  if (!byPlayer || byPlayer.admin) {
    lastAdminActivityTime = Date.now();
    refreshAllTimeouts(gameState);
  } else {
    refreshTimeout(changedPlayer, gameState);
  }

}

function onPlayerTeamChange(changedPlayer, byPlayer) {  
  let gameState = room.getPlugin('sav/game-state').getGameState();

  if (!byPlayer || byPlayer.admin) {
    lastAdminActivityTime = Date.now();
    refreshAllTimeouts(gameState);
  } else {
    refreshLastActiveTime(byPlayer);
    refreshTimeout(changedPlayer, gameState);
  }
}


function onPlayerKicked(kickedPlayer, reason, ban, byPlayer) {
  if (byPlayer && byPlayer.id !== kickedPlayer.id) {
    let gameState = room.getPlugin('sav/game-state').getGameState();
    lastAdminActivityTime = Date.now();
    refreshAllTimeouts(gameState);
  }
}

function onPlayerLeave(player) {
  removeLastActiveTime(player);
  removeTimeout(player);
}

function onGameStart(player) {
  lastAdminActivityTime = Date.now();
  refreshAllTimeouts(gameStates.STARTED);
}

function onGameStop(player) {
  lastAdminActivityTime = Date.now();
  refreshAllTimeouts(gameStates.STOPPED);
}

function onGamePause(player) {
  lastAdminActivityTime = Date.now();
  refreshAllTimeouts(gameStates.PAUSED);
}

function onGameUnpause(player) {
  lastAdminActivityTime = Date.now();
  refreshAllTimeouts(gameStates.STARTED);
}

function onPlayerActivity(player) {
  if (!player || player.id === 0) return;
  refreshLastActiveTime(player);
  let gameState = room.getPlugin('sav/game-state').getGameState();
  refreshTimeout(player, gameState);
}

/**
 * Updates the last active time of the player with given id to be the current
 * time.
 * 
 * @param {number} player - Id of the player.
 */
function refreshLastActiveTime(player) {
  return lastActiveTimes.set(player.id, Date.now());
}

/**
 * Removes the tracking of last active time from the player with given id.
 * 
 * @param {number} playerId - Id of the player.
 */
function removeLastActiveTime(player) {
  return lastActiveTimes.delete(player.id);
}

/**
 * Removes the warning and kick timeouts from the player with given id.
 * 
 * @param {number} playerId - Id of the player.
 */
function removeTimeout(player) {
  let timeout = afkTimeouts.get(player.id);
  if (timeout) clearTimeout(timeout);
  timeout = warnAfkTimeouts.get(player.id);
  if (timeout) clearTimeout(timeout);
  afkTimeouts.delete(player.id);
  warnAfkTimeouts.delete(player.id);
}

/**
 * Refreshes the warn and kick timeouts of all players in the room.
 */
function refreshAllTimeouts(gameState) {
  const players = room.getPlayerList().filter((p) => p.id !== 0);
  for (let player of players) {
    refreshTimeout(player, gameState);
  }
}

function getPlayersInTeams() {
  return room.getPlayerList().filter((p) => p.id !== 0 && p.team !== 0);
}

/**
 * Refreshes the kick and warning and kick timeouts of the player with given id.
 * Calculates the new times based on the game state, player admin status and
 * players last active time.
 * 
 * @param {number} playerId - Id of the player.
 */
function refreshTimeout(player, gameState) {
  if (!player) {
    removeLastActiveTime(player);
    removeTimeout(player);
    return;
  }

  let adminsOnly = room.getConfig('adminsOnly');
  if (adminsOnly && !player.admin) return;

  let maxIdleTime = 0;
  let currentTime = Date.now();
  let lastActiveTime = lastActiveTimes.get(player.id);
  lastActiveTime = lastActiveTime || currentTime;

  // determine max idle times for admins
  if (player.admin) {
    let actionIsRequired =
      gameState === gameStates.STOPPED ||
      gameState === gameStates.PAUSED ||
      (gameState !== gameStates.STOPPED && getPlayersInTeams() < 1)

    if (actionIsRequired) {
      maxIdleTime = room.getConfig('maxAdminIdleTime');
      lastActiveTime = lastActiveTime < lastAdminActivityTime 
        ? lastAdminActivityTime 
        : lastActiveTime;

    } else if (gameState !== gameStates.STOPPED && player.team !== 0) {
      maxIdleTime = room.getConfig('maxIdleTimeWhenPlaying');
      // ignore the last active time so players dont kicked straight away when
      // moved to team or when game is started
      lastActiveTime = currentTime;

    } else {
      maxIdleTime = room.getConfig('maxIdleTime');
    }

  // determine max idle times for players
  } else {
    if (gameState !== gameStates.STOPPED && player.team !== 0) {
      maxIdleTime = room.getConfig('maxIdleTimeWhenPlaying');
      // ignore the last active time so players dont kicked straight away when
      // moved to team or when game is started
      lastActiveTime = currentTime;
    } else {
      maxIdleTime = room.getConfig('maxIdleTime');
    }
  }

  maxIdleTimeInMs = maxIdleTime * 1000;
  maxIdleTimeInMs -= currentTime - lastActiveTime;
  let timeToWarn = maxIdleTimeInMs - (room.getConfig('warnBefore') * 1000);

  removeTimeout(player);
  debug(`Kicking ${player.name} in ${maxIdleTimeInMs / 1000} seconds.`);
  
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
  let msg = `Show you are not AFK or get kicked in ${room.getConfig('warnBefore')} seconds.`
  room.sendAnnouncement(msg, playerId, 0xFF0000);
}

room.onRoomLink = function onRoomLink() {
  gameStates = room.getPlugin('sav/game-state').states;
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
}
