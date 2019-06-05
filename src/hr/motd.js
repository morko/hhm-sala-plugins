/**
 * Message Of The Day plugin for Haxball Headless Manager (HHM).
 * 
 * Displays a message when player joins and repeats it once in
 * every x minutes.
 */

let room = HBInit();
room.pluginSpec = {
  name: `hr/motd`,
  author: `salamini`,
  version: `1.0.0`,
  config: {
    // Message Of The Day.
    message: `Join https://discord.gg/TeJAEWu for support.`,
    // How often to display the message in minutes.
    // Set to 0 to disable displaying it repeatedly.
    interval: 10
  },
  dependencies: [`sav/cron`]
};

function onPlayerJoin(player) {
  const message = room.getConfig('message');
  room.sendChat(message, player.id);
}

function displayMessageOnceIn(interval, message) {
  if (parseInt(interval) > 0) {
    room[`onCron${interval}Minutes`] = () => room.sendChat(message);
  }
}

room.onCommand0_motd = (player) => {
  const message = room.getConfig('message');
  room.sendChat(message, player.id);
}

room.onConfigSet = ({paramName, newValue, oldValue}) => {

  if (paramName === `interval`) {
    const message = room.getConfig('message');
    if (oldValue) delete room[`onCron${oldValue}Minutes`];
    displayMessageOnceIn(newValue, message);

  } else if (paramName === `message`) {
    const interval = room.getConfig('interval');
    delete room[`onCron${interval}Minutes`];
    displayMessageOnceIn(interval, newValue);
  }
}

room.onRoomLink = function onRoomLink() {
  room.onPlayerJoin = onPlayerJoin;
  displayMessageOnceIn(room.getConfig('interval'), room.getConfig('message'));
}
