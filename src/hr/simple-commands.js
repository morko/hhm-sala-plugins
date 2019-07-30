/**
 * Haxball Headless Manager plugin for simple commands that are suitable using
 * with a public room.
 * 
 * Some code copied from XHerna's plugin.
 * See original at https://github.com/XHerna/hhm-plugins/blob/master/src/tut/simple-commands.js.
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
    swapTeams(player);
  } else {
    room.sendAnnouncement('You need admin to use this command!', player.id, 0xFF0000);
  }
};

room.onCommand_rr = (player) => {
  if (player.admin) {
    restartGame();
  } else {
    room.sendAnnouncement('You need admin to use this command!', player.id, 0xFF0000);
  }
};

function restartGame() {
  room.stopGame();
  room.startGame();
}

function swapTeams(player) {
  if (room.getScores() === null) {
    players = room.getPlayerList();
    for (i = 0; i < players.length; i++) {
      if (players[i].team == 1) {
        room.setPlayerTeam(players[i].id, 2);
      } else if (players[i].team == 2) {
        room.setPlayerTeam(players[i].id, 1);
      }
    }
    room.sendAnnouncement('Teams swapped!', null, 0x00FF00);
  } else {
    room.sendAnnouncement('Game needs to be running to swap teams!', player.id, 0xFF0000);
  }
}

let help = room.getPlugin(`sav/help`);
if (help) {
  help.registerHelp(`bb`, ` (leave room immediately)`);
  help.registerHelp(`swap`, ` (swap teams if you are an admin)`);
  help.registerHelp(`rr`, ` (restart game if you are an admin)`);
}