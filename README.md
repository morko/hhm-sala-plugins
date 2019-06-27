# hhm-sala-plugins

Repository of plugins for Headless Haxball Manager.

This repository offers folowing plugins:
- [hr/afk-monitor](#hrafk-monitor)
- [hr/always-one-admin](#hralways-one-admin)
- [hr/ban-protection](#hrban-protection)
- [hr/game-mode](#hrgame-mode)
- [hr/kickban](#hrkickban)
- [hr/motd](#hrmotd)
- [hr/pause](#hrpause)
- [hr/spam](#hrspam)

# Plugins

This section describes what plugins there are available in this repository and
what kind of configuration options they support.

## hr/afk-monitor

This plugin for monitors the player activity and kicks the players that idle
too long.

### Configuration

```js
// All times in the config are in seconds.
'hr/afk-monitor': {
  // If true, then only admins will be monitored.
  adminsOnly: true,
  // Max time player can be AFK.
  maxIdleTime: 5 * 60,
  // Max time player can be AFK when he is playing.
  maxIdleTimeWhenPlaying: 20,
  // Max time admins can be AFK when they are required to take action.
  maxAdminIdleTime: 20,
  // How many seconds beforehand to warn the player before getting kicked.
  warnBefore: 7,
  // Message to send to player when he is kicked.
  kickMessage: 'AFK',
  // Enables debugging messages to console (use only if developing).
  debug: false
}
```

## hr/always-one-admin

This plugin ensures that the room always has at least one admin. It is basicly
the example script from the Headless HaxBall WiKi page ported to a plugin.

### Configuration

This plugin does not accept any configuration options.

## hr/ban-protection

This plugin provides protection against unwanted banning of players.
 
If player that **is not** protected bans a player that is protected
the banner gets banned himself and the banned player gets unbanned.

If player that **is** protected bans another protected player
the player does not get banned but the banned player gets unbanned.

If `allowOnlyProtectedRolesToBan` is set to `true`, then the plugin also
bans all unprotected players that are trying to ban other players and
removes the ban they were trying to execute.

Depends on `sav/roles` plugin of the default HHM plugin repository.

### Configuration

```js
'hr/ban-protection': {
  // Protected roles that cannot be banned.
  protectedRoles: [
    'admin',
    'host'
  ],
  // If this is `true` only the players with roles listed in `protectedRoles`
  // are allowed to ban players. If `false` all players all allowed to ban, but
  // `protectedRoles` remain protected.
  allowOnlyProtectedRolesToBan: false,
  // Message to display when kicking / banning.
  violationMessage: 'You should have not tried to ban that player!',
  // If this is `true` the violators will get banned. Otherwise kicked.
  banTheBanners: false
}
```

## hr/game-mode

This plugin restricts the rooms map to given array of allowed maps
and sets the game setting to the given ones at startup.

Works only with the default HaxBall maps!

By default only maps named `Big` and `Classic` are allowed.

The default map names in HaxBall are `Classic`, `Easy`, `Small`, `Big`, 
`Rounded`, `Hockey`, `Big Hockey`, `Big Easy`, `Big Rounded` and `Huge`.

### Configuration

```js
'hr/game-mode': {
  // Map to load when starting the room.
  defaultMap: 'Big',
  // Array of allowed map names. 
  allowedMaps: [
    'Big',
    'Classic'
  ],
  // Locks the teams on room start if true. Does not enforce the setting.
  lockTeams: true,
  // Sets the time limit on room start. Does not enforce the setting.
  timeLimit: 3,
  // Sets the score limit on room start. Does not enforce the setting.
  scoreLimit: 3
}
```
## hr/kickban

Plugin that keeps track of banned players and offers some commands to control 
the kicking and banning.

If `sav/commands` and `sav/roles` plugins are available, then this plugin
provides commands `kick`, `ban`, `unban` and `banlist` to be used with
`admin` and `host` roles.

Exports `bannedPlayers`, `ban`, `unban` and `kick` functions.

### Configuration

This plugin does not accept any configuration options.

## hr/motd

This plugin displays Message Of The Day.

Displays a message when player joins and repeats it once in every x minutes.
The repeating can be disabled.

Depends on `sav/cron` of the default HHM plugin repository.

### Configuration

```js
'hr/motd': {
  // Message Of The Day.
  message: `Join https://discord.gg/TeJAEWu for support.`,
  // How often to display the message in minutes.
  // Set to 0 to disable displaying it repeatedly.
  interval: 10
}
```

## hr/pause

This plugin enables players to pause the game by writing `p` in chat. 
It can also pause the game if a player leaves when game has started.

### Configuration

```js
'hr/pause': {
  // If true, then game is paused if playing player leaves.
  pauseWhenPlayerLeaves: true,
  // If true, players are allowed to pause the game by writing 'p'.
  allowPlayersToPause: true,
  // How many times player can pause game (0 is unlimited).
  maxPauseTimes: 1,
}
```

## hr/spam

This plugin provides spam protection. It prevents spamming similar messages
and flooding the chat.

### Configuration

```js
'hr/spam': {
  // If buffer fills within this interval then action is taken.
  // The unit is milliseconds.
  interval: 5000,
  // How many messages within the interval before player is warned.
  warnBuffer: 3,
  // How many messages within the interval before player is banned.
  maxBuffer: 4,
  // How many similar messages before player is warned.
  warnSimilar: 2,
  // How many similar messages before player is banned.
  maxSimilar: 3,
  // Message to send when warning player for spamming.
  warningMessage: `STOP SPAMMING`,
  // Message to send when player gets banned for spamming.
  banMessage: `SPAM`
},
```
