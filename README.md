# Anemometer Card

A Home Assistant dashboard card for wind sensors, designed for a static anemometer-style view with speed, direction, battery, connectivity, and optional 24 hour history.

This is a frontend-only Lovelace card. It does not create Home Assistant entities and does not require a custom integration.

## MVP configuration

```yaml
type: custom:anemometer-card
entity: sensor.weather_station_smart_anemometer_wind_speed
direction_entity: sensor.weather_station_smart_anemometer_wind_direction
battery_entity: sensor.weather_station_smart_anemometer_battery
connectivity_entity: binary_sensor.weather_station_smart_anemometer_connectivity
show_history: true
```

## Future-ready configuration

These options are accepted now so existing dashboards do not need a YAML break when gust and angle support is expanded.

```yaml
type: custom:anemometer-card
entity: sensor.weather_station_smart_anemometer_wind_speed
direction_entity: sensor.weather_station_smart_anemometer_wind_direction
angle_entity: sensor.weather_station_smart_anemometer_wind_angle
gust_entity: sensor.weather_station_smart_anemometer_gust_strength
gust_direction_entity: sensor.weather_station_smart_anemometer_gust_direction
gust_angle_entity: sensor.weather_station_smart_anemometer_gust_angle
battery_entity: sensor.weather_station_smart_anemometer_battery
connectivity_entity: binary_sensor.weather_station_smart_anemometer_connectivity
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
| `battery_entity` | No | Battery percentage sensor. |
| `connectivity_entity` | No | Binary connectivity sensor. |
| `show_history` | No | Shows a collapsible 24 hour speed chart. |
| `name` | No | Card title. |
| `label` | No | Subtitle under the direction. |
| `speed_max` | No | Speed used for the visual scale and animation. Default: `80`. |
| `decimals` | No | Decimal places for speed values. Default: `0`. |
| `unit` | No | Unit override. Defaults to the entity unit. |
| `accent_color` | No | Main visual color. Default: `#4a90a4`. |
| `angle_entity` | No | Future wind angle support. Accepted now. |
| `gust_entity` | No | Optional gust speed badge. |
| `gust_direction_entity` | No | Optional gust direction badge. |
| `gust_angle_entity` | No | Future gust angle support. Accepted now. |

## HACS custom repository

1. Add this repository to HACS as a Dashboard repository.
2. Install the card.
3. Add the card resource if Home Assistant does not add it automatically:

```yaml
url: /hacsfiles/anemometer-card/anemometer-card.js
type: module
```

## Development

The card is intentionally a single JavaScript file with no build step. Use a local Home Assistant resource while developing:

```yaml
url: /local/community/anemometer-card/anemometer-card.js
type: module
```
