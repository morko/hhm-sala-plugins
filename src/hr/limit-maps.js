/**
 * This plugin for Headless Haxball Manager (HHM) limits the maps that can be
 * selected in the room. 
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
  name: `hr/limit-maps`,
  author: `salamini`,
  version: `1.0.0`,
  config: {
    // Map to load when starting the room.
    defaultMap: 'Big',
    // Array of allowed map names.
    allowedMaps: [
      'Big',
      'Classic'
    ]
  },
  dependencies: [`sav/cron`]
};

let currentMap = room.pluginSpec.config.defaultMap;

room.onRoomLink = function onRoomLink() {
  room.setDefaultStadium(room.pluginSpec.config.defaultMap);
}

room.onStadiumChange = function onStadiumChange(newMapName, byPlayer) {
  const allowedMaps = room.pluginSpec.config.allowedMaps;
  let allowedMap = allowedMaps.find((v) => v === newMapName);
  if (allowedMap) {
    currentMap = newMapName;
  } else {
    room.setDefaultStadium(currentMap);
    room.sendChat(`Allowed maps are: ${allowedMaps.join(', ')}.`, byPlayer.id);
  }
}