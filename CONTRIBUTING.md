# Contributing

This repository contains a frontend-only Home Assistant Lovelace card. It is not a Home Assistant integration and has no build step.

## Project Layout

- `anemometer-card.js`: the card source shipped by HACS.
- `hacs.json`: HACS dashboard metadata.
- `README.md`: public user documentation.
- `CHANGELOG.md`: release notes.

## Local Validation

Run JavaScript syntax validation before publishing:

```bash
node --check anemometer-card.js
```

Before publishing public changes, scan the repository for private hostnames, local paths, tokens, real room names, and Home Assistant secrets. Keep examples generic.

## Compatibility

- Preserve existing YAML options whenever possible.
- Keep `anemometer-card.js` in the repository root.
- Keep `hacs.json` aligned with the root JavaScript filename.
- Avoid adding a build step unless the project is intentionally restructured.

## Release Checklist

1. Update `AC_VERSION` in `anemometer-card.js`.
2. Update `CHANGELOG.md`.
3. Run syntax validation.
4. Run the privacy scan.
5. Commit and push.
6. Create a GitHub release and tag matching `AC_VERSION`.
7. Update through HACS in Home Assistant and verify the installed file version.

## Public Documentation

Use generic entity IDs in README examples:

```yaml
sensor.wind_speed
sensor.wind_direction
binary_sensor.wind_sensor_connectivity
```

Do not include runtime hostnames, private paths, tokens, or real household notes.
