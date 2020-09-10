<p align="center">
  <a href="https://github.com/node-ffi-packager"><img src="https://raw.githubusercontent.com/node-ffi-packager/resources/master/logotype/node-ffi-packager.svg?sanitize=true" alt="node-ffi-packager logotype, impossible cubes in green" width="256" border="0" /></a>
</p>

<p align="center">
  <a href="https://github.com/node-ffi-packager">README</a> &middot; <a href="./USAGE.md">Usage</a> &middot; <a href="./DEVELOP.md">Development</a> &middot; <a href="https://github.com/node-ffi-libraries">Libraries</a>
</p>

# [node-ffi-packager](https://github.com/node-ffi-packager) usage

This is a library package development tool. Full documentation pending.

_For using the generated libraries, see [node-ffi-libraries](https://github.com/node-ffi-libraries) and each individual `README.md`._

## Tools

- [`git`](https://git-scm.com/)
- [`hub`](https://hub.github.com/)
- [`git-flow`](https://github.com/petervanderdoes/gitflow-avh)
- [`bash`](https://www.gnu.org/software/bash/)
- [`jq`](https://stedolan.github.io/jq/)
- [`conan`](https://conan.io/)
- [`node`](https://nodejs.org/) with `npm` and `npx`
- Several common commands on Linux and macOS, such as `rsync`.

## Installation

Install tools, then optionally link executables to a location in your `PATH`.

```shell
cd 'node-ffi-packager'
npm install

ln -s "${PWD}/ffi-packager" "${HOME}/bin/"
ln -s "${PWD}/ffi-packager-list" "${HOME}/bin/"
ln -s "${PWD}/ffi-publisher-git" "${HOME}/bin/"
ln -s "${PWD}/ffi-publisher-git-list" "${HOME}/bin/"
```

## Usage

Note that most default values assume that you are allowed to publish to [node-ffi-libraries](https://github.com/node-ffi-libraries). Pull requests to increase configurability appreciated!

### For lists of libraries

Create a list of libraries in a JSON file.

The master list used for [node-ffi-libraries](https://github.com/node-ffi-libraries) is published in the [library-configurations repository](https://github.com/node-ffi-packager/library-configurations).

```shell
[
    {
        "name": "zlib",
        "version": "1.2.11",
        "remote": "conan-center"
    },
    ...
]
```

Package all libraries.

```shell
ffi-packager-list <path-to-library-list-json>
```

Publish all libraries.

```shell
ffi-publisher-git-list <path-to-library-list-json>
```

### For individual libraries

Mostly used for debugging.

```shell
ffi-packager <conan-remote> <conan-reference>
```

```shell
ffi-publisher-git <library-name> <library-version> <conan-remote>
```

## Example

- The package is generated in `./package/`.
  - Can be referenced locally from `package.json` in another package.
  - Dependent libraries are loaded automatically from "known" locations.
  - See the generated `README.md` for a usage example.
- Optionally publish the contents to [Github](https://github.com/) and/or [NPM](https://npmjs.com/).
  - See expected naming in the generated `README.md`.

```shell
# NOTE: arbitrary location of your choice.
mkdir "${HOME}/my-ffi-libraries"
cd "${HOME}/my-ffi-libraries"
mkdir 'zlib-v1.2.11'
cd 'zlib-v1.2.11'
ffi-packager 'conan-center' 'zlib/1.2.11@'
```

---

[node-ffi-packager](https://github.com/node-ffi-packager) Copyright &copy; 2020 [Joel Purra](https://joelpurra.com/). Released under [GNU General Public License version 3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl.html). [Your donations are appreciated!](https://joelpurra.com/donate/)
