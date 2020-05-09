/**
 * This Haxball Headless Manager (HHM) plugin provides protection against
 * unwanted banning and kicking of players.
 * 
 * If player that **is not** protected bans/kicks a player that is protected
 * the banner gets banned/kicked himself and the banned player gets unbanned.
 * 
 * If player that **is** protected bans/kicks another protected player
 * the player does not get banned but the banned player gets unbanned.
 * 
 * If `allowOnlyProtectedRolesToBan` is set to `true`, then the plugin also
 * bans all unprotected players that are trying to ban other players and
 * removes the ban.
 * 
 * Depends on `sav/roles` plugin of the default HHM plugin repository.
 */

var room = HBInit();

room.pluginSpec = {
  name: `hr/ban-protection`,
  author: `salamini`,
  version: `1.1.0`,
  config: {
    // Protected roles that cannot be banned.
    protectedRoles: [
      'admin',
      'host'
    ],
    // If this is `true` only the players with roles listed in `protectedRoles`
    // are allowed to ban players. Players without protected role will still
    // get kicked / banned if they ban player with protected role.
    allowOnlyProtectedRolesToBan: false,
    // Message to display when kicking / banning.
    violationMessage: 'Tried to kick or ban a protected player!',
    // If this is `true` the violators will get banned. Otherwise kicked.
    banTheBanners: false,
    // If this is `true` the protection will also apply for kicking.
    protectFromKicks: true
  },
  dependencies: [`sav/roles`]
};


/**
 * Checks if the player with given id is protected against ban based on the
 * `config.protectedRoles` property.
 * 
 * @param {number} playerId - The players id.
 * @returns {boolean} - Is the player protected.
 */
function isPlayerProtected(playerId) {
  const protectedRoles = room.pluginSpec.config.protectedRoles;

  if (!Array.isArray(protectedRoles)) {
    return false;
  }
  const roles = room.getPlugin(`sav/roles`);

  for (let role of protectedRoles) {
    if (roles.hasPlayerRole(playerId, role)) {
      return true;
    }
  }
  return false;
}

function onPlayerKicked(kickedPlayer, reason, ban, byPlayer) {
  if (!ban && !room.getConfig('protectFromKicks')) return;
  if (!byPlayer || byPlayer.id === 0) return;
  
  const violationMessage = room.pluginSpec.config.violationMessage;
  const banTheBanners = room.pluginSpec.config.banTheBanners;
  const allowOnlyProtectedRolesToBan = room.pluginSpec.config.allowOnlyProtectedRolesToBan;

  const kickedIsProtected = isPlayerProtected(kickedPlayer.id);
  const kickerIsProtected = isPlayerProtected(byPlayer.id);

  if (kickedIsProtected) {
    room.clearBan(kickedPlayer.id);
    if (!kickerIsProtected) {
      room.kickPlayer(byPlayer.id, violationMessage, banTheBanners);
    }
  } else if (ban && allowOnlyProtectedRolesToBan && !kickerIsProtected) {
    room.kickPlayer(byPlayer.id, violationMessage, banTheBanners);
    room.clearBan(kickedPlayer.id);
  }
}

room.onRoomLink = function onRoomLink() {
  room.onPlayerKicked = onPlayerKicked;
}