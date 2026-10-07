# estceque.org: the association's site (apps/estceque), replacing the old
# Blogger blog (backed up, see docs/backup-estceque-org.md).
#
# - always: the staging domain next.estceque.org
# - with estceque_cutover = true: estceque.org and www.estceque.org, after
#   removing the web records that pointed to Blogger and to Gandi's redirect.
# Mail (MX at Gandi) and the Google verification TXT record are not managed
# here and stay as they are.

variable "estceque_cutover" {
  description = "Serve estceque.org and www.estceque.org from the estceque Worker instead of Blogger."
  type        = bool
  default     = false
}

locals {
  estceque_staging_domains    = ["next.estceque.org"]
  estceque_production_domains = ["estceque.org", "www.estceque.org"]

  # Web records the Worker replaces. Imported so Terraform can remove them at cutover.
  estceque_replaced_records = {
    apex = {
      id   = "82bc765e6dead049c6d95161f956ade9"
      name = "estceque.org", type = "A", content = "217.70.184.38", proxied = true
    }
    www = {
      id   = "58ce2f30b1bf0adc3993a1e6d8d2b263"
      name = "www.estceque.org", type = "CNAME", content = "ghs.google.com", proxied = true
    }
    wildcard = {
      id   = "73f19cde7d4c0fa7869400a928f65dfe"
      name = "*.estceque.org", type = "CNAME", content = "ghs.google.com", proxied = true
    }
  }
}

data "cloudflare_zone" "estceque" {
  filter = { name = "estceque.org" }
}

import {
  for_each = var.estceque_cutover ? {} : local.estceque_replaced_records
  to       = cloudflare_dns_record.estceque_replaced[each.key]
  id       = "${data.cloudflare_zone.estceque.zone_id}/${each.value.id}"
}

resource "cloudflare_dns_record" "estceque_replaced" {
  for_each = var.estceque_cutover ? {} : local.estceque_replaced_records
  zone_id  = data.cloudflare_zone.estceque.zone_id
  name     = each.value.name
  type     = each.value.type
  content  = each.value.content
  proxied  = each.value.proxied
  ttl      = 1
}

resource "cloudflare_workers_custom_domain" "estceque" {
  for_each = toset(concat(
    local.estceque_staging_domains,
    var.estceque_cutover ? local.estceque_production_domains : [],
  ))
  account_id = var.account_id
  zone_id    = data.cloudflare_zone.estceque.zone_id
  hostname   = each.key
  service    = "estceque"
  depends_on = [cloudflare_dns_record.estceque_replaced]
}

output "estceque_domains" {
  value = sort(keys(cloudflare_workers_custom_domain.estceque))
}
