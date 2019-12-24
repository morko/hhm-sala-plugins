# hhm-sala-plugins

Repository of plugins for
[Haxball Headless Manager](https://github.com/saviola777/haxball-headless-manager).

This repository offers folowing plugins:

- [hr/afk-monitor](src/hr/afk-monitor.js)
- [hr/always-one-admin](src/hr/always-one-admin.js)
- [hr/ban-protection](src/hr/ban-protection.js)
- [hr/game-mode](src/hr/game-mode.js)
- [hr/kickban](src/hr/kickban.js)
- [hr/motd](src/hr/motd.js)
- [hr/pause](src/hr/pause.js)
- [hr/simple-commands](src/hr/simple-commands.js)
- [hr/spam](src/hr/spam.js)
- [hr/unadmin-protection](src/hr/unadmin-protection.js)
- [hr/win-streak](src/hr/win-streak.js)

Click the links to see the source code for the options the plugins support.

## Usage

This repository contains plugins that should work well with
[haxroomie](https://github.com/morko/haxroomie).
Due to possible breaking changes in the
[Haxball Headless Manager](https://github.com/saviola777/haxball-headless-manager)
and [saviola's plugin repository](https://github.com/saviola777/hhm-plugins)
the repository will be branched whenever that kind of change happens.
The branches will be named `haxroomie-[version-number]` so that `[version-number]`
corresponds with the version of haxroomie it is compatible with. The master branch
should be always compatible with the latest version of haxroomie.

In [haxroomie-cli](https://www.npmjs.com/package/haxroomie-cli) you can specify
which branch to use with the `version` property. The default version is always
`master`.

e.g.
```js
repositories: [
  {
    type: 'github',
    repository: 'morko/hhm-sala-plugins',
    version: 'haxroomie-2.0.1'
  },
],
```