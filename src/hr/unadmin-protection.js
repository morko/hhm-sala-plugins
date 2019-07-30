/**
 * This Haxball Headless Manager (HHM) plugin provides protection against
 * unwanted removing of admins.
 * 
 * Protects roles from loosing admin. Default protected roles are `admin`
 * and `host`.
 */
var room = HBInit();
 
room.pluginSpec = {
  name: `hr/unadmin-protection`,
  author: `salamini`,
  version: `1.0.0`,
  config: {
    // Protected roles that cannot be unadmined.
    protectedRoles: [
      'admin',
      'host'
    ],
    // Message to display when kicking if kick is `true`.
    violationMessage: 'You should not have tried to unadmin that player!',
    // If this is `true` the violators will get kicked. Otherwise they just
    // loose their admin.
    kick: false,
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

function onPlayerAdminChange(changedPlayer, byPlayer) {
  if (!byPlayer || byPlayer.id === 0) return;
  if (changedPlayer.admin) return;
  if (changedPlayer.id === byPlayer.id) return;

  const violationMessage = room.pluginSpec.config.violationMessage;
  const kick = room.pluginSpec.config.kick;

  const unadminedIsProtected = isPlayerProtected(changedPlayer.id);
  const unadminerIsProtected = isPlayerProtected(byPlayer.id);

  if (unadminedIsProtected) {
    room.setPlayerAdmin(changedPlayer.id, true);
    if (!unadminerIsProtected) {
      if (kick) {
        room.kickPlayer(byPlayer.id, violationMessage, false);
      } else {
        room.setPlayerAdmin(byPlayer.id, false);
      }
    }
  }
}

room.onRoomLink = function onRoomLink() {
  room.onPlayerAdminChange = onPlayerAdminChange;
}