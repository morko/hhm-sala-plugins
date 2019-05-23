/**
 * This plugin for Headless Haxball Manager (HHM) makes it more easy to keep
 * track of the current game state
 */
let room = HBInit();
room.pluginSpec = {
  name: `hr/afk-monitor`,
  author: `salamini`,
  version: `1.0.0`,
  dependencies: [`sav/cron`],
  config: {
    // If this is true the plugin affects admins only.
    adminsOnly: true,
    // Max time player can be afk in seconds.
    maxIdleTime: 5 * 60,
    // Max time player can be afk when they are playing.
    maxIdleTimeWhenPlaying: 15,
    maxIdleTimeWhenPaused: 30,
    maxAdminIdleTimeWhenPaused: 15,
    maxAdminIdleTimeWhenStopped: 20,
    warnBefore: 7,
    // Message to send to player when he is kicked.
    kickMessage: 'AFK'
  },
};

let afkTimeouts = new Map();
let warnAfkTimeouts = new Map();
let lastActiveTimes = new Map();

// Simple Game Manager that holds the game states.
const GM = {
  states: {
    stopped: 0,
    started: 1,
    paused: 2
  },
  _gameState: 0,
  get gameState() {
    return this._gameState;
  },
  set gameState(val) {
    this._gameState = val;
    onGameStateChanged(val);
  }
}

function onGameStart(player) {
  GM.gameState = GM.states.started;
  if (player) onAdminActivity(player);
}

function onGameStop(player) {
  GM.gameState = GM.states.stopped;
  if (player) onAdminActivity(player);
}

function onGamePause(player) {
  GM.gameState = GM.states.paused;
  if (player) onAdminActivity(player);
}

function onGameUnpause(player) {
  GM.gameState = GM.states.started;
  if (player) onAdminActivity(player);
}

function onPlayerChat(player) {
  onPlayerActivity(player);
}

function onPlayerAdminChange(changedPlayer, byPlayer) {
  onAdminActivity(byPlayer);
}

function onPlayerTeamChange(changedPlayer, byPlayer) {
  if (byPlayer) onAdminActivity(byPlayer);
}

function onPlayerKicked(kickedPlayer, reason, ban, byPlayer) {
  if (byPlayer) onAdminActivity(byPlayer);
}

function onPlayerJoin(player) {
  refreshTimeout(player.id);
}

function onPlayerLeave(player) {
  lastActiveTimes.delete(player.id);
  removeTimeout(player.id);
}

function onGameStateChanged(state) {
  switch (state) {
    case GM.states.stopped:
      break;
    case GM.states.started:
      refreshTimeouts();
      break;
    case GM.states.paused:
      refreshTimeouts();
      break;
  }
}

function onPlayerActivity(player) {
  if (player.id === 0) return;
  refreshLastActiveTime(player.id);
  refreshTimeout(player.id);
}

/**
 * Handler for activities that only admins can do.
 * @param {object} player - HaxBall PlayerObject
 */
function onAdminActivity(player) {
  if (player.id === 0) return;
  refreshLastActiveTime(player.id);
  refreshTimeout(player.id);
}

/**
 * Returns Array of player ids that are admins.
 */
function getAdminIds() {
  return room.getPlayerList()
    .filter((p) => p.id != 0 && p.admin)
    .map((p) => p.id);
}

/**
 * Returns array of players in the room.
 */
function getPlayerIds() {
  return room.getPlayerList().filter((p) => p.id != 0 ).map((p) => p.id);
}

function refreshLastActiveTimes(players) {
  if (!players) {
    players = getPlayerIds();
  }
  for (let playerId of players) {
    refreshLastActiveTime(playerId);
  }
}

function refreshLastActiveTime(playerId) {
  lastActiveTimes.set(playerId, Math.floor(Date.now()));
}

function removeTimeouts(players) {
  if (!players) {
    players = getPlayerIds();
  }
  for (let playerId of players) {
    removeTimeout(playerId);
  }
}

function removeTimeout(playerId) {
  let timeout = afkTimeouts.get(playerId);
  if (timeout) clearTimeout(timeout);
  timeout = warnAfkTimeouts.get(playerId);
  if (timeout) clearTimeout(timeout);
  afkTimeouts.delete(playerId);
  warnAfkTimeouts.delete(playerId);
}

function refreshTimeouts(players) {
  if (!players) {
    players = getPlayerIds();
  }
  for (let playerId of players) {
    refreshTimeout(playerId);
  }
  // remove ghost players
  for (let [playerId, timeout] of afkTimeouts) {
    if (!room.getPlayer(playerId)) removeTimeout(playerId);
  }
}

function refreshTimeout(playerId) {
  let player = room.getPlayer(playerId);
  if (!player) {
    lastActiveTimes.delete(player.id);
    removeTimeout(playerId);
    return;
  }

  let maxIdleTime = 0;
  let currentTime = Math.floor(Date.now());
  let lastActiveTime = lastActiveTimes.get(player.id);
  lastActiveTime = lastActiveTime || currentTime;

  switch (GM.gameState) {
    case GM.states.stopped:
      maxIdleTime = room.getConfig('maxIdleTime');
      break;

    case GM.states.started:
      if (player.team === 0) {
        maxIdleTime = room.getConfig('maxIdleTime');
      } else {
        maxIdleTime = room.getConfig('maxIdleTimeWhenPlaying');
        lastActiveTime = currentTime;
      }
      break;

    case GM.states.paused:
      if (player.team === 0) {
        maxIdleTime = room.getConfig('maxIdleTime');
      } else {
        maxIdleTime = room.getConfig('maxIdleTimeWhenPaused');
        lastActiveTime = currentTime;
      }
      break;
  }

  maxIdleTimeInMs = maxIdleTime * 1000;
  maxIdleTimeInMs -= currentTime - lastActiveTime;
  let timeToWarn = maxIdleTimeInMs - (room.getConfig('warnBefore') * 1000);

  removeTimeout(player.id);

  let timeout = setTimeout(kickInactivePlayer, maxIdleTimeInMs, player.id);
  let warnTimeout = setTimeout(warnInactivePlayer, timeToWarn, player.id);
  afkTimeouts.set(player.id, timeout);
  warnAfkTimeouts.set(player.id, warnTimeout);
}

function kickInactivePlayer(playerId) {
  const kickMessage = room.getConfig('kickMessage');
  room.kickPlayer(playerId, kickMessage, false);
}

function warnInactivePlayer(playerId) {
  let timeLeftBeforeKicked = room.getConfig('warnBefore');
  room.sendChat(
    `Press movement keys or X or you will be kicked for being AFK in ${timeLeftBeforeKicked} seconds!`,
    playerId
  );
}

room.onRoomLink = function onRoomLink() {
  room.onGameStart = onGameStart;
  room.onGameStop = onGameStop;
  room.onGamePause = onGamePause;
  room.onGameUnpause = onGameUnpause;
  room.onPlayerChat = onPlayerChat;
  room.onPlayerAdminChange = onPlayerAdminChange;
  room.onPlayerTeamChange = onPlayerTeamChange;
  room.onPlayerKicked = onPlayerKicked;
  room.onPlayerJoin = onPlayerJoin;
  room.onPlayerLeave = onPlayerLeave;
  room.onPlayerActivity = onPlayerActivity;
}
