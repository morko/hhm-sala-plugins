/**
 * This plugin for Headless Haxball Manager (HHM) restricts the rooms game mode
 * to given settings.
 * 
 * Works only with the default HaxBall maps!
 * 
 * By default only maps named `Big` and `Classic` are allowed.
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
    defaultMap: 'Big',
    // Array of allowed map names. 
    allowedMaps: [
      'Big',
      'Classic'
    ],
    // Locks the teams on room start if true. Does not enforce the setting.
    lockTeams: true,
    // Sets the time limit on room start. Does not enforce the setting.
    timeLimit: 3,
    // Sets the score limit on room start. Does not enforce the setting.
    scorelimit: 3
  }
};

let currentMap = room.getConfig('defaultMap');

function onStadiumChange(newMapName, byPlayer) {
  const allowedMaps = room.getConfig('allowedMaps');
  if (!allowedMaps) return;
  let allowedMap = allowedMaps.find((v) => v === newMapName);
  if (allowedMap) {
    currentMap = newMapName;
  } else {
    room.setDefaultStadium(currentMap);
    room.sendChat(`Allowed maps are: ${allowedMaps.join(', ')}.`, byPlayer.id);
  }
}

room.onRoomLink = function onRoomLink() {
  room.setDefaultStadium(room.getConfig('defaultMap'));
  room.setTeamsLock(room.getConfig('lockTeams'));
  room.setTimeLimit(room.getConfig('timeLimit'));
  room.setScoreLimit(room.getConfig('scoreLimit'));
  room.onStadiumChange = onStadiumChange;
}
