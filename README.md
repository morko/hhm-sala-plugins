# hhm-sala-plugins

Repository of plugins for
[Haxball Headless Manager](https://github.com/saviola777/haxball-headless-manager).

This repository offers folowing plugins:

- [hr/afk-monitor](src/hr/afk-monitor.js)
- [hr/always-one-admin](src/hr/always-one-admin.js)
- [hr/ban-protection](src/hr/ban-protection.js)
- [hr/game-mode](src/hr/game-mode.js)
- [hr/kickban](src/hr/kickban.js)
- [hr/maps](src/hr/maps.js)
- [hr/motd](src/hr/motd.js)
- [hr/mute](src/hr/mute.js)
- [hr/pause](src/hr/pause.js)
- [hr/simple-commands](src/hr/simple-commands.js)
- [hr/spam](src/hr/spam.js)
- [hr/unadmin-protection](src/hr/unadmin-protection.js)
- [hr/win-streak](src/hr/win-streak.js)

Click the links to see the source code for the options the plugins support.

## Usage

This repository contains plugins that should work well with
[haxroomie](https://github.com/morko/haxroomie).

In [haxroomie-cli](https://www.npmjs.com/package/haxroomie-cli) config you can add
the repository to the `repository` array.

e.g.

```js
repositories: [
  {
    type: 'github',
    repository: 'morko/hhm-sala-plugins',
  },
],
```
