# cloudflare-backup

Simple tool for backing up your CloudFlare hosted DNS records

## Installation

    npm install -g cloudflare-backup

## Usage

Set `CF_EMAIL` and `CF_TOKEN` environment variables to your CloudFlare account
email address and API key, respectively, and run `cf-backup`. All of the DNS
records for all of your zones will be dumped to stdout in a BIND compatible
format.

    CF_EMAIL=admin@domain CF_TOKEN=xxx cf-backup > zones.bind.txt


---
Copyright &copy; 2015 Ryan Graham
