/**
 * This Haxball Headless Manager (HHM) plugin provides protection against
 * unwanted banning of players.
 * 
 * If player that **is not** protected bans a player that is protected
 * the banner gets banned himself and the banned player gets unbanned.
 * 
 * If player that **is** protected bans another protected player
 * the player does not get banned but the banned player gets unbanned.
 * 
 * If `allowOnlyProtectedRolesToBan` is set to `true`, then the plugin also
 * bans all unprotected players that are trying to ban other players and r
 * removes the ban they were trying to execute.
 * 
 * Depends on `sav/roles` plugin of the default HHM plugin repository.
 */

var room = HBInit();

room.pluginSpec = {
  name: `hr/ban-protection`,
  author: `salamini`,
  version: `1.0.0`,
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
    violationMessage: 'You should have not tried to ban that player!',
    // If this is `true` the violators will get banned. Otherwise kicked.
    banTheBanners: false
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

function onPlayerKicked(bannedPlayer, reason, ban, byPlayer) {
  if (!ban) return;
  if (byPlayer.id === 0) return;
  
  const violationMessage = room.pluginSpec.config.violationMessage;
  const banTheBanners = room.pluginSpec.config.banTheBanners;
  const allowOnlyProtectedRolesToBan = room.pluginSpec.config.allowOnlyProtectedRolesToBan;

  const bannedIsProtected = isPlayerProtected(bannedPlayer.id);
  const bannerIsProtected = isPlayerProtected(byPlayer.id);

  if (bannedIsProtected) {
    room.clearBan(bannedPlayer.id);
    if (!bannerIsProtected) {
      room.kickPlayer(byPlayer.id, violationMessage, banTheBanners);
    }
  } else if (allowOnlyProtectedRolesToBan && !bannerIsProtected) {
    room.kickPlayer(byPlayer.id, violationMessage, banTheBanners);
    room.clearBan(bannedPlayer.id);
  }

  room.onRoomLink = function onRoomLink() {
    room.onPlayerKicked = onPlayerKicked;
  }
}