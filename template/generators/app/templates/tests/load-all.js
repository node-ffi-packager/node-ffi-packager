const { load } = require("../");

async function loadAll() {
  // NOTE: lazy-loading the library and all dependencies.
  const library = await load();

  // NOTE: a library might have more than one header file.
  console.dir(library);

  // NOTE: lazy-load all header files.
  const headers = {};

  for ([header, headerLoader] of Object.entries(library.headers)) {
    headers[header] = await headerLoader();
  }

  // NOTE: you can now use the functions and types exported by the header file.
  console.dir(headers);

  // NOTE: properly unload when done.
  await library.unload();
}

async function main() {
  try {
    await loadAll();
  } catch (error) {
    // NOTE: make sure to fail tests.
    process.exitCode = 1;

    console.error("Library loading test failed.");
    console.error(__filename);
    console.error(error);
  }
}

main();
