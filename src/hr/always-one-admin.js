/**
 * Plugin that ensures there is always one admin in the room
 * for Headless Haxball Manager (HHM).
 * 
 * The plugin gives admins to first player that join and passes the
 * admin to someone else if the only admin leaves.
 * 
 * Kicks admins that are afk if `kickAfk` is set to true.
 * 
 * Code has been ripped off from the Haxball Headless Wiki.
 * https://github.com/haxball/haxball-issues/wiki/Headless-Host
 */

let room = HBInit();
room.pluginSpec = {
  name: `hr/always-one-admin`,
  author: `salamini`,
  version: `1.0.0`,
  config: {
    // If this is true then admins that are afk are kicked.
    kickAfk: false,
    // Max time admin can be afk in minutes.
    maxAfkTime: 5,
    // Message to send when afk admin is kicked.
    kickMessage: 'AFK'
  },
};

let adminAfkTimeouts = new Map();

// If there are no admins left in the room give admin to one of the remaining players.
function updateAdmins() { 
  // Get all players except the host (id = 0 is always the host)
  var players = room.getPlayerList().filter((player) => player.id != 0 );
  if ( players.length == 0 ) return; // No players left, do nothing.
  if ( players.find((player) => player.admin) != null ) return; // There's an admin left so do nothing.
  room.setPlayerAdmin(players[0].id, true); // Give admin to the first non admin player in the list
}

function kickInactiveAdmin(playerId) {
  const kickMessage = room.pluginSpec.config.kickMessage;
  room.kickPlayer(playerId, kickMessage, false);
}

function setAfkTimeout(playerId) {
  if (!room.pluginSpec.config.kickAfk) return;
  let maxAfkTime = room.pluginSpec.config.maxAfkTime * 1000 * 60;
  let oldTimeout = adminAfkTimeouts.get(playerId);
  if (oldTimeout) clearTimeout(oldTimeout);
  let timeout = setTimeout(kickInactiveAdmin, maxAfkTime, playerId);
  adminAfkTimeouts.set(playerId, timeout);
}

function removeAfkTimeout(playerId) {
  adminAfkTimeouts.delete(playerId);
}

room.onPlayerJoin = function onPlayerLeave(player) {
  if (player.admin) setAfkTimeout(player.id);
  updateAdmins();
}

room.onPlayerLeave = function onPlayerLeave(player) {
  removeAfkTimeout(player.id);
  updateAdmins();
}

room.onPlayerAdminChange = function onPlayerAdminChange(changedPlayer, byPlayer) {
  if (changedPlayer.admin) {
    setAfkTimeout(changedPlayer.id);
  } else {
    removeAfkTimeout(changedPlayer.id);
  }
}

room.onPlayerActivity = function onPlayerActivity(player) {
  if (player.team !== 0 && player.admin) {
    setAfkTimeout(player.id);
  }
};
