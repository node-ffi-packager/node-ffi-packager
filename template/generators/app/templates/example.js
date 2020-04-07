const { load } = require("<%= npmPackageName %>");

async function main() {
  // Lazy-loading the library and all dependencies.
  const library = await load();

  // A library might have more than one header file.
  console.dir(library);

<% if (randomExampleHeaderFile) { %>
  // Lazy-load an individual header file (random example, see output from above).
  const headerLoader = library.headers["<%= randomExampleHeaderFile %>"];
  const header = await headerLoader();

  // You can now use the functions and types exported by the header file.
  console.dir(header);
<% } %>

  // Properly unload when done.
  await library.unload();
}

main();
