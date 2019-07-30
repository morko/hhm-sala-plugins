/**
 * Haxball Headless Manager plugin for simple commands that are suitable using
 * with a public room.
 */

const room = HBInit();

room.pluginSpec = {
  name: `hr/simple-commands`,
  author: `salamini`,
  version: `1.0.0`,
  dependencies: [
    `sav/commands`,
  ],
};

room.onCommand_bb = (player) => {
  room.kickPlayer(player.id, 'Good Bye!', false);
};


room.onCommand_swap = (player) => {
  if (player.admin) {
    swapTeams();
  }
};

room.onCommand_rr = (player) => {
  if (player.admin) {
    restartGame();
  }
};

function restartGame() {
  room.stopGame();
  room.startGame();
}

let help = room.getPlugin(`sav/help`);
if (help) {
  help.registerHelp(`bb`, ` (leave room immediately)`);
  help.registerHelp(`swap`, ` (swap teams if you are an admin)`);
  help.registerHelp(`rr`, ` (restart game if you are an admin)`);
}