#!/usr/bin/env bash

set -o errexit
set -o nounset

 now --prod && now alias direct-podcast.now.sh directpodcast.fr && now alias direct-podcast.now.sh www.directpodcast.fr

