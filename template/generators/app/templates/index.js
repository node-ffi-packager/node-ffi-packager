// TODO: break out this non-dynamic "template" file to a library, or make it more dynamic so that each supported platform is generated already in the template.
const path = require("path");

// NOTE: since FFI has historically been unstable in Node.js, enforce supported Node.js versions.
const engineCheck = require("engine-check");
engineCheck({
  // NOTE: read engine range from the current directory rather than the application entry point (main) module. The application can enforce their own range if they want to.
  searchRoot: __dirname,
});

const platformMapping = {
  // TODO: check and map all available (supported, but with different naming in nodejs/conan) platforms.
  // https://nodejs.org/dist/latest-v12.x/docs/api/process.html#process_process_platform
  // https://nodejs.org/dist/latest/docs/api/process.html#process_process_platform
  // https://github.com/conan-io/conan/blob/1.24.0/conans/client/tools/oss.py
  // https://github.com/conan-io/conan/blob/master/conans/client/tools/oss.py
  // "aix"
  darwin: "macos",
  // "freebsd"
  // "linux"
  // "openbsd"
  sunos: "solaris",
  win32: "windows",
};
const architectureMapping = {
  // TODO: check and map all available (supported, but with different naming in nodejs/conan) architectures.
  // TODO: map fallbacks, such as ARMv6 ?
  // https://nodejs.org/dist/latest-v12.x/docs/api/process.html#process_process_arch
  // https://nodejs.org/dist/latest/docs/api/process.html#process_process_arch
  // https://docs.conan.io/en/latest/systems_cross_building/cross_building.html
  // https://github.com/conan-io/conan/blob/1.24.0/conans/client/tools/oss.py
  // https://github.com/conan-io/conan/blob/master/conans/client/tools/oss.py
  arm: "armv6",
  arm64: "armv8",
  // "ia32"
  // "mips"
  // "mipsel"
  // "ppc"
  // "ppc64"
  // "s390"
  // "s390x"
  x32: "x86",
  x64: "x86_64",
};

const platform = global.process.platform
  ? platformMapping[global.process.platform] || global.process.platform
  : global.process.platform;
const architecture = global.process.arch
  ? architectureMapping[global.process.arch] || global.process.arch
  : global.process.arch;
const platformAndArchitecture = `${platform}-${architecture}`;
const platformIndexPath = path.join(
  __dirname,
  "platforms",
  platformAndArchitecture,
  "index.js"
);

module.exports = require(platformIndexPath);
