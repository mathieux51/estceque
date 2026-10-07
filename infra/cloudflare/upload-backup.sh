#!/bin/sh
# Copies a backup folder to the R2 bucket estceque-backups and checks it.
#
#   ./upload-backup.sh ~/backups/estceque.org/2026-10-07 estceque.org/2026-10-07
#
# R2's S3 API keys are derived from CLOUDFLARE_API_TOKEN (the key id is the
# token's id, the secret is the SHA-256 of the token), so no other secret is
# needed. The token needs "Workers R2 Storage: Edit". Requires rclone.
set -eu

source_dir=${1:?usage: $0 SOURCE_DIR DESTINATION_PREFIX}
prefix=${2:?usage: $0 SOURCE_DIR DESTINATION_PREFIX}
: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN}"
: "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID}"

token_id=$(curl -fsS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify | jq -r .result.id)

export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$token_id"
RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=$(printf '%s' "$CLOUDFLARE_API_TOKEN" | shasum -a 256 | cut -d' ' -f1)
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY
# The bucket is in the EU jurisdiction, which has its own endpoint.
export RCLONE_CONFIG_R2_ENDPOINT="https://$CLOUDFLARE_ACCOUNT_ID.eu.r2.cloudflarestorage.com"
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

# copy, never sync: nothing in the bucket is ever deleted from here.
rclone copy "$source_dir" "r2:estceque-backups/$prefix" --checksum --transfers 8 --stats-one-line --stats 30s
rclone check "$source_dir" "r2:estceque-backups/$prefix" --one-way
echo "Uploaded and checked: r2:estceque-backups/$prefix"
