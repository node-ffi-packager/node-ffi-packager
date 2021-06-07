<p align="center">
  <a href="https://github.com/node-ffi-packager"><img src="https://raw.githubusercontent.com/node-ffi-packager/resources/master/logotype/node-ffi-packager.svg?sanitize=true" alt="node-ffi-packager logotype, impossible cubes in green" width="256" border="0" /></a>
</p>

<p align="center">
  <a href="https://github.com/node-ffi-packager">README</a> &middot; <a href="./USAGE.md">Usage</a> &middot; <a href="./DEVELOP.md">Development</a> &middot; <a href="https://github.com/node-ffi-libraries">Libraries</a>
</p>

# [node-ffi-packager](https://github.com/node-ffi-packager)

A tool to generate a [Node.js](https://nodejs.org/en/) [Foreign Function Interface (FFI)](https://en.wikipedia.org/wiki/Foreign_function_interface) package for a given C/C++ library.

- See list of available library packages in [node-ffi-libraries](https://github.com/node-ffi-libraries).
- Uses [Conan.io](https://conan.io/) to download compiled cross-platform binaries.
- Packages are made to be published to [Github](https://github.com/) and/or [NPM](https://npmjs.com/).
- Generated packages may depend on other generated packages.

## Bugs? Report them!

For simplicity, [report all issues to node-ffi-packager](https://github.com/node-ffi-packager/node-ffi-packager/issues?q=). Even better, submit a pull request!

Want to dig a bit deeper?

- Problems with package installation, versioning, or loading? Probably somewhere in [node-ffi-packager](https://github.com/node-ffi-packager/node-ffi-packager).
- Missing or broken `.h` functionality? Poke around in [node-libclang](https://github.com/node-ffi-packager/node-libclang).
- Problems with the generated `.h.js` files? Might be [node-ffi-generate](https://github.com/node-ffi-packager/node-ffi-generate).
- Need a new version of a library? Look in [library-configurations](https://github.com/node-ffi-packager/library-configurations).

---

[node-ffi-packager](https://github.com/node-ffi-packager) Copyright &copy; 2020, 2021 [Joel Purra](https://joelpurra.com/). Released under [GNU General Public License version 3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl.html). [Your donations are appreciated!](https://joelpurra.com/donate/)
