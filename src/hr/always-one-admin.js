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
};

// If there are no admins left in the room give admin to one of the remaining players.
function updateAdmins() { 
  // Get all players except the host (id = 0 is always the host)
  var players = room.getPlayerList().filter((player) => player.id != 0 );
  if ( players.length == 0 ) return; // No players left, do nothing.
  if ( players.find((player) => player.admin) != null ) return; // There's an admin left so do nothing.
  room.setPlayerAdmin(players[0].id, true); // Give admin to the first non admin player in the list
}

function onPlayerJoin(player) {
  updateAdmins();
}

function onPlayerLeave(player) {
  updateAdmins();
}

room.onRoomLink = function onRoomLink() {
  room.onPlayerLeave = onPlayerLeave;
  room.onPlayerJoin = onPlayerJoin;
}
