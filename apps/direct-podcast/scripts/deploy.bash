#!/usr/bin/env bash

set -o errexit
set -o nounset

npx now \
  --no-clipboard \
  -t ${NOW_TOKEN} \
  -m commit=${GITHUB_SHA} -m branch=${GITHUB_REF} \
  -b RECAPTCHA_CLIENT_SIDE=${RECAPTCHA_CLIENT_SIDE} \
  --prod

now alias direct-podcast.now.sh directpodcast.fr

