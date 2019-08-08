/**
 * Spam protection plugin for Headless Haxball Manager (HHM).
 */

var room = HBInit();

room.pluginSpec = {
  name: `hr/spam`,
  author: `salamini`,
  version: `1.1.0`,
  config: {
    // If buffer fills within this interval then action is taken.
    // The unit is milliseconds.
    interval: 5000,
    // How many messages within the interval before player is warned.
    warnBuffer: 3,
    // How many messages within the interval before player is banned.
    maxBuffer: 4,
    // How many similar messages before player is warned.
    warnSimilar: 3,
    // How many similar messages before player is banned.
    maxSimilar: 4,
    // Message to send when warning player for spamming.
    warningMessage: `STOP SPAMMING OR YOU WILL BE BANNED/KICKED`,
    // Message to send when warning player for repeating himself.
    warningMessageOnSimilar: `STOP REPEATING YOURSELF OR YOU WILL BE ` +
      `BANNED/KICKED`,
    // Message to send when player gets banned/kicked for spamming.
    banMessage: `SPAM`,
    // Whether to ban the spammers or not.
    ban: true,
    // Do not ban/kick players protected by the `hr/ban-protection` plugin.
    ignoreProtected: true
  },
  order: {
    onPlayerChat: {
      before: [`sav/commands`],
    }
  }
};

let messageBuffers = new Map();
let similarMessages = new Map();

function warnPlayer(player, onSimilar = false) {
  let warningMessage;
  if (onSimilar) {
    warningMessage = room.getConfig('warningMessageOnSimilar');
  } else {
    warningMessage = room.getConfig('warningMessage');
  }
  room.sendAnnouncement(warningMessage, player.id, 0xFF0000);
}

function banPlayer(player) {
  let banMessage = room.getConfig('banMessage');
  let ban = room.getConfig('ban');
  room.kickPlayer(player.id, banMessage, ban);
}

function onPlayerJoin(player) {
  messageBuffers.set(player.id, []);
  similarMessages.set(player.id, { counter: 0, message: ''});
}

function onPlayerLeave(player) {
  messageBuffers.delete(player.id);
  similarMessages.delete(player.id);
}

function onPlayerChat(player, message) {
  let banProtection = room.getPlugin('hr/ban-protection');
  if (banProtection && room.getConfig('ignoreProtected')) {
    let roles = room.getPlugin('sav/roles');
    let protectedRoles = banProtection.getConfig('protectedRoles');
    for (let role of protectedRoles) {
      if (roles.hasPlayerRole(player.id, role)) return;
    }
  }

  // make sure the player has the needed Maps to keep track of stuff
  if (!messageBuffers.has(player.id)) messageBuffers.set(player.id, []);
  if (!similarMessages.has(player.id)) {
    similarMessages.set(player.id, { counter: 0, message: ''});
  }

  // flag to prevent warning player twice
  let hasBeenWarned = false;

  // check for similar messages
  let lastMessage = similarMessages.get(player.id).message;
  let counter = similarMessages.get(player.id).counter;
  if (message === lastMessage) {
    counter++;
    let warnSimilar = room.pluginSpec.config.warnSimilar;
    let maxSimilar = room.pluginSpec.config.maxSimilar;
    if (counter >= maxSimilar) {
      banPlayer(player);
      return;
    } else if (counter >= warnSimilar) {
      warnPlayer(player, true);
      hasBeenWarned = true;
    }
  } else {
    lastMessage = message;
    counter = 0;
  }
  similarMessages.set(player.id, { counter: counter, message: lastMessage });

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
  if (updatedBuffer.length > maxBuffer) {
    banPlayer(player);
    return;
  } else if (updatedBuffer.length > warnBuffer) {
    if (!hasBeenWarned) warnPlayer(player, false);
  }
  messageBuffers.set(player.id, updatedBuffer);

}

room.onRoomLink = function onRoomLink() {
  room.onPlayerJoin = onPlayerJoin;
  room.onPlayerChat = onPlayerChat;
  room.onPlayerLeave = onPlayerLeave;
}
