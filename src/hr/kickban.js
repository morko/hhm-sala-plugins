/**
 * This is a Haxball Headless Manager plugin that keeps track of banned
 * players and offers some commands to control the kicking inside rooms.
 * 
 * Exports `bannedPlayers`, `ban`, `unban` and `kick` functions.
 * 
 * If `sav/commands` and `sav/roles` plugins are available, then this plugin
 * also provides commands `clearbans`, `kick`, `ban`, `unban` and `banlist` to
 * be used with `admin` and `host` roles.
 */
let room = HBInit();

room.pluginSpec = {
  name: `hr/kickban`,
  author: `salamini`,
  version: `1.1.0`,
  config: {},
  dependencies: [ 'sav/help', 'sav/commands', 'sav/roles' ],
  order: {},
  incompatible_with: [],
};

let bannedPlayerMap = new Map();
let pendingUnbans = new Set();

// Roles that can use the in room commands.
let allowedRoles = ['admin', 'host'];

/**
 *  Keep track of banned players. 
 */
room.onPlayerKicked = function(kickedPlayer, reason, ban, byPlayer) {
  if (ban) {
    // Make sure there is no unban pending for the player.
    if (!pendingUnbans.has(kickedPlayer.id)) {
      bannedPlayerMap.set(kickedPlayer.id, kickedPlayer);
    } else {
      pendingUnbans.delete(kickedPlayer.id);
    }
  } 
}

/**
 * Extend the native room.clearBan function so that the player will
 * get removed from the banned players.
 */
room.extend('clearBan', ({ previousFunction }, playerId) => {
  previousFunction(playerId);
  // If the player ban was cleared in the onPlayerKicked handler of other
  // plugin then the player is probably not yet added to the bannedPlayerMap
  // and Map.delete will return false. To be able to delete the ban from
  // the list we add it to pendingUnbans that will be checked in this
  // plugins onPlayerKicked 
  if (!bannedPlayerMap.delete(playerId)) {
    pendingUnbans.add(playerId);
  }
});

/**
 * Extend the native room.clearBans function so that banlist is emptied.
 */
room.extend('clearBans', ({ previousFunction }) => {
  previousFunction();
  bannedPlayerMap = new Map();
});

/**
 * Gets the player object with given player name.
 * @param {string} pName - Player name prefixed with @ or without.
 * @returns {object|undefined} - Player object or undefined if no such player.
 */
function getPlayerWithName(pName) {
  pName = pName.startsWith('@') ? pName.slice(1) : pName;
  let player = room.getPlayerList().filter((p) => p.name === pName)[0];
  return player;
}

room.onCommand1_kick = {
  function: (byPlayer, [pName]) => {
    let roles = room.getPlugin(`sav/roles`);
    if (!roles.ensurePlayerRoles(byPlayer.id, allowedRoles, room)) {
      return;
    }
    let player = getPlayerWithName(pName);
    if (!player) {
      room.sendAnnouncement(`No player with name ${pName}.`, byPlayer.id, 0xFF0000);
      return;
    }
    if (!kick(player.id)) {
      room.sendAnnouncement(`Could not kick player ${pName}.`, byPlayer.id, 0xFF0000);
      return;
    }
  },
  data: {
    'sav/help': {
      text: ' PLAYER_NAME',
      roles: allowedRoles
    }
  }
}


room.onCommand1_ban = {
  function: (byPlayer, [pName]) => {
    let roles = room.getPlugin(`sav/roles`);
    if (!roles.ensurePlayerRoles(byPlayer.id, allowedRoles, room)) {
      return;
    }
    let player = getPlayerWithName(pName);
    if (!player) {
      room.sendAnnouncement(`No player with name ${pName}.`, byPlayer.id, 0xFF0000);
      return;
    }
    if (!ban(player.id)) {
      room.sendAnnouncement(`Could not ban player ${pName}.`, byPlayer.id, 0xFF0000);
      return;
    }
  },
  data: {
    'sav/help': {
      text: ' PLAYER_NAME',
      roles: allowedRoles
    }
  }
}

room.onCommand0_clearbans = {
  function: (byPlayer) => {
    let roles = room.getPlugin(`sav/roles`);
    if (!roles.ensurePlayerRoles(byPlayer.id, allowedRoles, room)) {
      return;
    }
    room.clearBans();
    room.sendAnnouncement(`Bans cleared!`, null, 0x00FF00);
  },
  data: {
    'sav/help': {
      roles: allowedRoles
    }
  }


}
room.onCommand1_unban = {
  function: (byPlayer, [playerId]) => {
    let roles = room.getPlugin(`sav/roles`);
    if (!roles.ensurePlayerRoles(byPlayer.id, allowedRoles, room)) {
      return;
    }
    if (!unban(playerId)) {
      room.sendAnnouncement(
        `Could not remove ban of player with id ${playerId}. `
        + `Make sure that the id matches one in the banlist.`,
        byPlayer.id,
        0xFF0000
      );
    }
  },
  data: {
    'sav/help': {
      text: ' PLAYER_ID (see !banlist for ids)',
      roles: allowedRoles
    }
  }

}

room.onCommand0_banlist = {
  function: (byPlayer) => {
    let roles = room.getPlugin(`sav/roles`);
    if (!roles.ensurePlayerRoles(byPlayer.id, allowedRoles, room)) {
      return;
    }
    let bPlayers = bannedPlayers();
    if (bPlayers.length === 0) {
      room.sendAnnouncement('No banned players.', byPlayer.id, 0xFF0000);
      return;
    }
    let bpList = bPlayers.map((p) =>`id:${p.id} - ${p.name}`)
    room.sendAnnouncement(bpList.join('\n'), byPlayer.id, 0x00FF00);
  },
  data: {
    'sav/help': {
      roles: allowedRoles
    }
  }
}

/**
 * Kicks a player with given id.
 * 
 * @param {string|number} id - Id of the player.
 * @returns {boolean} - Was there a player with given id.
 */
function kick(id) {
  id = parseInt(id);
  let player = room.getPlayer(id);
  if (!player) return false;
  room.kickPlayer(id, 'Bye!', false);
  return true;
}

/**
 * Bans a player with given id.
 * 
 * @param {string|number} id - Id of the player.
 * @returns {boolean} - Was there a player with given id.
 */
function ban(id) {
  id = parseInt(id);
  let player = room.getPlayer(id);
  if (!player) return false;
  room.kickPlayer(id, 'Bye!', true);
  return true;
}

/**
 * Removes a ban of player with given id.
 * 
 * @param {string|number} id - Id of the player.
 * @returns {boolean} - Was there a banned player with given id.
 */
function unban(id) {
  id = parseInt(id);
  let hadPlayer = bannedPlayerMap.has(id);
  room.clearBan(id);
  return hadPlayer;
}

/**
 * Returns an array of banned players.
 * @returns {Array.<object>} - An array of banned Player objects.
 */
function bannedPlayers() {
  let list = [];
  for (let p of bannedPlayerMap.values()) {
    list.push(p);
  }
  return list;
}

room.onRoomLink = function onRoomLink() {
  room.kick = kick;
  room.ban = ban;
  room.unban = unban;
  room.bannedPlayers = bannedPlayers;
}
