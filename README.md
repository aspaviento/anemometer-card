# Anemometer Card

A Home Assistant dashboard card for wind sensors, designed for a static anemometer-style view with speed, direction, battery, connectivity, optional gust badges, and optional 24 hour history.

This is a frontend-only Lovelace card. It does not create Home Assistant entities and does not require a custom integration.

## Features

- Static anemometer visual with compass and direction marker.
- Wind speed reading with automatic unit detection or unit override.
- Optional wind direction sensor, accepting compass text such as `se` or numeric degrees.
- Optional battery and connectivity indicators.
- Optional collapsible 24 hour history chart from Home Assistant history.
- Optional gust speed and gust direction badges.
- Visual editor support through Home Assistant's card editor.
- English and Spanish labels, selected from the Home Assistant locale.

## Installation

### HACS custom repository

1. Open HACS.
2. Add this repository as a custom repository:

```text
https://github.com/aspaviento/anemometer-card
```

3. Select category `Dashboard`.
4. Install `Anemometer Card`.
5. Restart Home Assistant or refresh the browser cache if Home Assistant does not load the new resource immediately.

HACS should add the Lovelace resource automatically. If it does not, add:

```yaml
url: /hacsfiles/anemometer-card/anemometer-card.js
type: module
```

### Manual installation

1. Copy `anemometer-card.js` to a directory served by Home Assistant, for example:

```text
www/community/anemometer-card/anemometer-card.js
```

2. Add the Lovelace resource:

```yaml
url: /local/community/anemometer-card/anemometer-card.js
type: module
```

## Basic Configuration

```yaml
type: custom:anemometer-card
entity: sensor.wind_speed
direction_entity: sensor.wind_direction
battery_entity: sensor.wind_sensor_battery
connectivity_entity: binary_sensor.wind_sensor_connectivity
show_history: true
```

## Full Configuration

```yaml
type: custom:anemometer-card
entity: sensor.wind_speed
direction_entity: sensor.wind_direction
angle_entity: sensor.wind_angle
gust_entity: sensor.wind_gust_speed
gust_direction_entity: sensor.wind_gust_direction
gust_angle_entity: sensor.wind_gust_angle
battery_entity: sensor.wind_sensor_battery
connectivity_entity: binary_sensor.wind_sensor_connectivity
name: Anemometer
label: Outdoor
show_history: true
speed_max: 80
decimals: 0
unit: km/h
accent_color: "#4a90a4"
```

## Options

| Option | Required | Description |
| --- | --- | --- |
| `entity` | Yes | Wind speed sensor. |
| `direction_entity` | No | Direction sensor, either compass text such as `ne` or degrees. |
| `angle_entity` | No | Numeric wind angle sensor in degrees. If set, it controls the visual direction marker. |
| `battery_entity` | No | Battery percentage sensor. |
| `connectivity_entity` | No | Binary connectivity sensor. |
| `show_history` | No | Shows a collapsible 24 hour speed chart. |
| `name` | No | Card title. |
| `label` | No | Subtitle under the direction. |
| `speed_max` | No | Reserved scale option. Default: `80`. |
| `decimals` | No | Decimal places for speed values. Default: `0`. |
| `unit` | No | Unit override. Defaults to the entity unit. |
| `accent_color` | No | Main visual color. Default: `#4a90a4`. |
| `gust_entity` | No | Optional gust speed badge. |
| `gust_direction_entity` | No | Optional gust direction badge. |
| `gust_angle_entity` | No | Reserved for future gust angle support. Accepted now for YAML compatibility. |
| `language` | No | Force language. Supported values: `en`, `es`. Defaults to the Home Assistant locale. |

## History

When `show_history` is enabled, the card shows a collapsible `Last 24 h` chart. Data is loaded only when the history section is opened. The chart uses the Home Assistant history API for the configured speed entity, so the Home Assistant recorder must retain history for that entity.

## Troubleshooting

### The card is not found

Check that the Lovelace resource points to the installed file and has `type: module`.

### The history chart shows no data

Check that Home Assistant has recorder history for the configured `entity`. Newly added sensors may not have enough history yet.

### Direction is wrong

Use either:

```yaml
direction_entity: sensor.wind_direction
```

for compass text such as `n`, `se`, or `w`, or:

```yaml
angle_entity: sensor.wind_angle
```

for a numeric degree sensor. If `angle_entity` is configured, it controls the visual marker.

## Development

The card is intentionally a single JavaScript file with no build step.

Validate syntax before publishing:

```bash
node --check anemometer-card.js
```

Use a local Home Assistant resource while developing:

```yaml
url: /local/community/anemometer-card/anemometer-card.js
type: module
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for release and validation notes.
