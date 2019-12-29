/**
 * This plugin for Headless Haxball Manager (HHM) restricts the rooms game mode
 * to given settings.
 *
 * By default all maps are allowed. If you wish to allow only specific maps,
 * then list those in the enabledMaps config property.
 *
 * The default map names in HaxBall are `Classic`, `Easy`, `Small`, `Big`,
 * `Rounded`, `Hockey`, `Big Hockey`, `Big Easy`, `Big Rounded` and `Huge`.
 *
 * You can also restrict the room to use only custom maps.
 * For example to allow only custom map called "Medium" in haxroomie-cli:
 * ```
 * 'hr/game-mode': {
 *   defaultMap: 'Medium',
 *   enabledMaps: [ 'Medium' ]
 * },
 * 'hr/maps': {
 *   maps: {
 *     Medium:
 *       '{"name":"Medium","width":500,"height":250,"spawnDistance":250,"bg":{"type":"grass","width":450,"height":220,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-450,"y":220,"trait":"ballArea"},{"x":-450,"y":70,"trait":"ballArea"},{"x":-450,"y":-70,"trait":"ballArea"},{"x":-450,"y":-220,"trait":"ballArea"},{"x":450,"y":220,"trait":"ballArea"},{"x":450,"y":80,"trait":"ballArea"},{"x":450,"y":-80,"trait":"ballArea"},{"x":450,"y":-220,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-460,"y":-80,"trait":"goalNet"},{"x":-480,"y":-60,"trait":"goalNet"},{"x":-480,"y":60,"trait":"goalNet"},{"x":-460,"y":80,"trait":"goalNet"},{"x":460,"y":-80,"trait":"goalNet"},{"x":480,"y":-60,"trait":"goalNet"},{"x":480,"y":60,"trait":"goalNet"},{"x":460,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-450,80],"p1":[-450,-80],"team":"red"},{"p0":[450,80],"p1":[450,-80],"team":"blue"}],"discs":[{"pos":[-450,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-450,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[450,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[450,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-220,"trait":"ballArea"},{"normal":[0,-1],"dist":-220,"trait":"ballArea"},{"normal":[0,1],"dist":-250,"bCoef":0.1},{"normal":[0,-1],"dist":-250,"bCoef":0.1},{"normal":[1,0],"dist":-500,"bCoef":0.1},{"normal":[-1,0],"dist":-500,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}'
 *   }
 * }
 * ```
 *
 * Commands (by default only available for 'host' role):
 *    !enableMap MAP_NAME (adds the map to allowed maps)
 *    !disableMap MAP_NAME (removes the map from allowed maps)
      !enableAllMaps (allows all maps)
 *    !mapsAvailable (displays all maps that are available to enable)
 *
 * Exports:
 *    gameModePlugin.isRestrictingMaps() (checks if the plugin is restricting maps)
 *    gameModePlugin.isEnabledMap(mapName) (checks if the given map is allowed)
 *
 */

let room = HBInit();
room.pluginSpec = {
  name: `hr/game-mode`,
  author: `salamini`,
  version: `1.0.0`,
  dependencies: ['sav/roles', 'hr/maps'],
  config: {
    // Map to load when starting the room.
    defaultMap: 'Big',
    // Array of enabled map names. Leave empty if you want to allow all.
    enabledMaps: [],
    // Locks the teams on room start if true. Does not enforce the setting.
    lockTeams: true,
    // Sets the time limit on room start. Does not enforce the setting by default.
    timeLimit: 3,
    // Enforce the time limit on game start.
    enforceTimeLimit: false,
    // Sets the score limit on room start. Does not enforce the setting by default.
    scoreLimit: 3,
    // Enforce the score limit on game start.
    enforceScoreLimit: false,
    // Roles that are allowed to use the commands.
    allowedRoles: ['host']
  }
};

const DEFAULT_MAPS = [
  'Classic',
  'Easy',
  'Small',
  'Big',
  'Rounded',
  'Hockey',
  'Big Hockey',
  'Big Easy',
  'Big Rounded',
  'Huge'
];

let currentMap = room.getConfig('defaultMap');

function isRestrictingMaps() {
  const enabledMaps = room.getConfig('enabledMaps');
  return enabledMaps && Array.isArray(enabledMaps) && enabledMaps.length > 0;
}

function isEnabledMap(mapName) {
  if (!isRestrictingMaps()) return true;
  const enabledMaps = room.getConfig('enabledMaps');
  let allowedMap = enabledMaps.find(v => v === mapName);
  return !!allowedMap;
}

function isValidMap(mapName) {
  if (DEFAULT_MAPS.includes(mapName)) {
    return true;
  } else {
    let mapsPlugin = room.getPlugin('hr/maps');
    if (!mapsPlugin) return false;
    return mapsPlugin.hasMap(mapName);
  }
}

function setMap(mapName) {
  const mapsPlugin = room.getPlugin('hr/maps');
  if (mapsPlugin && mapsPlugin.hasMap(mapName)) {
    return mapsPlugin.setMap(mapName);
  } else {
    room.setDefaultStadium(currentMap);
  }
}

/**
 * Sets the map back to the currentMap.
 * @param {object} [byPlayer] - Player that tried to change the map.
 */
function fallBackToPreviousMap(byPlayer) {
  setMap(currentMap);
  let playerId = byPlayer ? byPlayer.id : null;
  if (playerId === 0) playerId = null;
  if (isRestrictingMaps()) {
    const enabledMaps = room.getConfig('enabledMaps');
    room.sendAnnouncement(
      `Cant change the map! Allowed maps are: ${enabledMaps.join(', ')}.`,
      playerId,
      0xff0000
    );
  } else {
    room.sendAnnouncement(`Cant change the map!.`, playerId, 0xff0000);
  }
}

room.onCommand_mapsAvailable = player => {
  const rolesPlugin = room.getPlugin('sav/roles');
  const allowedRoles = room.getConfig('allowedRoles');
  if (!rolesPlugin.ensurePlayerRoles(player.id, allowedRoles, room)) {
    return false;
  }
  let mapsPlugin = room.getPlugin('hr/maps');
  if (mapsPlugin) {
    mapsPlugin.displayMaps(player.id, true);
  } else {
    let output = 'Maps:\n';
    for (let map of DEFAULT_MAPS) {
      output += `${map}, `;
    }
    output = output.slice(0, -2);
    room.sendAnnouncement(output, id, 0xdf9eff);
  }
};

room.onCommand_enableAllMaps = (player, [mapName]) => {
  const rolesPlugin = room.getPlugin('sav/roles');
  const allowedRoles = room.getConfig('allowedRoles');
  if (!rolesPlugin.ensurePlayerRoles(player.id, allowedRoles, room)) {
    return false;
  }
  room.sendAnnouncement(`All maps allowed.`, player.id, 0xcccccc);
  room.setConfig('enabledMaps', [mapName, ...enabledMaps]);
};

room.onCommand_enableMap = (player, [mapName]) => {
  const rolesPlugin = room.getPlugin('sav/roles');
  const allowedRoles = room.getConfig('allowedRoles');
  if (!rolesPlugin.ensurePlayerRoles(player.id, allowedRoles, room)) {
    return false;
  }
  if (enableMap(mapName)) {
    room.sendAnnouncement(
      `Map ${mapName} was added to allowed maps.`,
      player.id,
      0xcccccc
    );
  } else {
    room.sendAnnouncement(
      `Could not enable ${mapName}. ` +
        `Use !mapsAvailable to see maps and make sure its not already enabled`,
      player.id,
      0xcc0000
    );
  }
};

room.onCommand_disableMap = (player, [mapName]) => {
  const rolesPlugin = room.getPlugin('sav/roles');
  const allowedRoles = room.getConfig('allowedRoles');
  if (!rolesPlugin.ensurePlayerRoles(player.id, allowedRoles, room)) {
    return false;
  }
  if (disableMap(mapName)) {
    room.sendAnnouncement(
      `Map ${mapName} was removed from allowed maps.`,
      player.id,
      0xcccccc
    );
  } else {
    room.sendAnnouncement(
      `Could not disable ${mapName}. ` +
        `Make sure the map is allowed and its not the last enabled map. `,
      player.id,
      0xcc0000
    );
  }
};
/**
 * Enables the given map.
 * @param {string} [mapName] - Map name to enable. Has to be a default map
 *    name or a custom from the hr/maps plugin.
 * @returns {boolean} - True if map was allowed, false if it was invalid.
 */
function enableMap(mapName) {
  if (!isValidMap(mapName)) {
    return false;
  }
  let enabledMaps = isRestrictingMaps() ? room.getConfig('enabledMaps') : [];
  if (enabledMaps.includes(mapName)) {
    return false;
  }
  room.setConfig('enabledMaps', [mapName, ...enabledMaps]);
  return true;
}

/**
 * Removes the given map from allowed maps.
 * @param {string} [mapName] - Map name to remove from allowed maps.
 * @returns {boolean} - True if map was removed, false if it was not found in
 *    allowed maps.
 */
function disableMap(mapName) {
  let enabledMaps;
  if (isRestrictingMaps()) {
    enabledMaps = room.getConfig('enabledMaps');
  } else {
    const mapsPlugin = room.getPlugin('hr/maps');
    let customMaps = [];
    if (mapsPlugin) {
      customMaps = mapsPlugin.getMaps();
      if (!customMaps) customMaps = [];
    }
    enabledMaps = [...customMaps, ...DEFAULT_MAPS];
  }
  if (enabledMaps.length <= 1) return false;
  const newEnabledMaps = [];
  let foundMap = false;
  for (let i = 0; i < enabledMaps.length; i++) {
    if (enabledMaps[i] === mapName) {
      foundMap = true;
    } else {
      newEnabledMaps.push(enabledMaps[i]);
    }
  }
  if (foundMap) {
    room.setConfig('enabledMaps', newEnabledMaps);
  }
  return foundMap;
}

function onStadiumChange(newMapName, byPlayer) {
  if (!isRestrictingMaps()) return;
  if (isEnabledMap(newMapName)) {
    currentMap = newMapName;
  } else {
    fallBackToPreviousMap(byPlayer);
  }
}

function onGameStart(byPlayer) {
  if (!byPlayer || byPlayer.id === 0) return;

  let scores = room.getScores();
  if (!scores) return;

  let timeLimit = room.getConfig('timeLimit') * 60;
  let scoreLimit = room.getConfig('scoreLimit');
  let hasTimeLimit =
    typeof timeLimit !== null || typeof timeLimit !== undefined;
  let hasScoreLimit =
    typeof scoreLimit !== null || typeof scoreLimit !== undefined;

  let enforceTimeLimit = room.getConfig('enforceTimeLimit');
  let enforceScoreLimit = room.getConfig('enforceScoreLimit');

  if (enforceTimeLimit && hasTimeLimit && timeLimit !== scores.timeLimit) {
    room.sendAnnouncement(
      `This room allows only time limit of ${scoreLimit}.`,
      null,
      0xff0000
    );
    room.stopGame();
    room.setTimeLimit(timeLimit);
    room.startGame();
  } else if (
    enforceScoreLimit &&
    hasScoreLimit &&
    scoreLimit !== scores.scoreLimit
  ) {
    room.sendAnnouncement(
      `This room allows only score limit of ${scoreLimit}.`,
      null,
      0xff0000
    );
    room.stopGame();
    room.setScoreLimit(scoreLimit);
    room.startGame();
  }
}

room.onRoomLink = function onRoomLink() {
  room.setTeamsLock(room.getConfig('lockTeams'));
  room.setTimeLimit(room.getConfig('timeLimit'));
  room.setScoreLimit(room.getConfig('scoreLimit'));
  room.onGameStart = onGameStart;
  room.isEnabledMap = isEnabledMap;
  room.isRestrictingMaps = isRestrictingMaps;
  let help = room.getPlugin(`sav/help`);
  if (help) {
    help.registerHelp(`enableAllMaps`, ` (allows all maps)`, {
      roles: room.getConfig('allowedRoles')
    });
    help.registerHelp(`availableMaps`, ` (displays all available maps)`, {
      roles: room.getConfig('allowedRoles')
    });
    help.registerHelp(`enableMap`, ` MAP_NAME (adds the map to allowed maps)`, {
      roles: room.getConfig('allowedRoles')
    });
    help.registerHelp(
      `disableMap`,
      ` MAP_NAME (removes the map from allowed maps)`,
      {
        roles: room.getConfig('allowedRoles')
      }
    );
  }
  let initialMap = room.getConfig('defaultMap');
  if (isRestrictingMaps()) {
    if (isEnabledMap(initialMap)) {
      setMap(initialMap);
    } else {
      console.warn(
        `Could not set default map as "${initialMap}", because its not enabled.`
      );
      initialMap = room.getConfig('enabledMaps')[0];
      setMap(initialMap);
    }
  } else {
    setMap(initialMap);
  }
  room.onStadiumChange = onStadiumChange;
};
