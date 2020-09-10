// TODO: use bluebird or similar to simplify handling dynamic arrays of promises.
const path = require("path");
const FFI = require("ffi-napi");
const packageJson = require("../package.json");

const loadDependencies = async (baseDirectoryPath, libraryDependencies) => {
  const dependencies = Object.entries(libraryDependencies).reduce(
    (obj, [dependencyName, dependencyVersion]) => {
      const dependencyPackageName = `${dependencyName}-v${dependencyVersion}`;
      // NOTE: checking developer dependencies too, just in case.
      // TODO: proper checking for no matches, too many matches, etcetera.
      // NOTE: assuming a certain package naming convention.
      const scopedPackageName = []
        .concat(Object.entries(packageJson.dependencies || {}))
        .concat(Object.entries(packageJson.devDependencies || {}))
        .filter(([name, semver]) => name.endsWith(dependencyPackageName))
        .map(([name, value]) => name)[0];
      const dependency = require(scopedPackageName);

      obj[dependencyName] = dependency.load();

      return obj;
    },
    {}
  );

  // NOTE: have to await the asynchronous library loading separately from the synchronous reduce callback function.
  await Promise.all(Object.values(dependencies));

  return dependencies;
};

const unloadDependencies = async (dependencies) => {
  // TODO: unload in reverse dependency graph order.
  const unloaders = Object.entries(dependencies).map(
    // TODO: try-catch and add relevant error information to make it easier to debug unloading?
    ([name, reference]) => reference.unload()
  );

  await Promise.all(unloaders);
};

const loadLibraryFilesGlobally = (baseDirectoryPath, libraryFiles) =>
  libraryFiles.reduce((obj, libraryFile) => {
    // TODO: handle system_libs, libc++, etctera?
    const libraryPath = path.join(baseDirectoryPath, libraryFile);

    // NOTE: loads the library "globally" into the current process.
    // - Avoids loading the library once per header file.
    // - Allows dependent libraries to reference it.
    // TODO: consider using `RTLD_NOLOAD | RTLD_GLOBAL` to reopen/reload/expose `RTLD_LOCAL` libraries.
    // https://linux.die.net/man/3/dlopen
    const flags =
      FFI.DynamicLibrary.FLAGS.RTLD_NOW | FFI.DynamicLibrary.FLAGS.RTLD_GLOBAL;

    obj[libraryFile] = new FFI.DynamicLibrary(libraryPath, flags);

    return obj;
  }, {});

const unloadLibraryFiles = async (references) => {
  // TODO: unload in reverse dependency graph order.
  const unloaders = Object.entries(references).map(
    ([platformLibraryFile, reference]) =>
      (async () => {
        // TODO: try-catch and add relevant error information to make it easier to debug unloading?
        reference.close();
      })()
  );

  await Promise.all(unloaders);
};

const createHeaderFileLoaders = async (baseDirectoryPath, headerFiles) =>
  headerFiles.reduce((obj, headerFile) => {
    const headerFileJsPath = path.join(baseDirectoryPath, headerFile.path);

    obj[headerFile.name] = async () => require(headerFileJsPath);

    return obj;
  }, {});

const loadLibrary = async (baseDirectoryPath, input) => {
  const dependencies = await loadDependencies(
    baseDirectoryPath,
    input.platform.libraryDependencies
  );
  const libraryReferences = await loadLibraryFilesGlobally(
    baseDirectoryPath,
    input.platform.libraryFiles
  );
  const headerFileLoaders = await createHeaderFileLoaders(
    baseDirectoryPath,
    input.platform.headerFiles
  );

  // NOTE: it is up to the caller to unload properly.
  const unload = async () => {
    await unloadLibraryFiles(libraryReferences);
  };

  const library = {
    dependencies: dependencies,
    libraries: libraryReferences,
    headers: headerFileLoaders,
    unload: unload,
  };

  return library;
};

module.exports = {
  loadLibrary,
};
