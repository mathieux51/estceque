# Cloudflare setup for directpodcast.fr and directmontage.fr.
#
# The Workers themselves (code + static files) are deployed by CI with
# wrangler. This configuration attaches domains to them:
# - always: the staging domains next.directpodcast.fr and next.directmontage.fr
# - with cutover = true: the production domains, after removing the web DNS
#   records that still point to Vercel and Gandi (mail records stay as they are)
#
# The API token comes from the CLOUDFLARE_API_TOKEN environment variable.

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {}

variable "account_id" {
  type    = string
  default = "9a229e2731ac55032b7668065e27deb0"
}

variable "cutover" {
  description = "Serve the production domains from the Cloudflare Workers instead of Vercel/Gandi (done on 2026-10-07)."
  type        = bool
  default     = true
}

locals {
  zones = {
    podcast = "directpodcast.fr"
    montage = "directmontage.fr"
  }

  staging_domains = {
    "next.directpodcast.fr" = { zone = "podcast", service = "direct-podcast" }
    "next.directmontage.fr" = { zone = "montage", service = "direct-montage" }
  }

  production_domains = {
    "directpodcast.fr"         = { zone = "podcast", service = "direct-podcast" }
    "www.directpodcast.fr"     = { zone = "podcast", service = "direct-podcast" }
    "montage.directpodcast.fr" = { zone = "podcast", service = "direct-montage" }
    "directmontage.fr"         = { zone = "montage", service = "direct-montage" }
    "www.directmontage.fr"     = { zone = "montage", service = "direct-montage" }
  }

  # Web records the production domains replace. Imported so Terraform can
  # remove them at cutover.
  replaced_records = {
    podcast_apex = {
      zone = "podcast", id = "800ca92a32a2ea640b72a0d8f8acedc2"
      name = "directpodcast.fr", type = "CNAME", content = "direct-podcast.vercel.app", proxied = false
    }
    podcast_www = {
      zone = "podcast", id = "d6e4102f41a79bf4330a598d086ca9a9"
      name = "www.directpodcast.fr", type = "CNAME", content = "direct-podcast.vercel.app", proxied = false
    }
    podcast_montage = {
      zone = "podcast", id = "790160c0b894c770340facd2edd749b6"
      name = "montage.directpodcast.fr", type = "CNAME", content = "direct-montage.vercel.app", proxied = false
    }
    montage_apex = {
      zone = "montage", id = "1761e5e49bbee5124f5224b965700811"
      name = "directmontage.fr", type = "A", content = "217.70.184.38", proxied = true
    }
    montage_www = {
      zone = "montage", id = "9e1089a4d09e6dd4061f4e3790375177"
      name = "www.directmontage.fr", type = "CNAME", content = "webredir.vip.gandi.net", proxied = true
    }
  }
}

data "cloudflare_zone" "zone" {
  for_each = local.zones
  filter   = { name = each.value }
}

import {
  for_each = var.cutover ? {} : local.replaced_records
  to       = cloudflare_dns_record.replaced[each.key]
  id       = "${data.cloudflare_zone.zone[each.value.zone].zone_id}/${each.value.id}"
}

resource "cloudflare_dns_record" "replaced" {
  for_each = var.cutover ? {} : local.replaced_records
  zone_id  = data.cloudflare_zone.zone[each.value.zone].zone_id
  name     = each.value.name
  type     = each.value.type
  content  = each.value.content
  proxied  = each.value.proxied
  ttl      = 1
}

resource "cloudflare_workers_custom_domain" "app" {
  for_each   = merge(local.staging_domains, var.cutover ? local.production_domains : {})
  account_id = var.account_id
  zone_id    = data.cloudflare_zone.zone[each.value.zone].zone_id
  hostname   = each.key
  service    = each.value.service
  depends_on = [cloudflare_dns_record.replaced]
}

output "domains" {
  value = sort(keys(cloudflare_workers_custom_domain.app))
}
