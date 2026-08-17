# Agent Guidance

## Project Scope

This repository is the public source for a Home Assistant dashboard card that
visualizes wind sensors as an anemometer card.

It is not a Home Assistant integration, Homebridge plugin, or Raspberry Pi
operations repository. Keep runtime hostnames, private paths, tokens, Home
Assistant secrets, and real household notes out of this repository.

## Repository Layout

- `anemometer-card.js`: frontend-only Lovelace card, installable directly by HACS.
- `hacs.json`: HACS dashboard card metadata.
- `README.md`: public installation and configuration documentation.

## Validation

Before publishing, run:

```bash
node --check anemometer-card.js
```

Before publishing, scan for private household details using project-appropriate
terms from the private operations repo, not by committing those terms here:

```bash
git grep -n -E '<private-host-or-room-pattern>'
```

## Change Expectations

- Keep the card frontend-only unless a Home Assistant integration is explicitly
  designed later.
- Preserve YAML compatibility for documented options.
- Use generic examples in public docs.
- Keep HACS compatibility in mind: the JavaScript file is in the repository
  root and named `anemometer-card.js`.
