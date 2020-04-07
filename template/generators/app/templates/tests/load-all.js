const { load } = require("../");

async function main() {
  // Lazy-loading the library and all dependencies.
  const library = await load();

  // A library might have more than one header file.
  console.dir(library);

  // Lazy-load all header files.
  const headers = {};

  for ([header, headerLoader] of Object.entries(library.headers)) {
    headers[header] = await headerLoader();
  }

  // You can now use the functions and types exported by the header file.
  console.dir(headers);

  // Properly unload when done.
  await library.unload();
}

main();
