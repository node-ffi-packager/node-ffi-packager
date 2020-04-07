#!/usr/bin/env bash

set -o errexit
set -o noclobber
set -o nounset
set -o pipefail

declare SCRIPT_ABSOLUTE
SCRIPT_ABSOLUTE="$(realpath "$BASH_SOURCE")"
declare SCRIPT_BASE_ABSOLUTE
SCRIPT_BASE_ABSOLUTE="$(realpath "${SCRIPT_ABSOLUTE%/*}")"

function main() {
    # NOTE: the path to the directory which contains node_modules with yeoman installed. Used to avoid install/check yo on each run using npx.
    local -r NODE_MODDULES_BASE="${SCRIPT_BASE_ABSOLUTE}/.."
    local -r generatorsPath="${SCRIPT_BASE_ABSOLUTE}/generators"

    # TODO: use directory outside of the node-ffi-packager directory
    # NOTE: should be deterministic, since the generator only has to be regenerated if there are changes in the template.
    local -r tmpDirectoryPath="${SCRIPT_BASE_ABSOLUTE}/../tmp"

    mkdir -p "$tmpDirectoryPath"

    (
        pushd "$tmpDirectoryPath" > /dev/null

        local -r libraryGeneratorPath="${tmpDirectoryPath}/generator-node-ffi-library"

        if [[ ! -d "$libraryGeneratorPath" ]];
        then
            "${SCRIPT_BASE_ABSOLUTE}/generator-expect.exp" -- "$NODE_MODDULES_BASE"

            rm -r "${libraryGeneratorPath}/generators"
            rsync --archive --links --hard-links "$generatorsPath" "${libraryGeneratorPath}/"

            # TODO: use option projectRoot?
            jq '.main = "./generators/app/index.js"' "${libraryGeneratorPath}/package.json" > "${libraryGeneratorPath}/package.json~"
            mv "${libraryGeneratorPath}/package.json~" "${libraryGeneratorPath}/package.json"
        else
            echo -E 'Directory exists, skipping generation:' "'$libraryGeneratorPath'"
        fi

        popd > /dev/null
    )
}

main "$@"
