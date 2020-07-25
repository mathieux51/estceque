#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

npx now \
  --no-clipboard \
  -t ${NOW_TOKEN} \
  -m commit=${GITHUB_SHA} -m branch=${GITHUB_REF} \
  -b REACT_APP_RECAPTCHA_CLIENT_SIDE=${REACT_APP_RECAPTCHA_CLIENT_SIDE} \
  --prod

npx now \
  -t ${NOW_TOKEN} \
  alias direct-podcast.now.sh directpodcast.fr

