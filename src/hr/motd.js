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

room.onPlayerJoin = function onPlayerJoin(player) {
  const message = room.getConfig('message');
  room.sendChat(message, player.id);
}

function displayMessageOnceIn(interval, message) {
  room[`onCron${mins}Minutes`] = () => room.sendChat(message);
}

room.onCommand0_motd = (player) => {
  const message = room.getConfig('message');
  room.sendChat(message, player.id);
}

room.onConfigSet = ({paramName, newValue, oldValue}) => {
  if (paramName === `interval`) {
    // TODO: remove this when https://github.com/saviola777/haxball-headless-manager/issues/14 solved
    if (!oldValue) oldValue = room.getConfig('interval')
    const message = room.getConfig('message');
    delete room[`onCron${oldValue}Minutes`];
    displayMessageOnceIn(newValue, message);
  }
}

room.onRoomLink = function onRoomLink() {
  if (parseInt(room.getConfig('interval')) > 0) {
    displayMessageOnceIn(
      room.pluginSpec.config.interval,
      room.pluginSpec.config.message
    );
  }
}
