/**
 * This plugin for Haxball Headless Manager enables players to pause the game
 * by writing 'p'. It can also pause game if a player leaves when game has 
 * started.
 */
let room = HBInit();
room.pluginSpec = {
  name: `hr/pause`,
  author: `salamini`,
  version: `1.0.0`,
  dependencies: [
    `sav/game-state`,
  ],
  // All times in the config are in seconds.
  config: {
    // If true, then game is paused if playing player leaves.
    pauseWhenPlayerLeaves: true,
    // If true, players are allowed to pause the game by writing 'p'.
    allowPlayersToPause: true,
    // How many times player can pause game (0 is unlimited).
    maxPauseTimes: 1,
  }
};

let playerPauseCounter = new Map();

function onPlayerLeave(player) {
  const pauseWhenPlayerLeaves = room.getConfig('pauseWhenPlayerLeaves');
  if (pauseWhenPlayerLeaves && player.team !== 0) {
    room.pauseGame(true);
  }
  playerPauseCounter.delete(player.id);
}

function onGameStop() {
  playerPauseCounter = new Map();
}

function onPlayerChat(player, message) {
  if (!player) return;
  if (player.id === 0) return;
  if (player.team === 0) return;
  
  const allowPlayersToPause = room.getConfig('allowPlayersToPause');
  if (!allowPlayersToPause || message !== 'p') return;

  const gameState = room.getPlugin('sav/game-state');
  if (gameState.getGameState() !== gameState.states.STARTED) return;

  let counter = playerPauseCounter.get(player.id);
  if (!counter) {
    counter = 1;
  } else {
    counter++;
  }

  playerPauseCounter.set(player.id, counter);
  
  const maxPauseTimes = room.getConfig('maxPauseTimes');
  if (maxPauseTimes !== 0 && counter > maxPauseTimes) {
    room.sendAnnouncement(
      `You are only allowed to pause ${maxPauseTimes} per game!`,
      player.id,
      0xFF0000
    );
    return;
  }

  room.pauseGame(true);
}

room.onRoomLink = function onRoomLink() {
  room.onPlayerLeave = onPlayerLeave;
  room.onGameStop = onGameStop;
  room.onPlayerChat = onPlayerChat;
}
