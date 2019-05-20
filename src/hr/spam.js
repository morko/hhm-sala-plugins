/**
 * Spam protection plugin for Headless Haxball Manager (HHM).
 */

var room = HBInit();

room.pluginSpec = {
  name: `hr/spam`,
  author: `salamini`,
  version: `1.0.0`,
  config: {
    // If buffer fills within this interval then action is taken.
    // The unit is milliseconds.
    interval: 2000,
    // How many messages within the interval before player is warned.
    warnBuffer: 3,
    // How many messages within the interval before player is banned.
    maxBuffer: 5,
    // Message to send when warnBuffer fills.
    warningMessage: `STOP SPAMMING`,
    // Message to attach in the ban message when maxBuffer fills.
    banMessage: `SPAM`
  },
  order: {
    onPlayerChat: {
      // TODO: temporarily disabled because of bug in HHM
      //before: [`sav/commands`],
    }
  }
};

let messageBuffers = new Map();

function warnPlayer(player) {
  let warningMessage = room.pluginSpec.config.warningMessage;
  room.sendChat(warningMessage, player.id);
}

function banPlayer(player) {
  let banMessage = room.pluginSpec.config.banMessage;
  room.kickPlayer(player.id, banMessage, true);
}

room.onPlayerJoin = function(player) {
  messageBuffers.set(player.id, []);
}

room.onPlayerLeave = function(player) {
  messageBuffers.delete(player.id);
}

room.onPlayerChat = function(player, message) {
  // make sure the player has a messageBuffer set
  if (!messageBuffers.has(player.id)) messageBuffers.set(player.id, []);

  // add new msg timestamp to the messageBuffer
  let currentTime = Math.floor(Date.now());
  let buffer = messageBuffers.get(player.id);
  buffer.push(currentTime);

  // filter out msg timestamps that are outside the interval
  let interval = room.pluginSpec.config.interval;
  let minTime = currentTime - interval;
  let updatedBuffer = buffer.filter((t) => t > minTime);

  // check that the buffer has not reached its limits
  let maxBuffer = room.pluginSpec.config.maxBuffer;
  let warnBuffer = room.pluginSpec.config.warnBuffer;
  if (updatedBuffer.length > maxBuffer) banPlayer(player);
  else if (updatedBuffer.length > warnBuffer) warnPlayer(player);
  messageBuffers.set(player.id, updatedBuffer);
}
