"use strict";

const chalk = require("chalk");
const Generator = require("yeoman-generator");
const { encode: htmlEncode } = require("html-entities");
const semver = require("semver");
const spdxExpressionParse = require("spdx-expression-parse");
const spdxToHTML = require("spdx-to-html");
const uniq = require("lodash/uniq");
const yosay = require("yosay");

module.exports = class extends Generator {
  hardcodedDefaults = {
    "npm-package-private": true,
    "library-dependencies": JSON.stringify({}),
    "package-license": "MIT",
    "package-topics": JSON.stringify([
      "ffi",
      "binding",
      "foreign function interface",
      "napi",
      "abi",
      "c",
      "c++",
      "shared library",
      "so",
      "dll",
      "dylib",
      "conan.io",
    ]),
  };
  hardcodedExamples = {
    "github-organization-name": "my-organization",
    "npm-organization-name": "my-organization",
    "conan-reference": "libxyz/1.2.3@remote/stable",
  };
  ffiDependencies = {
    "engine-check": "^1.0.1",
    // NOTE: dependencies required by node-ffi-generate.
    "ffi-napi": "^4.0.3",
    "ref-array-di": "^1.2.2",
    "ref-napi": "^3.0.3",
    "ref-struct-di": "^1.1.1",
    "ref-union-di": "^1.0.1",
  };
  files = [
    "./index.js",
    "./platforms/loader.js",
    "./README.md",
    "./tests/load-all.js",
    ".gitignore",
    ".npmrc",
  ];
  engines = {
    // NOTE: since FFI has historically been unstable in Node.js, enforce supported Node.js versions.
    node: "^10.0.0 || ^12.0.0",
  };

  constructor(args, options) {
    super(args, options);

    this.originalOptions = options;

    // NOTE: when the object is constructed, call super(...):
    // - then seed all options with both config (loaded from .yo-rc.json if available), or fall back to static defaults, or undefined.
    // - then seed config with the options.
    // - then seed the properties with the config.
    // - then prompt the user missing (or untouched defaults) user input options, with default loaded from the config.
    // - then calculate the properties based on the prompt results.
    // TODO: figure out if the intertangled input is the right way to do things.
    // - options (command line)
    // - config (.yo-rc.json)
    // - prompts (interactive user input)
    // - properties (merged options/config/prompts and calculated values)
    this.allOptions = {
      "github-organization-name": {
        default: this._getOptionDefault("github-organization-name"),
        description:
          "The name of the Github organization/user used to publish this Git repository for the Github-based NPM package reference.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "github-repository-name": {
        default: this._getOptionDefault("github-repository-name"),
        description:
          "The name of the Github repository, which may differ from the NPM package name.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "npm-organization-name": {
        default: this._getOptionDefault("npm-organization-name"),
        description:
          "The name of the NPM organization/user used to publish this NPM package. Can be fake if it's private, but please use one that you are in control of to avoid conflicts.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "npm-package-name": {
        default: this._getOptionDefault("npm-package-name"),
        description:
          "The full NPM package name. Can be fake if it's private, but please use one that you are in control of to avoid conflicts.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "conan-reference": {
        default: this._getOptionDefault("conan-reference"),
        description: "The Conan.io package reference this package contains.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "library-name": {
        default: this._getOptionDefault("library-name"),
        description:
          "By default inferred from the conan reference, but can be overridden here.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "library-version": {
        default: this._getOptionDefault("library-version"),
        description:
          "By default inferred from the conan reference, but can be overridden here.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "conan-remote": {
        default: this._getOptionDefault("conan-remote"),
        description:
          "By default inferred from the conan reference, but can be overridden here.",
        type: String,
        propertyInternallyRequired: false,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "conan-channel": {
        default: this._getOptionDefault("conan-channel"),
        description:
          "By default inferred from the conan reference, but can be overridden here.",
        type: String,
        propertyInternallyRequired: false,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "conan-author": {
        default: this._getOptionDefault("conan-author"),
        description: "The author of the conan package.",
        type: String,
        propertyInternallyRequired: false,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "conan-url": {
        default: this._getOptionDefault("conan-url"),
        description: "The url of the conan package, for human use.",
        type: String,
        propertyInternallyRequired: false,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "platforms-details": {
        default: this._getOptionDefault("platforms-details"),
        description: "Platform details in a JSON-encoded object.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: false,
      },
      "platforms-details-object": {
        default: this._getOptionDefault("platforms-object"),
        description: "The decoded platform details object.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "library-dependencies": {
        default: this._getOptionDefault("library-dependencies"),
        description:
          "NPM package dependencies in a JSON-encoded object. Presumable references to other library packages.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: false,
      },
      "library-dependencies-object": {
        default: this._getOptionDefault("library-dependencies-object"),
        description: "The decoded dependency object.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "npm-package-version": {
        default: this._getOptionDefault("npm-package-version"),
        description: "The package version",
        type: Boolean,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "npm-package-private": {
        default: this._getOptionDefault("npm-package-private"),
        description:
          "If the generated package should be marked as private, to prevent publishing to NPM.",
        type: Boolean,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: false,
      },
      "library-description": {
        default: this._getOptionDefault("library-description"),
        description: "Used to describe the library.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "library-homepage": {
        default: this._getOptionDefault("library-homepage"),
        description: "The homepage of the library, for human use.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "library-license": {
        default: this._getOptionDefault("library-license"),
        description:
          "The license of the library, preferably as an SPDX license expression.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "library-license-html": {
        default: this._getOptionDefault("library-license-html"),
        description:
          "The HTML description with links of the library, for human use. If not provided, it is generated from the library license object.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "library-topics": {
        default: this._getOptionDefault("library-topics"),
        description:
          "The topics of the library, an array of strings encoded as JSON.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "library-topics-array": {
        default: this._getOptionDefault("library-topics"),
        description: "The decoded library topics array.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "package-description": {
        default: this._getOptionDefault("package-description"),
        description:
          "Used to describe the package. If not provided, it is derived from the library description.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "package-homepage": {
        default: this._getOptionDefault("package-homepage"),
        description:
          "The homepage of the package, for human use. If not provided, it is dervied from other properties and assumed to be on github.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "package-repository": {
        default: this._getOptionDefault("package-repository"),
        description:
          "The repository of the package, mainly for human use. If not provided, it is dervied from other properties and assumed to be on github.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "package-license": {
        default: this._getOptionDefault("package-license"),
        description:
          "The SPDX license expression of the package. If not provided, it defaults to MIT.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "package-license-html": {
        default: this._getOptionDefault("package-license-html"),
        description:
          "The HTML description with links of the package, for human use. If not provided, it is generated from the package license object.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "package-topics": {
        default: this._getOptionDefault("package-topics"),
        description:
          "The topics of the package, an array of strings encoded as JSON.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: false,
      },
      "package-topics-array": {
        default: this._getOptionDefault("package-topics"),
        description: "The decoded package topics array.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: false,
        propertyCalculated: true,
      },
      "author-name": {
        default: this._getOptionDefault("author-name"),
        description: "The name of the author, or author organization.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "author-email": {
        default: this._getOptionDefault("author-email"),
        description: "The email of the author, or author organization.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "author-homepage": {
        default: this._getOptionDefault("author-homepage"),
        description:
          "The homepage of the author, or author organization, for human use.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "packager-name": {
        default: this._getOptionDefault("packager-name"),
        description: "The name of the packager tool.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "packager-homepage": {
        default: this._getOptionDefault("packager-homepage"),
        description: "The homepage of the packager tool, for human use.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
      "packager-version": {
        default: this._getOptionDefault("packager-version"),
        description: "The semantic version of the packager tool.",
        type: String,
        propertyInternallyRequired: true,
        propertyUserInputRequired: true,
        propertyCalculated: false,
      },
    };

    this._getNonCalculatedProperties().forEach((key) => {
      // TODO: pick only the properties used by yeoman's this.option(...).
      const optionOptions = this.allOptions[key];

      this.option(key, optionOptions);
    });

    this._getNonCalculatedProperties().forEach((key) =>
      this.config.set(key, this.options[key])
    );

    this.properties = this.config.getAll();
  }

  _getOptionDefault(key) {
    const hardcodedDefault = this.hardcodedDefaults[key];
    const configValue = this.config.get(key);

    if (typeof hardcodedDefault === "boolean") {
      if (typeof configValue === "boolean") {
        return configValue;
      }

      return hardcodedDefault;
    }

    return configValue || hardcodedDefault || undefined;
  }

  _isPropertyDefined(key) {
    const isDefined =
      // NOTE: allow all booleans.
      typeof this.properties[key] === "boolean" ||
      // NOTE: allow all numbers, including the number 0.
      typeof this.properties[key] === "number" ||
      // NOTE: allow all truthy values (aka disallow all falsy values).
      Boolean(this.properties[key]);

    return isDefined;
  }

  _getNonCalculatedProperties() {
    const missingProperties = Object.keys(this.allOptions).filter(
      (key) => this.allOptions[key].propertyCalculated === false
    );

    return missingProperties;
  }

  _getMissingUserInputProperties() {
    const missingProperties = Object.keys(this.allOptions).filter(
      (key) =>
        this.allOptions[key].propertyUserInputRequired === true &&
        !this._isPropertyDefined(key)
    );

    return missingProperties;
  }

  _getMissingProperties() {
    const missingProperties = Object.keys(this.allOptions).filter(
      (key) =>
        this.allOptions[key].propertyInternallyRequired === true &&
        !this._isPropertyDefined(key)
    );

    return missingProperties;
  }

  async prompting() {
    this.log(yosay(chalk.red("generator-node-ffi-library")));
    this.log(
      chalk.green(
        "All values can be provided in .yo-rc.json or as command line options. See --help, or the source code for hidden options."
      )
    );

    // NOTE: removing the prompts in favor of command line options.
    // TODO: consider using yeoman-option-or-prompt.
    // https://github.com/artefact-group/yeoman-option-or-prompt
    while (this._getMissingUserInputProperties().length !== 0) {
      this.log(
        chalk.green(
          `Asking for ${
            this._getMissingUserInputProperties().length
          } remaining user inputs.`
        )
      );

      const prompts = this._getMissingUserInputProperties()
        .filter(
          (name) =>
            this.originalOptions[name] === undefined ||
            this.originalOptions[name] === this.hardcodedDefaults[name]
        )
        .map((name) => {
          let message = `${chalk.red(name)}: ${
            this.allOptions[name].description
          }`;

          if (this.hardcodedExamples[name] !== undefined) {
            message += chalk.gray(
              ` (Example: ${this.hardcodedExamples[name]})`
            );
          }

          const prompt = {
            type: "input",
            required: true,
            name: name,
            message: message,
            default: this.allOptions[name].default,
          };

          return prompt;
        });

      const answers = await this.prompt(prompts);
      this.properties = {
        ...this.properties,
        ...answers,
      };
    }
  }

  writing() {
    if (this._getMissingUserInputProperties().length !== 0) {
      throw new Error(
        `Missing user input: ${JSON.stringify(
          this._getMissingUserInputProperties()
        )}`
      );
    }

    try {
      // TODO: verify that this is a plain object with what looks like NPM dependencies.
      const platformDetailsObject = JSON.parse(
        this.properties["platforms-details"]
      );

      if (!this.properties["platforms-details-object"]) {
        this.properties["platforms-details-object"] = platformDetailsObject;
      }
    } catch (innerError) {
      const error = new Error(
        `Failed to parse platform details (${JSON.stringify(
          this.properties["platforms-details"]
        )}) with error: ${innerError}`
      );
      error.innerError = innerError;

      throw error;
    }

    try {
      // TODO: verify that this is a plain object with what looks like NPM dependencies.
      const libraryDependenciesObject = JSON.parse(
        this.properties["library-dependencies"]
      );

      if (!this.properties["library-dependencies-object"]) {
        this.properties["library-dependencies-object"] =
          libraryDependenciesObject;
      }
    } catch (innerError) {
      const error = new Error(
        `Failed to parse library dependencies (${JSON.stringify(
          this.properties["library-dependencies"]
        )}) with error: ${innerError}`
      );
      error.innerError = innerError;

      throw error;
    }

    try {
      // TODO: use regexp with named capture groups; requires nodejs v10+ if not using the --harmony flag.
      const conanReferenceParts = this.properties["conan-reference"]
        .split("@")
        .map((part) => part.split("/"));

      if (!this.properties["library-name"]) {
        this.properties["library-name"] = conanReferenceParts[0][0];
      }

      if (!this.properties["library-version"]) {
        this.properties["library-version"] = conanReferenceParts[0][1];
      }

      if (!this.properties["conan-remote"]) {
        this.properties["conan-remote"] = conanReferenceParts[1][0];
      }

      if (!this.properties["conan-channel"]) {
        this.properties["conan-channel"] = conanReferenceParts[1][1];
      }
    } catch (innerError) {
      const error = new Error(
        `Failed to parse conan reference (${JSON.stringify(
          this.properties["conan-reference"]
        )}) with error: ${innerError}`
      );
      error.innerError = innerError;

      throw error;
    }

    try {
      const packageLicenseObject = spdxExpressionParse(
        this.properties["package-license"]
      );
    } catch (innerError) {
      const error = new Error(
        `Failed to parse package license (${JSON.stringify(
          this.properties["package-license"]
        )}) with error: ${innerError}`
      );
      error.innerError = innerError;

      throw error;
    }

    try {
      const packagerVersionParts = semver.parse(
        this.properties["packager-version"]
      );

      if (!this.properties["packager-version-major"]) {
        this.properties["packager-version-major"] = packagerVersionParts.major;
      }
    } catch (innerError) {
      const error = new Error(
        `Failed to parse packager version (${JSON.stringify(
          this.properties["packager-version"]
        )}) with error: ${innerError}`
      );
      error.innerError = innerError;

      throw error;
    }

    if (!this.properties["github-repository-name"]) {
      this.properties[
        "github-repository-name"
      ] = `node-ffi-library-${this.properties["library-name"]}-v${this.properties["library-version"]}`;
    }

    if (!this.properties["npm-package-name"]) {
      this.properties[
        "npm-package-name"
      ] = `@${this.properties["npm-organization-name"]}/${this.properties["library-name"]}-v${this.properties["library-version"]}`;
    }

    if (!this.properties["npm-package-version"]) {
      this.properties["npm-package-version"] =
        this.properties["packager-version"];
    }

    if (!this.properties["package-branch"]) {
      this.properties[
        "package-branch"
      ] = `v${this.properties["packager-version"]}`;
    }

    if (!this.properties["package-reference"]) {
      this.properties[
        "package-reference"
      ] = `github:${this.properties["github-organization-name"]}/${this.properties["github-repository-name"]}#semver:^${this.properties["packager-version"]}`;
    }

    if (!this.properties["library-license-html"]) {
      try {
        const libraryLicenseObject = spdxExpressionParse(
          this.properties["library-license"]
        );

        this.properties["library-license-html"] = spdxToHTML(
          this.properties["library-license"]
        );
      } catch (error) {
        // NOTE: non-SPDX values are allowed for the library.
        this.log(
          `Could not parse the library license as an SPDX license expression: ${JSON.stringify(
            this.properties["library-license"]
          )}`
        );

        this.properties["library-license-html"] = htmlEncode(
          this.properties["library-license"],
          {
            level: "html5",
            mode: "nonAscii",
          }
        );
      }
    }

    if (!this.properties["package-license-html"]) {
      this.properties["package-license-html"] = spdxToHTML(
        this.properties["package-license"]
      );
    }

    if (!this.properties["package-description"]) {
      const platforms = Object.keys(
        this.properties["platforms-details-object"]
      ).join(", ");

      this.properties[
        "package-description"
      ] = `Automatically generated FFI package for ${this.properties["library-name"]} v${this.properties["library-version"]}: "${this.properties["library-description"]}". Available for ${platforms}.`;
    }

    if (!this.properties["package-homepage"]) {
      this.properties[
        "package-homepage"
      ] = `https://github.com/${this.properties["github-organization-name"]}/${this.properties["github-repository-name"]}`;
    }

    if (!this.properties["package-repository"]) {
      this.properties[
        "package-repository"
      ] = `github:${this.properties["github-organization-name"]}/${this.properties["github-repository-name"]}`;
    }

    try {
      // TODO: verify that this is an array with string values.
      const topicsArray = JSON.parse(this.properties["library-topics"]);

      if (!Array.isArray(topicsArray)) {
        throw new Error("Not an array.");
      }

      if (!this.properties["library-topics-array"]) {
        this.properties["library-topics-array"] = topicsArray;
      }
    } catch (innerError) {
      const error = new Error(
        `Failed to parse library topics (${JSON.stringify(
          this.properties["library-topics"]
        )}) with error: ${innerError}`
      );
      error.innerError = innerError;

      throw error;
    }

    try {
      // TODO: verify that this is an array with string values.
      const topicsArray = JSON.parse(this.properties["package-topics"]);

      if (!Array.isArray(topicsArray)) {
        throw new Error("Not an array.");
      }

      if (!this.properties["package-topics-array"]) {
        this.properties["package-topics-array"] = topicsArray;
      }
    } catch (innerError) {
      const error = new Error(
        `Failed to parse package topics (${JSON.stringify(
          this.properties["package-topics"]
        )}) with error: ${innerError}`
      );
      error.innerError = innerError;

      throw error;
    }

    // TODO: also list extraenous properties as errors.
    if (this._getMissingProperties().length !== 0) {
      throw new Error(
        `Missing calculated values: ${JSON.stringify(
          this._getMissingProperties()
        )}`
      );
    }

    this._getNonCalculatedProperties().forEach((key) =>
      this.config.set(key, this.properties[key])
    );

    // TODO: use Object.fromEntries(...) in Node.js v12+.
    // TODO: use some library/libraries instead of custom logic.
    // TODO: although these should be internal variables, verify that the input is lower-kebab-case.
    const templateCamelCaseProperties = Object.entries(this.properties).reduce(
      (obj, [key, value]) => {
        const camelCaseKey = key.replace(
          /\-([a-z])/g,
          (_matchSubstring, characterAfterDash) =>
            characterAfterDash.toUpperCase()
        );
        obj[camelCaseKey] = value;

        return obj;
      },
      {}
    );

    this.files.forEach((file) =>
      this.fs.copyTpl(
        this.templatePath(file),
        this.destinationPath(file),

        // NOTE: passing all properties; could be reduced.
        // TODO: move (all?) logic, calculated values, concatenated strings etcetera out of the template file and to this file.
        {
          ...templateCamelCaseProperties,
        }
      )
    );

    const dependencies = {
      ...this.ffiDependencies,
      ...this.properties["library-dependencies-object"],
    };

    const keywords = uniq([
      ...this.properties["package-topics-array"],
      this.properties["library-name"],
      `${this.properties["library-name"]}-v${this.properties["library-version"]}`,
      ...this.properties["library-topics-array"],
    ]);

    const packageJson = {
      name: this.properties["npm-package-name"],
      private: this.properties["npm-package-private"],
      version: this.properties["npm-package-version"],
      description: this.properties["package-description"],
      homepage: this.properties["package-homepage"],
      repository: this.properties["package-repository"],
      license: this.properties["package-license"],
      author: {
        name: this.properties["author-name"],
        email: this.properties["author-email"],
        url: this.properties["author-homepage"],
      },
      engines: this.engines,
      main: "index.js",
      keywords: keywords,
      scripts: {
        test: 'node "./tests/load-all.js"',
      },
      dependencies: dependencies,
    };

    this.fs.writeJSON(this.destinationPath("package.json"), packageJson);
  }

  install() {
    this.installDependencies();
  }
};
