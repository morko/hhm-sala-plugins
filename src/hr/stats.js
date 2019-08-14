var room = HBInit();

var SIZE_OF_THE_BALL = 10; 

class PlayerStats {
  constructor(name) {
    this.name = name;
    /*************************************
    ************ Individual stats**********
    **************************************/
    this.goals = 0; /* Number of goals */
    this.assists = 0; /* Number of assists */
    this.cs = 0; /* Number of cleensheets */
    this.ownGoals = 0; /* Number of own goals */
    this.wins = 0; /* Number of wins */
    this.loses = 0; /* Number of loses */
    this.motm = 0; /* Number of time a player is the man of the match */
    this.playedGk = 0;

    this.badPasses = 0; /* Number of passes */
    this.goodPasses = 1; /* Number of passes that reached a team mate */
    this.passAcc = 0; /* Pass accuracy % */
    this.motmRatio = 0; /* Man of the match % */
    this.winsRatio = 0; /* Wins / Loses */
    this.csPG = 0; /* CS % per game */
    this.goalsPG = 0; /* Number of goals per game */
    this.assistsPG = 0; /* Number of assists per game */
    this.elo = 1000; /* ELO */

    this.secsPlayed = 0; /* Number of mins played */
    this.minsPlayed = 0; /* Number of mins played */
    this.currentStreak = 0; /* Number of current matches won in a row */
    this.bestStreak = 0; /* Number of maximum amount of wins in a row */
    this.ragequit = 0; /* Number of time this player left in middle of match */
  }

  updateGoals(){
    if (gameStats.scorers.hasOwnProperty(this.name))
      this.goals += gameStats.scorers[this.name];
  }

  updateAssists(){
    if (gameStats.assisters.hasOwnProperty(this.name))
      this.assists += gameStats.assisters[this.name];
  }

  updateCs(){
    let [team, idteam] = this.team === 1 ? ["blueScore", 1] : ["redScore", 2];
    this.cs += gameStats[team] === 0 &&
      this.name === gameStats.Gks[idteam - 1];
  }

  updateOG(){
    if (gameStats.ownScorers.hasOwnProperty(this.name))
      this.ownGoals += gameStats.ownScorers[this.name];
  }

  updatePlayedGk(){
    this.playedGk += gameStats.Gks.includes(this.name);
  }

  updateWins(winningTeam){
    this.wins += this.team === winningTeam;
  }

  updateLoses(losingTeam){
    this.loses += this.team === losingTeam;
  }

  updateWinRatio(){
    this.winsRatio = ((this.wins / (this.wins + this.loses)) * 100).toFixed(2) || 0;
  }

  updateGoalsPG(){
    this.goalsPG = (this.goals / (this.loses + this.wins)).toFixed(2) || 0;
  }

  updateAssistsPG(){
    this.assistsPG = (this.assists / (this.loses + this.wins)).toFixed(2) || 0;
  }

  updateCSPG(){
    this.csPG = ((this.cs / this.playedGk) * 100).toFixed(2) || 0;
  }

  updateCurrentStreak(won){
    this.currentStreak = won === this.team ? this.currentStreak + 1 : 0;
  }

  updateBestStreak(){
    this.bestStreak = this.currentStreak >= this.bestStreak ?
      this.currentStreak : this.bestStreak;
  }

  updateSecsPlayed(){
    this.secsPlayed += Number(((this.team !== 0) / 60).toFixed(2));
  }

  updateMinsPlayed(){
    this.minsPlayed = Math.floor((this.secsPlayed / 60));
  }

  updatePassAccuracy(){
    this.passAcc = ((this.goodPasses / (this.goodPasses + this.badPasses)) * 100).toFixed(2);
  }

  displayStats(query_id){

    room.sendChat(" | Goals: " + this.goals + " | Assists: " + this.assists +
      " | Own goals: " + this.ownGoals + " | cs: " + this.cs +
      " | Wins: " + this.wins + " | Losses: " + this.loses, query_id);

    room.sendChat(" | MOTM: " + "[Soon]" +
      " | MOTMR: " + "[Soon]" + " | W/L %: " + this.winsRatio +
      " | Pass acc %: " + this.passAcc + " | Elo: " + this.elo, query_id);

    room.sendChat(" | GPG: " + this.goalsPG + " | APG: " + this.assistsPG +
      " | csPG %: " + this.csPG + " | Best streak: " + this.bestStreak +
      " | Mins: " + this.minsPlayed + "| COINS: " + this.money, query_id);
  }

  updateEGStats(){
    let winners = gameStats.redScore > gameStats.blueScore ? 1 : 2;
    let losers = 1 + (winners === 1);
    this.updateGoals();
    this.updateAssists();
    this.updateOG();
    this.updateWins(winners);
    this.updateLoses(winners - 1);
    this.updatePlayedGk();


    this.updateWinRatio();
    this.updateGoalsPG();
    this.updateAssistsPG();
    this.updateCSPG();
    this.updatePassAccuracy();
    this.updateCurrentStreak(winners);
    this.updateBestStreak(winners);
    this.updateCs();
  }
}

class GameStats {
  constructor() {
    this.redScore = 0; /* Number of goals red team scored this match */
    this.blueScore = 0; /* Number of goals blue team scored this match */
    this.Gks = ["", ""]; /* Name of the gks */
    this.scorers = {}; /* {name: number_of_goals_scored} */
    this.assisters = {};  /* {name: number_of_assists} */
    this.ownScorers = {};  /* {name: number_of_own_goals} */
    this.redTeam = [];  /* [name of the players in red team] */
    this.blueTeam = []; /* [name of the players in blue team] */
    this.matchsumup = [];
    this.isOvertime = false;
    this.hasStarted = false;
    this.rec = false;
  }

  updateScore(team){
    this.redScore += team === 1;
    this.blueScore += team === 2;
  }

  updateGK(){
    var players = room.getPlayerList();
    var min = players[0];
    min.position = {x: room.getBallPosition().x + 60};
    var max = min;

    for (var i = 1; i < players.length; i++) {
      if (players[i].position !== null){
        if (min.position.x > players[i].position.x) min = players[i];
        if (max.position.x < players[i].position.x) max = players[i];
      }
    }
    this.Gks = [min.name, max.name];
  }
  updateScorers(p, team){
    if (p !== undefined && p.team === team) updateObject(this.scorers, p);
  }
  updateAssisters(p, team){
    if (p !== undefined && p.team === team) updateObject(this.assisters, p);
  }
  updateOwnScorers(p, team){
    if (p.team !== team) updateObject(this.ownScorers, p);
  }

  updateRedTeam(){
    this.redTeam = room.getPlayerList().filter(player => player.team === 1);
  }
  updateBlueTeam(){
    this.blueTeam = room.getPlayerList().filter(player => player.team === 2);
  }
  updateOvertime(){
    this.isOvertime = true;
  }
  sumMatch(p){
    if (lastMatchSumUp.length === 0) return;
    let last_match = lastMatchSumUp.length - 1;
    let last_match_length = lastMatchSumUp[last_match].length;
    for (var i = 0; i < last_match_length; i++){
      room.sendChat(lastMatchSumUp[last_match][i], p.id);
    }
  }
}

class GameControl {
  constructor(radiusBall) {
    this.radiusBall = radiusBall || 10;
    this.triggerDistance = this.radiusBall + 15 + 0.1;
    this.currentBallOwner = "";
    this.lastBallOwners = ["", ""]; /* [name: name] */
    this.passesInARow = {"red": 0, "blue": 0}; /* {team: max} */
    this.maxPassesInARow = 0;
    this.redPoss = 0;
    this.bluePoss = 0;
    this.smth = "";
  }
  resetBallOwner(){
    this.currentBallOwner = "";
    this.lastBallOwners = ["", ""];
  }
  updateBallOwner(){
    var ballPosition = room.getBallPosition();
    var players = room.getPlayerList();
    var distanceToBall;
    for (var i = 0; i < players.length; i++) {
      if (players[i].position != null) {
        distanceToBall = pointDistance(players[i].position, ballPosition);
        if (distanceToBall < this.triggerDistance) {
          this.currentBallOwner = players[i].name;
        }
      }
    }
  }
  updateLastBallOwners(){
    if (this.currentBallOwner !== "" &&
      this.currentBallOwner !== this.lastBallOwners[0]){

      this.lastBallOwners[1] = this.lastBallOwners[0];
      this.lastBallOwners[0] = this.currentBallOwner; // last player who touched the ball
    }
  }
  updatePassesInARow(){
    if (gameStats.redTeam.length !== gameStats.blueTeam.length ||
      gameStats.redTeam.length < 2) return;

    if (this.lastBallOwners[1] !== "" && this.smth !== this.currentBallOwner){

      if (Stats[this.lastBallOwners[0]].team ===
        Stats[this.lastBallOwners[1]].team){

        Stats[this.lastBallOwners[1]].goodPasses++;


        if (Stats[this.lastBallOwners[0]].team === 1){
          this.passesInARow.red += 1;
          this.updateMaxPassesInARow("blue");
          this.passesInARow.blue = 0;
        }
        else {
          this.passesInARow.blue += 1;
          this.updateMaxPassesInARow("red");
          this.passesInARow.red = 0;

        }
      }
      else {
        Stats[this.lastBallOwners[1]].badPasses++;
      }

      this.smth = this.currentBallOwner;
    }
  }
  updateMaxPassesInARow(team){
    this.maxPassesInARow = this.passesInARow[team] > this.maxPassesInARow ?
      this.passesInARow[team] : this.maxPassesInARow;
  }
}


class Records {
  constructor() {
    this.bestPassesInARow = 0;
    this.bestAccuracy = "";
    this.bestStreak = {}; /*{[team]: score};*/
    this.fastestWin = 0;
    this.longestMatch = 0;
  }
  updateBestPassesInARow(){
    this.bestPassesInARow = this.maxPassesInARow > this.bestPassesInARow ?
      this.passesInARow : this.bestPassesInARow;

  }
}

class ELO {
  constructor() {
    this.redAverage = 0;
    this.blueAverage = 0;
    this.redChanceToWin = 0;
    this.blueChanceToWin = 0;
    this.redRating = 0;
    this.blueRating = 0;
  }
  getAverageRank(team){
    let average = 0;
    for (var i = 0; i < team.length; i++) {
      average += Stats[team[i].name].elo;
    }
    return average / team.length;
  }
  updateTeamAverages(){
    this.redAverage = this.getAverageRank(gameStats.redTeam);
    this.blueAverage = this.getAverageRank(gameStats.blueTeam);
  }
  updateChancesToWin(){
    this.redChanceToWin = 1 / ( 1 + Math.pow(10, (this.blueAverage - this.redAverage) / 400));
    this.blueChanceToWin = 1 / ( 1 + Math.pow(10, (this.redAverage - this.blueAverage) / 400));
  }
  updateRating(rwin, bwin){
    this.redRating = Math.round(32 * (rwin - this.redChanceToWin));
    this.blueRating = Math.round(32 * (bwin - this.blueChanceToWin));
  }
  handleEloCalc(){
    this.updateTeamAverages();
    this.updateChancesToWin();
  }
  updateElo(){
    if (gameStats.redTeam.length === gameStats.blueTeam.length){
      let winners = gameStats.redScore > gameStats.blueScore;
      let pr, pb;
      this.updateRating(winners, !winners);
      for (var i = 0; i < gameStats.redTeam.length; i++) {
        pr = gameStats.redTeam[i].name;
        pb = gameStats.blueTeam[i].name;

        Stats[pr].elo += this.redRating;
        Stats[pb].elo += this.blueRating;
      }
    }
  }
}

var Stats = {};
const saveStatsName = "Stats";
var saveStatsN = 0;
function loadStats(){
  if (localStorage.getItem(saveStatsName + saveStatsN)){
    let all = JSON.parse(localStorage.getItem(saveStatsName + saveStatsN));
    let noms = Object.keys(all);
    for (let i = 0; i < noms.length; i++){
      Stats[noms[i]] = new PlayerStats(noms[i]);
      Object.assign(Stats[noms[i]], all[noms[i]]);
    }
  }
}

function saveStats(){
  var val = JSON.stringify(Stats);
  window.localStorage.setItem(saveStatsName + saveStatsN, val);
}

function deleteStats(){
  saveStatsN++;
  Stats = {};
}

function updateSavedStats(){
  saveStats();
  loadStats();
}

function createPlayerStats(p){
  Stats[p.name] = new PlayerStats(p.name);
}

function stats(p, m){
  m = m.substr("!stats".length + 1);
  if (Stats.hasOwnProperty(m)){
    Stats[m].displayStats(p.id);
  }
  else {
    room.sendChat("This player is not in our database.", p.id);
  }
  return false;
}


var msg_to_command = {
  "goals": "goals",
  "assists": "assists",
  "og": "ownGoals",
  "cs": "cs",
  "wins": "wins",
  "losses": "loses",
  "wl": "winsRatio",
  "passacc": "passAcc",
  "elo": "elo",
  "gpg": "goalsPG",
  "apg": "assistsPG",
  "cspg": "csPG",
  "streak": "bestStreak",
  "mins": "minsPlayed",
};

function bestRanks(message){
  if (!msg_to_command.hasOwnProperty(message))
    return "This option does not exist (yet ?), sorry :(. See !rankhelp to further infos.";

  let cmd = msg_to_command[message];
  let names = Object.keys(Stats);
  let score;
  let string = "";
  let overall = [];
  for (var i = 0; i < names.length; i++) {
    if (!Stats.hasOwnProperty(names[i])) continue;
    score = Stats[names[i]][cmd];
    if (score === 1000 || score === 0 ||
      (Stats[names[i]].wins + Stats[names[i]].loses) < 10) continue;

    overall.push({name: names[i], value: score});
  }
  overall.sort(function(a,b){
    return b.value - a.value;
  });
  for (i = 0; i < overall.length; i++) {
    string += i + 1 + ") " + overall[i].name + ": " + overall[i].value + " | ";
  }
  return string;
}

function ranking(p, m){
  let string = bestRanks(m.substr("!rank".length + 1));
  let line1 = string.substring(0, 120);
  let line2 = string.substring(120, 240);
  let line3 = string.substring(240, 360);
  room.sendChat(line1, p.id);
  room.sendChat(line2, p.id);
  room.sendChat(line3, p.id);
  return false;
}

/**************************************************************
* Function updating at each tick and if the player is on the
* field his time played.
***************************************************************/
function handleTimePlayed(){
  var players = room.getPlayerList();
  for (var i = 1; i < players.length; i++){
    Stats[players[i].name].updateSecsPlayed();
    Stats[players[i].name].updateMinsPlayed();
  }
}

/**
 * Parse given time in ms into pretty format.
 * @param {number} time - Time in ms.
 * @returns {string} - Prettyfied time.
 */
function prettyTime(time) {
  let m = Math.trunc(time / 60);
  let s = Math.trunc(time % 60);
  return m + ":" + (s < 10 ? "0" + s : s); // MM:SS format
}

/**************************************************************
* Function FUCKING tidious doing everything related to a goal.
***************************************************************/
function handleGoals(team){
  let time = prettyTime(room.getScores().time);
  let string;
  let assister = "";

  gameStats.updateScore(team);

  gameStats.updateScorers(Stats[gameControl.currentBallOwner], team);
  gameStats.updateOwnScorers(Stats[gameControl.currentBallOwner], team);
  gameStats.updateAssisters(Stats[gameControl.lastBallOwners[1]], team);

  if (Stats.hasOwnProperty(gameControl.lastBallOwners[1]) &&
    (Stats[gameControl.lastBallOwners[1]].team ===
    Stats[gameControl.lastBallOwners[0]].team)){

    assister = gameControl.lastBallOwners[1];
  }

  if (team === Stats[gameControl.currentBallOwner].team){
    string = "⚽ Scorer: " + gameControl.lastBallOwners[0] + "| Assister: " +
      assister + "| at " + time;
    room.sendChat(string);
  }
  else {
    string = "Own goal by: " + gameControl.lastBallOwners[0] + "| at " + time;
    room.sendAnnouncement(string);
  }
  gameStats.matchsumup.push(string);
  gameControl.resetBallOwner();

}
/**************************************************************
* Function setting for every players his team.
***************************************************************/
function updatePlayerTeams(){
  var p = room.getPlayerList().filter((a) => a.id != 0);
  for (var i = 0; i < p.length; i++) {
    Stats[p[i].name].team = p[i].team;
  }
}

/**************************************************************
* Function setting the gks, if there's no player for a team, the
* bot is set as gk.
***************************************************************/
function handleGk(){
  if (gameStats.hasStarted === false){
    if (room.getScores().time !== 0){
       gameStats.hasStarted = true;
       gameStats.updateGK();
       room.sendChat("Red GK: " + gameStats.Gks[0] + ", Blue GK: " + gameStats.Gks[1]);
     }
  }
}

/**************************************************************
* Function updating stats for every played that played the match.
***************************************************************/
function handleEndGame(){
  var players = room.getPlayerList().filter((p) => p.id != 0);
  records.updateBestPassesInARow();
  elo.updateElo();
  for (var i = 0; i < players.length; i++){
    if (Stats[players[i].name].account !== 1){
      Stats[players[i].name].updateEGStats();
    }
  }
}

/**************************************************************
* Function increasing ragequit property of a player when he rqs
* in the middle of a game, rq when:
* winning: +1, drawing: +2, losing +3
* after reaching 15 points, his account get reseted and he
* starts back with 10 losses.
***************************************************************/
function updateSanction(p){
  if (room.getPlayerList().filter((pl) => pl.name === p.name &&
    pl.team === p.team).length === 0){

    let score = gameStats.redScore - gameStats.blueScore;
    Stats[p.name].ragequit += p.team === 1 && score > 0;
    Stats[p.name].ragequit += p.team === 2 && score < 0;

    Stats[p.name].ragequit += 3 * (p.team === 1 && score < 0);
    Stats[p.name].ragequit += 3 * (p.team === 2 && score > 0);

    Stats[p.name].ragequit += 2 * (score === 0);
  }
  if (Stats[p.name].ragequit >= 15){
    Stats[p.name] = new PlayerStats(p.name);
    Stats[p.name].loses = 10;
  }
}

/**************************************************************
* Function displaying players that did a cs this match.
***************************************************************/
function handleCSMessage(){
  let str = "";
  if (gameStats.redScore === 0)
    str = [gameStats.Gks[1] + " kept a cs for his team"].join();
  if (gameStats.blueScore === 0)
    str = [gameStats.Gks[0] + " kept a cs for his team"].join();
  return str;
}

/**************************************************************
* Function updating the streak displayed to players
***************************************************************/
function updateStreak(winners){
  winStreak.score = (winStreak.team == "red" && winners) ||
    !(winStreak.team == "red" || winners) ? winStreak.score + 1 : 1;
  winStreak.team = winners ? "red" : "blue";

  room.sendChat("The current streak is held by " + winStreak.team +
    " with " + winStreak.score + " wins ! ");
}

/**************************************************************
* Function displaying to the headless the best ranks
* for every category. Useful if stats are displayed hand-made in
* your plateform.
***************************************************************/
function getBestRanks(){
  let string;
  for (var rank in msg_to_command) {
    if (msg_to_command.hasOwnProperty(rank)){
      string = bestRanks(rank);
      console.log(rank + ": " + string.substring(0, 400));
    }
  }
}

/**************************************************************
* ************************** EVENTS ****************************
* In general, you can just remove one option by commenting it.
* Almost every options are independant between each others.
* There are some exceptions though but you can easily figure out.
***************************************************************/
var gameStats = new GameStats();
var gameControl = new GameControl(SIZE_OF_THE_BALL);
var records = new Records();
var elo;
var lastMatchSumUp = [];
var active = [];

var winStreak = {"team": "", "score": 1};

setInterval(checkfdps, 1000 * 60 * 4);

room.onPlayerTeamChange = function(p, by){
  updatePlayerTeams();
};

room.onPlayerJoin = function(player) {
  createPlayerStats(player);

  if (!active.includes(Stats[player.name].conn)) {
    active.push(Stats[player.name].conn);
  }
};

room.onPlayerLeave = function(player) {
  leaveInGame(player);
  if (p.team !== 0) setTimeout(updateSanction, 1000 * 20, p);
  Stats[player.name].disconnect();
};

room.onGameStart = function(){
  gameStats = new GameStats();
  gameControl = new GameControl(SIZE_OF_THE_BALL);
  gameStats.updateRedTeam();
  gameStats.updateBlueTeam();
  elo = new ELO();
  elo.handleEloCalc();
  updatePlayerTeams();
  gameControl.hasStarted = true;
};

room.onTeamGoal = function(team){
  handleGoals(team);
};

room.onGameStop = function(){
  gameControl.resetBallOwner();
};

room.onGameTick = function(){
  gameControl.updateBallOwner();
  gameControl.updateLastBallOwners();
  gameControl.updatePassesInARow();
  handleGk();
  handleTimePlayed();
};

room.onPlayerBallKick = function (player){
  gameControl.currentBallOwner = player.name;
};

room.onTeamVictory = function(){
  handleEndGame();
  gameStats.matchsumup.push(handleCSMessage());
  lastMatchSumUp.push(gameStats.matchsumup);

  updateStreak(gameStats.redScore > gameStats.blueScore);

  room.stopGame();
  updateSavedStats();

};

room.onRoomLink = function(){
  loadStats();
};





room.onPlayerActivity = function(p){
  if (!active.includes(Stats[p.name].conn)) {
    active.push(Stats[p.name].conn);
  }
};

/* EOF */


/* Python-like update dict method having at least an empty object */
function updateObject(object, p){
  if (object.hasOwnProperty(p.name)){
    object[p.name]++;
  }
  else {
    object[p.name] = 1;
  }
}


// Gives the last player who touched the ball, works only if the ball has the same
// size than in classics maps.
// Calculate the distance between 2 points
function pointDistance(p1, p2) {
  var d1 = p1.x - p2.x;
  var d2 = p1.y - p2.y;
  return Math.sqrt(d1 * d1 + d2 * d2);
}






var bigmap = `{
  "name" : "SkillBall Big (Shaq & Anddy)",

  "width" : 600,
  "height" : 270,

  "spawnDistance" : 350,

  "bg" : { "type" : "grass", "width" : 550, "height" : 240, "kickOffRadius" : 80, "cornerRadius" : 0 },

  "vertexes" : [
  { "x" : -550, "y" : 240,  "trait" : "ballArea" },
  { "x" : -550, "y" : 80,   "trait" : "ballArea" },
  { "x" : -550, "y" : -80,  "trait" : "ballArea" },
  { "x" : -550, "y" : -240, "trait" : "ballArea" },

  { "x" : 550, "y" : 240,  "trait" : "ballArea" },
  { "x" : 550, "y" : 80,   "trait" : "ballArea" },
  { "x" : 550, "y" : -80,  "trait" : "ballArea" },
  { "x" : 550, "y" : -240, "trait" : "ballArea" },

  { "x" : 0, "y" :  270, "trait" : "kickOffBarrier" },
  { "x" : 0, "y" :   80, "trait" : "kickOffBarrier" },
  { "x" : 0, "y" :  -80, "trait" : "kickOffBarrier" },
  { "x" : 0, "y" : -270, "trait" : "kickOffBarrier" },

  { "x" : -560, "y" : -80, "trait" : "goalNet" },
  { "x" : -580, "y" : -60, "trait" : "goalNet" },
  { "x" : -580, "y" :  60, "trait" : "goalNet" },
  { "x" : -560, "y" :  80, "trait" : "goalNet" },

  { "x" : 560, "y" : -80, "trait" : "goalNet" },
  { "x" : 580, "y" : -60, "trait" : "goalNet" },
  { "x" : 580, "y" :  60, "trait" : "goalNet" },
  { "x" : 560, "y" :  80, "trait" : "goalNet" }
  ],

  "segments" : [
  { "v0" : 0, "v1" : 1, "trait" : "ballArea", "bias" : -10 },
  { "v0" : 2, "v1" : 3, "trait" : "ballArea", "bias" : -10 },
  { "v0" : 4, "v1" : 5, "trait" : "ballArea", "bias" : 10 },
  { "v0" : 6, "v1" : 7, "trait" : "ballArea", "bias" : 10 },

  { "v0" : 12, "v1" : 13, "trait" : "goalNet", "curve" : -90 },
  { "v0" : 13, "v1" : 14, "trait" : "goalNet" },
  { "v0" : 14, "v1" : 15, "trait" : "goalNet", "curve" : -90 },

  { "v0" : 16, "v1" : 17, "trait" : "goalNet", "curve" : 90 },
  { "v0" : 17, "v1" : 18, "trait" : "goalNet" },
  { "v0" : 18, "v1" : 19, "trait" : "goalNet", "curve" : 90 },

  { "v0" : 8, "v1" : 9, "trait" : "kickOffBarrier" },
  { "v0" : 9, "v1" : 10, "trait" : "kickOffBarrier", "curve" : 180, "cGroup" : ["blueKO"] },
  { "v0" : 9, "v1" : 10, "trait" : "kickOffBarrier", "curve" : -180, "cGroup" : ["redKO"] },
  { "v0" : 10, "v1" : 11, "trait" : "kickOffBarrier" }
  ],

  "goals" : [
  { "p0" : [-550, 80], "p1" : [-550,-80], "team" : "red" },
  { "p0" : [550, 80], "p1" : [550,-80], "team" : "blue" }
  ],

  "discs" : [
  { "pos" : [-550,  80], "trait" : "goalPost", "color" : "FFCCCC" },
  { "pos" : [-550, -80], "trait" : "goalPost", "color" : "FFCCCC" },
  { "pos" : [ 550,  80], "trait" : "goalPost", "color" : "CCCCFF" },
  { "pos" : [ 550, -80], "trait" : "goalPost", "color" : "CCCCFF" }
  ],

  "planes" : [
  { "normal" : [0, 1], "dist" : -240, "trait" : "ballArea" },
  { "normal" : [0,-1], "dist" : -240, "trait" : "ballArea" },
  { "normal" : [ 0, 1], "dist" : -270, "bCoef" : 0.1 },
  { "normal" : [ 0,-1], "dist" : -270, "bCoef" : 0.1 },
  { "normal" : [ 1, 0], "dist" : -600, "bCoef" : 0.1 },
  { "normal" : [-1, 0], "dist" : -600, "bCoef" : 0.1 }
  ],

  "traits" : {
  "ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball"] },
  "goalPost" : { "radius" : 8, "invMass" : 0, "bCoef" : 0.5 },
  "goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["ball"] },
  "kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO", "blueKO"], "cMask" : ["red", "blue"] }
  },
  "ballPhysics" : {
    "radius" : 6.5
  }
}`;

var classicmap = `{
  "name" : "SkillBall Classic (Shaq & Anddy)",

  "width" : 420,
  "height" : 200,

  "spawnDistance" : 170,

  "bg" : { "type" : "grass", "width" : 370, "height" : 170, "kickOffRadius" : 75, "cornerRadius" : 0 },

  "vertexes" : [
  { "x" : -370, "y" : 170,  "trait" : "ballArea" },
  { "x" : -370, "y" : 64,   "trait" : "ballArea" },
  { "x" : -370, "y" : -64,  "trait" : "ballArea" },
  { "x" : -370, "y" : -170, "trait" : "ballArea" },

  { "x" : 370, "y" : 170,  "trait" : "ballArea" },
  { "x" : 370, "y" : 64,   "trait" : "ballArea" },
  { "x" : 370, "y" : -64,  "trait" : "ballArea" },
  { "x" : 370, "y" : -170, "trait" : "ballArea" },

  { "x" : 0, "y" :  200, "trait" : "kickOffBarrier" },
  { "x" : 0, "y" :   75, "trait" : "kickOffBarrier" },
  { "x" : 0, "y" :  -75, "trait" : "kickOffBarrier" },
  { "x" : 0, "y" : -200, "trait" : "kickOffBarrier" },

  { "x" : -380, "y" : -64, "trait" : "goalNet" },
  { "x" : -400, "y" : -44, "trait" : "goalNet" },
  { "x" : -400, "y" :  44, "trait" : "goalNet" },
  { "x" : -380, "y" :  64, "trait" : "goalNet" },

  { "x" : 380, "y" : -64, "trait" : "goalNet" },
  { "x" : 400, "y" : -44, "trait" : "goalNet" },
  { "x" : 400, "y" :  44, "trait" : "goalNet" },
  { "x" : 380, "y" :  64, "trait" : "goalNet" }
  ],

  "segments" : [
  { "v0" : 0, "v1" : 1, "trait" : "ballArea", "bias" : -10 },
  { "v0" : 2, "v1" : 3, "trait" : "ballArea", "bias" : -10 },
  { "v0" : 4, "v1" : 5, "trait" : "ballArea", "bias" : 10 },
  { "v0" : 6, "v1" : 7, "trait" : "ballArea", "bias" : 10 },

  { "v0" : 12, "v1" : 13, "trait" : "goalNet", "curve" : -90 },
  { "v0" : 13, "v1" : 14, "trait" : "goalNet" },
  { "v0" : 14, "v1" : 15, "trait" : "goalNet", "curve" : -90 },

  { "v0" : 16, "v1" : 17, "trait" : "goalNet", "curve" : 90 },
  { "v0" : 17, "v1" : 18, "trait" : "goalNet" },
  { "v0" : 18, "v1" : 19, "trait" : "goalNet", "curve" : 90 },

  { "v0" : 8, "v1" : 9, "trait" : "kickOffBarrier" },
  { "v0" : 9, "v1" : 10, "trait" : "kickOffBarrier", "curve" : 180, "cGroup" : ["blueKO"] },
  { "v0" : 9, "v1" : 10, "trait" : "kickOffBarrier", "curve" : -180, "cGroup" : ["redKO"] },
  { "v0" : 10, "v1" : 11, "trait" : "kickOffBarrier" }
  ],

  "goals" : [
  { "p0" : [-370, 64], "p1" : [-370,-64], "team" : "red" },
  { "p0" : [370, 64], "p1" : [370,-64], "team" : "blue" }
  ],

  "discs" : [
  { "pos" : [-370,  64], "trait" : "goalPost", "color" : "FFCCCC" },
  { "pos" : [-370, -64], "trait" : "goalPost", "color" : "FFCCCC" },
  { "pos" : [ 370,  64], "trait" : "goalPost", "color" : "CCCCFF" },
  { "pos" : [ 370, -64], "trait" : "goalPost", "color" : "CCCCFF" }
  ],

  "planes" : [
  { "normal" : [0, 1], "dist" : -170, "trait" : "ballArea" },
  { "normal" : [0,-1], "dist" : -170, "trait" : "ballArea" },
  { "normal" : [ 0, 1], "dist" : -200, "bCoef" : 0.1 },
  { "normal" : [ 0,-1], "dist" : -200, "bCoef" : 0.1 },
  { "normal" : [ 1, 0], "dist" : -420, "bCoef" : 0.1 },
  { "normal" : [-1, 0], "dist" : -420, "bCoef" : 0.1 }
  ],

  "traits" : {
  "ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball"] },
  "goalPost" : { "radius" : 8, "invMass" : 0, "bCoef" : 0.5 },
  "goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["ball"] },
  "kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO", "blueKO"], "cMask" : ["red", "blue"] }
  },
  "ballPhysics" : {
    "radius" : 6.5
  }
}`;








var maps = {
  "big": bigmap,
  "classic": classicmap,
};


