---
name: Replit preview CORS
description: Replit preview origins can contain multiple nested subdomains.
---

Allowlisted Replit preview origins must support one or more DNS labels before `replit.dev` or `replit.app`, not only a single label.

**Why:** Preview requests may originate from hosts such as an ID followed by an intermediate environment subdomain; a single-label regex rejects browser mutations while simple GET requests can appear healthy.

**How to apply:** When tightening CORS for Replit-hosted apps, match nested subdomains with an explicit label pattern and keep the scheme/domain boundaries anchored.