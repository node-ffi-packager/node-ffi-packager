<p align="center">
  <a href="https://github.com/node-ffi-packager"><img src="https://raw.githubusercontent.com/node-ffi-packager/resources/master/logotype/node-ffi-packager.svg?sanitize=true" alt="node-ffi-packager logotype, impossible cubes in green" width="256" border="0" /></a>
</p>

<p align="center">
  <a href="https://github.com/node-ffi-packager">README</a> &middot; <a href="./USAGE.md">Usage</a> &middot; <a href="./DEVELOP.md">Development</a> &middot; <a href="https://github.com/node-ffi-libraries">Libraries</a>
</p>

# [node-ffi-packager](https://github.com/node-ffi-packager) development

## Overall strategies

- Automation over manual editing.
- Follows [semantic versioning](https://semver.org/).
  - All code in the library packages is generated, so the packages use the generator version number.
- Follows [git-flow](https://nvie.com/posts/a-successful-git-branching-model/) (AVH edition) using [gitflow-avh](https://github.com/petervanderdoes/gitflow-avh).

## Package generation

A shell script takes care of the steps to find, download, collect cross-platform files, and package each library.

Uses a mixture of tools and languages. It could surely be improved.

- Shell scripts written in [`bash`](https://www.gnu.org/software/bash/).
- Querying JSON using [`jq`](https://stedolan.github.io/jq/).
- Yeoman for generating and using [`yo`](https://yeoman.io/) packages.
- Javascript code running in [Node.js](https://nodejs.org/).

### Library files

Relies on the `conan` C/C++ package manager for cross-platform C/C++ recipes.

- Searches selected remotes for the selected version of a library.
- The most recent build for each platform is selected.
- Local cross-compilation is avoided; library binaries (`.so`, `.dll`, `.dylib`) and header files (`.h`) are merely _downloaded_.
- Recipes include some metadata, used to generate for example `README.md`.

See

- [Conan.io](https://conan.io/)
- [Conan Center](https://conan.io/center/)
- [Bincrafters](https://bincrafters.github.io/)
- Other custom remotes.

### C and C++

- Uses a forked [`node-libclang`](https://github.com/node-ffi-packager/node-libclang) to parse the `.h` header files.
  - C is partially supported.
    - Not all things work great.
  - C++ needs work.
    - Classes are not yet supported.
  - Tests needed.

### Javascript files

The FFI code is generated to reduce the risk for mistakes and minimize manual work.

- Uses a forked [node-ffi-generate](https://github.com/node-ffi-packager/node-ffi-generate) to automatically generate the corresponding Node.js FFI code from the [node-libclang](https://github.com/node-ffi-packager/node-libclang) output.
  - Generates one `.js` file per `.h` file.
  - Generates constants, FFI typedefs, and bindings to functions.
- Uses [node-ffi-napi](https://github.com/node-ffi-napi/node-ffi-napi) to dynamically load and call the library.
  - Loading and unloading of libraries is explicit and asynchronous.

### Package files

- Uses a custom [Yeoman](https://yeoman.io/) `generator-generator` generator to generate a generator per library.
- The generated generator creates common files such as `package.json`, `README.md`, `index.js`.
- Uses a custom shell script to pass values from `conan` to the generator.
- The custom shell script also creates some per-platform files based on the `conan` package details.

---

[node-ffi-packager](https://github.com/node-ffi-packager) Copyright &copy; 2020 [Joel Purra](https://joelpurra.com/). Released under [GNU General Public License version 3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl.html). [Your donations are appreciated!](https://joelpurra.com/donate/)
