# Private R2 bucket for archives, never served publicly. First used on
# 2026-10-07 for the backup of the old www.estceque.org (Blogger) before the
# site is replaced. Upload with ./upload-backup.sh.
#
# The API token needs "Workers R2 Storage: Edit" on the account.

resource "cloudflare_r2_bucket" "backups" {
  account_id    = var.account_id
  name          = "estceque-backups"
  jurisdiction  = "eu" # data stays in the EU
  storage_class = "Standard"
}

# Objects cannot be deleted or overwritten during their first year. This
# guards against mistakes; someone with R2 edit rights can still remove the
# rule itself.
resource "cloudflare_r2_bucket_lock" "backups" {
  account_id   = var.account_id
  bucket_name  = cloudflare_r2_bucket.backups.name
  jurisdiction = "eu"
  rules = [
    {
      id      = "keep-one-year"
      enabled = true
      condition = {
        type            = "Age"
        max_age_seconds = 365 * 24 * 60 * 60
      }
    },
  ]
}
