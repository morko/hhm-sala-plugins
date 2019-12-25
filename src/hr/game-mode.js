/**
 * This plugin for Headless Haxball Manager (HHM) restricts the rooms game mode
 * to given settings.
 *
 * By default only maps named `Big` and `Classic` are allowed.
 *
 * Works with hr/maps plugin so that the maps that user has set there are
 * automatically allowed.
 *
 * The default map names in HaxBall are `Classic`, `Easy`, `Small`, `Big`,
 * `Rounded`, `Hockey`, `Big Hockey`, `Big Easy`, `Big Rounded` and `Huge`.
 */

let room = HBInit();
room.pluginSpec = {
  name: `hr/game-mode`,
  author: `salamini`,
  version: `1.0.0`,
  config: {
    // Map to load when starting the room.
    defaultMap: "Big",
    // Array of allowed map names.
    allowedMaps: ["Big", "Classic"],
    // Locks the teams on room start if true. Does not enforce the setting.
    lockTeams: true,
    // Sets the time limit on room start. Does not enforce the setting by default.
    timeLimit: 3,
    // Enforce the time limit on game start.
    enforceTimeLimit: false,
    // Sets the score limit on room start. Does not enforce the setting by default.
    scoreLimit: 3,
    // Enforce the score limit on game start.
    enforceScoreLimit: false
  }
};

let currentMap = room.getConfig("defaultMap");

function onStadiumChange(newMapName, byPlayer) {
  const allowedMaps = room.getConfig("allowedMaps");
  if (!allowedMaps) return;
  let allowedMap = allowedMaps.find(v => v === newMapName);

  if (allowedMap) {
    currentMap = newMapName;
  } else {
    if (isCustomMap(newMapName)) {
      currentMap = newMapName;
      return;
    }
    fallBackToPreviousMap(byPlayer);
  }
}

/**
 * Checks if the given map was loaded with 'hr/maps' plugin.
 * @param {string} mapName
 */
function isCustomMap(mapName) {
  const mapsPlugin = room.getPlugin("hr/maps");
  if (mapsPlugin) {
    const maps = Object.keys(mapsPlugin.getConfig("maps"));
    return maps.find(v => v === mapName);
  }
}

/**
 * Sets the map back to the currentMap.
 * @param {object} [byPlayer] - Player that tried to change the map.
 */
function fallBackToPreviousMap(byPlayer) {
  const mapsPlugin = room.getPlugin("hr/maps");

  if (isCustomMap(currentMap)) {
    mapsPlugin.setMap(currentMap);
  } else {
    room.setDefaultStadium(currentMap);
  }

  const allowedDefaultMaps = room.getConfig("allowedMaps")
    ? room.getConfig("allowedMaps")
    : [];
  const allowedCustomMaps = Object.keys(mapsPlugin.getConfig("maps"));
  const allowedMaps = allowedDefaultMaps.concat(allowedCustomMaps);

  let playerId = byPlayer ? byPlayer.id : null;
  if (playerId === 0) playerId = null;
  room.sendAnnouncement(
    `Allowed maps are: ${allowedMaps.join(", ")}.`,
    playerId,
    0xff0000
  );
}

function onGameStart(byPlayer) {
  if (!byPlayer || byPlayer.id === 0) return;

  let scores = room.getScores();
  if (!scores) return;

  let timeLimit = room.getConfig("timeLimit") * 60;
  let scoreLimit = room.getConfig("scoreLimit");
  let hasTimeLimit =
    typeof timeLimit !== null || typeof timeLimit !== undefined;
  let hasScoreLimit =
    typeof scoreLimit !== null || typeof scoreLimit !== undefined;

  let enforceTimeLimit = room.getConfig("enforceTimeLimit");
  let enforceScoreLimit = room.getConfig("enforceScoreLimit");

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
  room.setDefaultStadium(room.getConfig("defaultMap"));
  room.setTeamsLock(room.getConfig("lockTeams"));
  room.setTimeLimit(room.getConfig("timeLimit"));
  room.setScoreLimit(room.getConfig("scoreLimit"));
  room.onStadiumChange = onStadiumChange;
  room.onGameStart = onGameStart;
};
