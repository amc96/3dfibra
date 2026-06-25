---
name: Deployment lock file fix
description: package-lock.json generated in Replit dev uses internal registry URLs that break deployment builds; must be replaced before publishing.
---

## The Rule

After installing any new npm package in the Replit dev environment, run this command to fix the `package-lock.json` before deploying:

```bash
sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json
```

**Why:** Replit's dev environment proxies npm through an internal firewall (`package-firewall.replit.local`). This URL gets baked into the lock file's `resolved` fields. The deployment build container runs `npm install` and tries to fetch packages from those internal URLs, which don't exist there → `ENOTFOUND` error.

**How to apply:** Any time a new package is installed (via `installLanguagePackages` or `npm install`) and the app needs to be deployed. Run the sed command and verify with `grep "resolved" package-lock.json | grep -v "registry.npmjs.org" | wc -l` — should return 0.
