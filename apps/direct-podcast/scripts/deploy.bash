#!/usr/bin/env bash

set -o errexit
set -o nounset

PROJECT_NAME='directpodcast'

# build
npx now \
  --no-clipboard

# list all projects in temp file
npx now ls ${PROJECT_NAME} > temp

# get the alias of last deployment
ALIAS=$(cat temp | grep ${PROJECT_NAME} | awk '{ print $2 }' | head -1)

# alias last deployement
npx now alias $ALIAS "www.${PROJECT_NAME}.fr"
npx now alias $ALIAS "${PROJECT_NAME}.fr"

# clean up
unset ALIAS
rm temp

