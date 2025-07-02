#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

# build
npx vercel \
  --no-clipboard --confirm -t ${NOW_TOKEN} \
  -m commit=${GITHUB_SHA} -m branch=${GITHUB_REF} \
  -b REACT_APP_RECAPTCHA_CLIENT_SIDE=${REACT_APP_RECAPTCHA_CLIENT_SIDE} \
  -e REACT_APP_RECAPTCHA_SERVER_SIDE=${REACT_APP_RECAPTCHA_SERVER_SIDE} \
  -e SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

# list all projects in temp file
npx vercel ls ${PROJECT_NAME} -t ${NOW_TOKEN} > temp

# get the alias of last deployment
LAST_DEPLOYMENT_NAME=$(cat temp | grep ${PROJECT_NAME} | head -1)

npx vercel alias list -t ${NOW_TOKEN}

# alias last deployement
npx vercel alias set $LAST_DEPLOYMENT_NAME $ALIAS -t ${NOW_TOKEN} --scope $TEAM
# check if ALIAS if a subdomain
N=$(echo $ALIAS | awk '{ n = split($0, arr, "."); print n}')
if [ $N == 2 ]
then
  npx vercel alias set $LAST_DEPLOYMENT_NAME $ALIAS -t ${NOW_TOKEN} --scope $TEAM
fi

# clean up
unset LAST_DEPLOYMENT_NAME
rm temp
