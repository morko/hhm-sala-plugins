/**
 * Haxball Headless Manager plugin for simple commands that are suitable using
 * with a public room.
 *
 * Some code copied from XHerna's plugin.
 * See original at https://github.com/XHerna/hhm-plugins/blob/master/src/tut/simple-commands.js.
 */

const room = HBInit();

function isGameRunning() {
  return !!room.getScores();
}

room.pluginSpec = {
  name: `hr/simple-commands`,
  author: `salamini`,
  version: `1.1.1`,
  dependencies: [`sav/commands`, `sav/players`],
};

room.onCommand_bb = {
  function: (player) => {
    room.kickPlayer(player.id, "Good Bye!", false);
  },
  data: {
    'sav/help': {
      text: ' (leave the room)',
    }
  }
}

room.onCommand_pm = {
  function: (fromPlayer, args) => {
    if (!Array.isArray(args) || args.length < 2) {
      room.sendAnnouncement(
        `Usage: !pm #PLAYER_ID MESSAGE`,
        fromPlayer.id,
        0xff0000
      );
      return false;
    }

    const mutePlugin = room.getPlugin("hr/mute");
    if (mutePlugin && mutePlugin.isMuted(fromPlayer)) {
      return false;
    }

    const id = args[0];
    const msg = args.slice(1).join(" ");

    let intId = parseInt(id);

    if (!intId) {
      intId = parseInt(id.slice(1));
    }

    if (!intId) {
      room.sendAnnouncement(
        `Could not send PM to ${id}`,
        fromPlayer.id,
        0xff0000
      );
      room.sendAnnouncement(
        `Usage: !pm #PLAYER_ID MESSAGE`,
        fromPlayer.id,
        0xff0000
      );
      return false;
    }

    let toPlayer = room.getPlayer(intId);

    if (!toPlayer) {
      room.sendAnnouncement(
        `Could not send PM to ${id}`,
        fromPlayer.id,
        0xff0000
      );
      room.sendAnnouncement(
        `Usage: !pm #PLAYER_ID MESSAGE`,
        fromPlayer.id,
        0xff0000
      );
      return false;
    }

    let pm = `PM ${fromPlayer.name}: ${msg}`;
    room.sendAnnouncement(pm, toPlayer.id, 0xa98abf);
    room.sendAnnouncement(pm, fromPlayer.id, 0xa98abf);
    return false;
  },
  data: {
    'sav/help': {
      text: ' #PLAYER_ID (send a private message to another player)',
    }
  }
}

room.onCommand_swap = {
  function: (player) => {
    if (player.admin) {
      swapTeams(player);
    } else {
      room.sendAnnouncement(
        "You need admin to use this command!",
        player.id,
        0xff0000
      );
    }
  },
  data: {
    'sav/help': {
      text: ' (swap teams if you have admin)',
    }
  }
}

room.onCommand_rr = {
  function: (player) => {
    if (player.admin) {
      restartGame();
    } else {
      room.sendAnnouncement(
        "You need admin to use this command!",
        player.id,
        0xff0000
      );
    }
  },
  data: {
    'sav/help': {
      text: ' (restart game if you have admin)',
    }
  }
}

// Tells onGameStop that rrs command stopped the game
// so it should swap teams and restart.
let stoppedByRrs = null;

room.onCommand_rrs = {
  function: (player) => {
    if (!player.admin) {
      room.sendAnnouncement(
        "You need admin to use this command!",
        player.id,
        0xff0000
      );
      return;
    }

    if (isGameRunning()) {
      stoppedByRrs = player;
      room.stopGame();
    } else {
      swapTeams(player);
      room.startGame();
    }
  },
  data: {
    'sav/help': {
      text: ' (restart game and swap teams if you have admin)',
    }
  }
}

room.onGameStop = function () {
  if (stoppedByRrs) {
    swapTeams(stoppedByRrs);
    room.startGame();
    stoppedByRrs = null;
  }
};

function restartGame() {
  room.stopGame();
  room.startGame();
}

function swapTeams(player) {
  if (!isGameRunning()) {
    players = room.getPlayerList();
    for (i = 0; i < players.length; i++) {
      if (players[i].team == 1) {
        room.setPlayerTeam(players[i].id, 2);
      } else if (players[i].team == 2) {
        room.setPlayerTeam(players[i].id, 1);
      }
    }
    room.sendAnnouncement("Teams swapped!", null, 0x00ff00);
  } else {
    room.sendAnnouncement(
      "Game needs to be stopped to swap teams!",
      player.id,
      0xff0000
    );
  }
}