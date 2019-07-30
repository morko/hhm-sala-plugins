/**
 * Message Of The Day plugin for Haxball Headless Manager (HHM).
 * 
 * Displays a message when player joins and suppoorts repeating
 * a message once in every x minutes.
 */

let room = HBInit();
room.pluginSpec = {
  name: `hr/motd`,
  author: `salamini`,
  version: `1.1.0`,
  config: {
    // Message to be displayed when player joins.
    // You can use {player} to address the joined player.
    // e.g. `Welcome, {player}!`
    joinMessage: `Welcome {player}! Type !help for commands.`,
    // Message to be displayed repeatedly at speed of given `interval`.
    repeatedMessage: ``,
    // How often to display the `repeatedMessage` (or `message` if former 
    // is missing).
    // Time is in minutes. Set to 0 to disable the repeated message.
    interval: 10,
    // This setting exists only for backwards compability.
    message: ``,
  },
  dependencies: [`sav/cron`]
};

let currentInterval = room.getConfig('interval');

function getJoinMessage(player) {
  let msg = '';
  msg = room.getConfig('joinMessage');
  msg = parseJoinMessage(msg, player);
  if(!msg) msg = room.getConfig('message');
  return msg;
}

function getRepeatedMessage() {
  let msg = '';
  msg = room.getConfig('repeatedMessage');
  if(!msg) msg = room.getConfig('message');
  return msg;
}

function parseJoinMessage(msg, player) {
  let newMsg = msg;
  if (msg && typeof msg === 'string') {
    newMsg = msg.replace(/{\s*player\s*}/g, `@${player.name}`);
  }
  return newMsg;
}

function onPlayerJoin(player) {
  let msg = getJoinMessage(player);
  room.sendAnnouncement(msg, player.id, 0x00FF00);
}

function displayMessageOnceIn(interval) {
  if (parseInt(interval) > 0 && getRepeatedMessage()) {
    room[`onCron${interval}Minutes`] = () => {
      const message = getRepeatedMessage();
      room.sendAnnouncement(message, null, 0x00FF00);
    }
  }
}

room.onCommand0_motd = (player) => {
  const message = room.getConfig('message');
  room.sendAnnouncement(message, player.id, 0x00FF00);
}

room.onConfigSet = () => {
  if (currentInterval) delete room[`onCron${currentInterval}Minutes`];
  let newInterval = room.getConfig('interval');
  currentInterval = newInterval;
  displayMessageOnceIn(currentInterval);
}

room.onRoomLink = function onRoomLink() {
  room.onPlayerJoin = onPlayerJoin;
  displayMessageOnceIn(currentInterval);
}
