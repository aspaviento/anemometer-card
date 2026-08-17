const AC_VERSION = "0.1.2";

const AC_T = {
  en: {
    title: "Wind",
    speed: "Wind speed",
    direction: "Direction",
    gust: "Gust",
    offline: "Offline",
    unavailable: "Unavailable",
    history: "Last 24 h",
    noData: "No data",
    entity: "Wind speed entity",
    directionEntity: "Direction entity",
    batteryEntity: "Battery entity",
    connectivityEntity: "Connectivity entity",
    name: "Name",
    label: "Subtitle",
    showHistory: "Show history",
    speedMax: "Speed for full scale",
    decimals: "Decimals",
    unit: "Unit",
    accentColor: "Accent color",
  },
  es: {
    title: "Viento",
    speed: "Velocidad",
    direction: "Direccion",
    gust: "Racha",
    offline: "Sin conexion",
    unavailable: "No disponible",
    history: "Ultimas 24 h",
    noData: "Sin datos",
    entity: "Entidad de velocidad",
    directionEntity: "Entidad de direccion",
    batteryEntity: "Entidad de bateria",
    connectivityEntity: "Entidad de conectividad",
    name: "Nombre",
    label: "Subtitulo",
    showHistory: "Mostrar historial",
    speedMax: "Velocidad para escala completa",
    decimals: "Decimales",
    unit: "Unidad",
    accentColor: "Color principal",
  },
};

function acLang(hass, config) {
  const lang = (config && config.language) || (hass && hass.locale && hass.locale.language) || "en";
  return AC_T[lang] ? lang : "en";
}

function acT(hass, config) {
  return AC_T[acLang(hass, config)];
}

function acState(hass, entityId) {
  return entityId && hass && hass.states ? hass.states[entityId] : undefined;
}

function acNumber(hass, entityId) {
  const state = acState(hass, entityId);
  if (!state) return NaN;
  const value = parseFloat(state.state);
  return Number.isFinite(value) ? value : NaN;
}

function acUnit(hass, entityId, fallback) {
  const state = acState(hass, entityId);
  return (state && state.attributes && state.attributes.unit_of_measurement) || fallback || "";
}

function acDirectionLabel(value) {
  if (value === undefined || value === null || value === "" || value === "unknown" || value === "unavailable") {
    return "--";
  }
  return String(value).toUpperCase();
}

function acDirectionAngle(value) {
  const parsed = parseFloat(value);
  if (Number.isFinite(parsed)) return parsed;
  const map = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 };
  return map[String(value || "").toLowerCase()] ?? 0;
}

function acClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function acSameConfig(a, b) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

class AnemometerCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.entity) throw new Error("Please define an entity");
    const speedMax = parseFloat(config.speed_max);
    const decimals = parseInt(config.decimals, 10);
    this._config = {
      ...config,
      speed_max: speedMax > 0 ? speedMax : 80,
      decimals: decimals >= 0 && decimals <= 3 ? decimals : 0,
      accent_color: config.accent_color || "#4a90a4",
      history_range: config.history_range || "24h",
      history_bucket: config.history_bucket || "hour",
    };
    this._historyOpen = false;
    this._historyLoadedAt = 0;
    this._built = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) {
      this._build();
      this._built = true;
    }
    this._update();
  }

  getCardSize() {
    return this._config && this._config.show_history ? 6 : 4;
  }

  _build() {
    const root = this.attachShadow ? this.attachShadow({ mode: "open" }) : this;
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          border-radius: var(--ha-card-border-radius, 12px);
          overflow: hidden;
        }

        .ac-card {
          position: relative;
          padding: 20px 28px 16px;
          color: var(--primary-text-color);
          min-height: 276px;
          box-sizing: border-box;
        }

        .ac-status-row {
          position: absolute;
          top: 18px;
          left: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--secondary-text-color);
          font-size: 18px;
          pointer-events: none;
        }

        .ac-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 26px;
        }

        .ac-main {
          display: grid;
          grid-template-columns: minmax(130px, 42%) minmax(0, 1fr);
          align-items: center;
          gap: 18px;
          min-height: 188px;
          padding-top: 20px;
        }

        .ac-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }

        .ac-reading {
          min-width: 0;
        }

        .ac-title {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.15;
        }

        .ac-value {
          display: flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
        }

        .ac-speed {
          font-size: clamp(42px, 11vw, 60px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: 0;
        }

        .ac-unit {
          color: var(--secondary-text-color);
          font-size: 24px;
          font-weight: 600;
        }

        .ac-label,
        .ac-sub {
          margin-top: 8px;
          color: var(--secondary-text-color);
          font-size: 21px;
          font-weight: 600;
          line-height: 1.25;
        }

        .ac-sub {
          font-size: 18px;
          font-weight: 500;
        }

        .ac-advanced {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .ac-pill {
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 5px 8px;
          color: var(--secondary-text-color);
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
        }

        .ac-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          margin: 2px 0 0;
          border: 0;
          background: transparent;
          color: var(--secondary-text-color);
          cursor: pointer;
          font: inherit;
          font-size: 18px;
          font-weight: 700;
        }

        .ac-toggle svg {
          transition: transform 160ms ease;
        }

        .ac-toggle[aria-expanded="true"] svg {
          transform: rotate(180deg);
        }

        .ac-history {
          margin-top: 12px;
        }

        .ac-history-status {
          display: flex;
          min-height: 110px;
          align-items: center;
          justify-content: center;
          color: var(--secondary-text-color);
          font-size: 14px;
        }

        .ac-hist-grid {
          stroke: var(--divider-color);
          stroke-width: 1;
        }

        .ac-hist-axis {
          fill: var(--secondary-text-color);
          font-size: 10px;
        }

        .ac-hist-line {
          fill: none;
          stroke: var(--ac-accent);
          stroke-width: 3;
          stroke-linejoin: round;
          stroke-linecap: round;
        }

        .ac-hist-area {
          fill: var(--ac-accent);
          opacity: 0.16;
        }

        @media (max-width: 420px) {
          .ac-card {
            padding: 20px 20px 16px;
          }

          .ac-main {
            grid-template-columns: 1fr;
            gap: 8px;
            padding-top: 28px;
            text-align: center;
          }

          .ac-value {
            justify-content: center;
          }

          .ac-advanced {
            justify-content: center;
          }
        }
      </style>
      <ha-card>
        <div class="ac-card">
          <div class="ac-status-row">
            <div class="ac-status" id="connectivity"></div>
            <div class="ac-status" id="battery"></div>
          </div>
          <div class="ac-main">
            <div class="ac-visual" id="visual"></div>
            <div class="ac-reading">
              <h2 class="ac-title" id="title"></h2>
              <div class="ac-value">
                <span class="ac-speed" id="speed"></span>
                <span class="ac-unit" id="unit"></span>
              </div>
              <div class="ac-label" id="direction"></div>
              <div class="ac-sub" id="label"></div>
              <div class="ac-advanced" id="advanced"></div>
            </div>
          </div>
          <button class="ac-toggle" id="toggle" hidden>
            <svg width="15" height="15" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span id="history-title"></span>
          </button>
          <div class="ac-history" id="history" hidden></div>
        </div>
      </ha-card>
    `;
    this._root = root;
    this._el = {
      card: root.querySelector(".ac-card"),
      connectivity: root.getElementById("connectivity"),
      battery: root.getElementById("battery"),
      visual: root.getElementById("visual"),
      title: root.getElementById("title"),
      speed: root.getElementById("speed"),
      unit: root.getElementById("unit"),
      direction: root.getElementById("direction"),
      label: root.getElementById("label"),
      advanced: root.getElementById("advanced"),
      toggle: root.getElementById("toggle"),
      historyTitle: root.getElementById("history-title"),
      history: root.getElementById("history"),
    };
    this._el.toggle.addEventListener("click", () => this._toggleHistory());
  }

  _update() {
    if (!this._hass || !this._config) return;
    const t = acT(this._hass, this._config);
    const c = this._config;
    const speedState = acState(this._hass, c.entity);
    const speed = acNumber(this._hass, c.entity);
    const directionState = acState(this._hass, c.direction_entity);
    const directionRaw = directionState ? directionState.state : undefined;
    const directionLabel = acDirectionLabel(directionRaw);
    const directionAngle = c.angle_entity ? acNumber(this._hass, c.angle_entity) : acDirectionAngle(directionRaw);
    const unit = c.unit || acUnit(this._hass, c.entity, "km/h");
    const unavailable = !speedState || ["unknown", "unavailable"].includes(speedState.state);

    this._el.card.style.setProperty("--ac-accent", c.accent_color);
    this._el.title.textContent = c.name || t.title;
    this._el.speed.textContent = unavailable || !Number.isFinite(speed) ? "--" : speed.toFixed(c.decimals);
    this._el.unit.textContent = unit;
    this._el.direction.textContent = `${t.direction}: ${directionLabel}`;
    this._el.label.textContent = c.label || "";
    this._el.visual.innerHTML = this._visualSvg(speed, directionAngle, unavailable);
    this._el.connectivity.innerHTML = this._connectivitySvg();
    this._el.battery.innerHTML = this._batterySvg();
    this._el.advanced.innerHTML = this._advancedBadges(t);

    this._el.toggle.hidden = c.show_history !== true;
    this._el.toggle.setAttribute("aria-expanded", this._historyOpen ? "true" : "false");
    this._el.historyTitle.textContent = t.history;
    this._el.history.hidden = !this._historyOpen;
  }

  _visualSvg(speed, directionAngle, unavailable) {
    const c = this._config;
    const opacity = unavailable ? 0.38 : 1;
    const needle = Number.isFinite(directionAngle) ? directionAngle : 0;
    const stroke = c.accent_color;
    return `
      <svg width="184" height="184" viewBox="0 0 210 210" role="img" aria-label="Anemometer" style="max-width:100%;height:auto;opacity:${opacity}">
        <circle cx="105" cy="105" r="88" fill="none" stroke="var(--divider-color)" stroke-width="2"/>
        <circle cx="105" cy="105" r="70" fill="none" stroke="var(--divider-color)" stroke-width="1" stroke-dasharray="3 8"/>
        <g transform="translate(105 105)">
          <text x="0" y="-76" text-anchor="middle" fill="var(--secondary-text-color)" font-size="12" font-weight="700">N</text>
          <text x="76" y="4" text-anchor="middle" fill="var(--secondary-text-color)" font-size="12" font-weight="700">E</text>
          <text x="0" y="84" text-anchor="middle" fill="var(--secondary-text-color)" font-size="12" font-weight="700">S</text>
          <text x="-76" y="4" text-anchor="middle" fill="var(--secondary-text-color)" font-size="12" font-weight="700">W</text>
        </g>
        <g>
          <line x1="105" y1="122" x2="105" y2="174" stroke="#899" stroke-width="8" stroke-linecap="round"/>
          <line x1="105" y1="105" x2="105" y2="50" stroke="#789" stroke-width="5" stroke-linecap="round"/>
          <line x1="105" y1="105" x2="153" y2="132" stroke="#789" stroke-width="5" stroke-linecap="round"/>
          <line x1="105" y1="105" x2="57" y2="132" stroke="#789" stroke-width="5" stroke-linecap="round"/>
          <ellipse cx="105" cy="43" rx="20" ry="12" fill="#f4f8f8" stroke="#789" stroke-width="4"/>
          <ellipse cx="161" cy="137" rx="20" ry="12" fill="#f4f8f8" stroke="#789" stroke-width="4" transform="rotate(30 161 137)"/>
          <ellipse cx="49" cy="137" rx="20" ry="12" fill="#f4f8f8" stroke="#789" stroke-width="4" transform="rotate(-30 49 137)"/>
          <circle cx="105" cy="105" r="16" fill="#f4f8f8" stroke="#789" stroke-width="5"/>
        </g>
        <g transform="translate(105 105) rotate(${needle})">
          <path d="M0 -64 L8 -22 L0 -29 L-8 -22 Z" fill="${stroke}" opacity="0.95"/>
          <line x1="0" y1="-29" x2="0" y2="42" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>
    `;
  }

  _connectivitySvg() {
    const c = this._config;
    const t = acT(this._hass, c);
    const state = acState(this._hass, c.connectivity_entity);
    if (!c.connectivity_entity || !state) return "";
    const ok = state.state === "on";
    const color = ok ? "var(--secondary-text-color)" : "var(--error-color)";
    const title = ok ? "" : t.offline;
    return `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round">
        <path d="M5 12.5a10 10 0 0 1 14 0"/>
        <path d="M8.5 16a5 5 0 0 1 7 0"/>
        <path d="M12 20h.01"/>
      </svg>
      <span>${title}</span>
    `;
  }

  _batterySvg() {
    const c = this._config;
    const battery = acNumber(this._hass, c.battery_entity);
    if (!c.battery_entity || !Number.isFinite(battery)) return "";
    const pct = acClamp(battery, 0, 100);
    const width = Math.round(28 * pct / 100);
    const color = pct <= 20 ? "var(--error-color)" : pct <= 45 ? "var(--warning-color, #d6a23a)" : "#45a557";
    return `
      <svg width="34" height="22" viewBox="0 0 34 22" fill="none" stroke="var(--secondary-text-color)" stroke-width="2.5">
        <rect x="1.5" y="3" width="28" height="16" rx="3"/>
        <path d="M31 8v6"/>
        <rect x="4" y="5.5" width="${width}" height="11" rx="1.8" fill="${color}" stroke="none"/>
      </svg>
      <span>${Math.round(pct)}%</span>
    `;
  }

  _advancedBadges(t) {
    const c = this._config;
    const badges = [];
    const gust = acNumber(this._hass, c.gust_entity);
    const gustUnit = c.gust_entity ? acUnit(this._hass, c.gust_entity, acUnit(this._hass, c.entity, "")) : "";
    const gustDirection = acState(this._hass, c.gust_direction_entity);
    if (Number.isFinite(gust)) badges.push(`${t.gust} ${gust.toFixed(c.decimals)} ${gustUnit}`.trim());
    if (gustDirection && !["unknown", "unavailable"].includes(gustDirection.state)) badges.push(`${t.gust} ${acDirectionLabel(gustDirection.state)}`);
    return badges.map((b) => `<span class="ac-pill">${b}</span>`).join("");
  }

  async _toggleHistory() {
    this._historyOpen = !this._historyOpen;
    this._el.history.hidden = !this._historyOpen;
    this._el.toggle.setAttribute("aria-expanded", this._historyOpen ? "true" : "false");
    if (this._historyOpen) await this._loadHistory();
  }

  async _loadHistory() {
    const t = acT(this._hass, this._config);
    const body = this._el.history;
    body.innerHTML = `<div class="ac-history-status">...</div>`;
    try {
      const start = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
      const url = `history/period/${start}?filter_entity_id=${this._config.entity}&minimal_response&no_attributes`;
      const res = await this._hass.callApi("GET", url);
      const raw = (res && res[0]) || [];
      const pts = raw
        .map((s) => ({ t: new Date(s.last_changed || s.last_updated).getTime(), v: parseFloat(s.state) }))
        .filter((p) => Number.isFinite(p.v) && Number.isFinite(p.t));
      body.innerHTML = pts.length ? this._historySvg(pts) : `<div class="ac-history-status">${t.noData}</div>`;
      this._historyLoadedAt = Date.now();
    } catch (err) {
      body.innerHTML = `<div class="ac-history-status">${t.noData}</div>`;
    }
  }

  _historySvg(pts) {
    const W = 480, H = 150, L = 34, R = 8, T = 10, B = 22;
    const end = Date.now();
    const start = end - 24 * 3600 * 1000;
    const filtered = pts.filter((p) => p.t >= start && p.t <= end);
    if (!filtered.length) return `<div class="ac-history-status">${acT(this._hass, this._config).noData}</div>`;
    const vmax0 = Math.max(...filtered.map((p) => p.v), 0);
    const vmax = Math.max(10, Math.ceil(vmax0 / 10) * 10);
    const x = (ts) => L + ((ts - start) / (end - start)) * (W - L - R);
    const y = (v) => T + (1 - v / vmax) * (H - T - B);
    const points = filtered.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const area = `${L},${H - B} ${points} ${W - R},${H - B}`;
    let grid = "";
    for (const f of [0, 0.5, 1]) {
      const gy = y(vmax * f).toFixed(1);
      grid += `<line class="ac-hist-grid" x1="${L}" y1="${gy}" x2="${W - R}" y2="${gy}"/>`;
      grid += `<text class="ac-hist-axis" x="${L - 4}" y="${(+gy + 3.5).toFixed(1)}" text-anchor="end">${Math.round(vmax * f)}</text>`;
    }
    for (let k = 0; k <= 4; k++) {
      const ts = start + k * 6 * 3600 * 1000;
      const d = new Date(ts);
      const tx = (L + (k / 4) * (W - L - R)).toFixed(1);
      grid += `<text class="ac-hist-axis" x="${tx}" y="${H - 7}" text-anchor="${k === 0 ? "start" : k === 4 ? "end" : "middle"}">${d.getHours()}h</text>`;
    }
    return `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="150" preserveAspectRatio="none">
        ${grid}
        <polygon class="ac-hist-area" points="${area}"/>
        <polyline class="ac-hist-line" points="${points}"/>
      </svg>
    `;
  }

  static getConfigElement() {
    return document.createElement("anemometer-card-editor");
  }

  static getStubConfig(hass) {
    const states = hass && hass.states ? Object.keys(hass.states) : [];
    const speed = states.find((id) => id.includes("anemometer") && id.includes("wind_speed")) || states.find((id) => id.startsWith("sensor.") && id.includes("wind"));
    return {
      type: "custom:anemometer-card",
      entity: speed || "",
      direction_entity: states.find((id) => id.includes("anemometer") && id.includes("wind_direction")) || "",
      show_history: true,
    };
  }
}

class AnemometerCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;
    const c = this._config;
    const t = acT(this._hass, c);
    if (!this._form) {
      this.innerHTML = `<ha-form></ha-form>`;
      this._form = this.querySelector("ha-form");
      this._form.addEventListener("value-changed", (ev) => {
        const next = ev.detail.value;
        if (acSameConfig(next, this._config)) return;
        this._config = next;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
      });
    }
    const sensor = { filter: [{ domain: "sensor" }] };
    const binary = { filter: [{ domain: "binary_sensor" }] };
    this._form.hass = this._hass;
    this._form.data = {
      type: "custom:anemometer-card",
      entity: c.entity || "",
      direction_entity: c.direction_entity || "",
      battery_entity: c.battery_entity || "",
      connectivity_entity: c.connectivity_entity || "",
      name: c.name || "",
      label: c.label || "",
      show_history: c.show_history === true,
      speed_max: c.speed_max || 80,
      decimals: c.decimals != null ? c.decimals : 0,
      unit: c.unit || "",
      accent_color: c.accent_color || "#4a90a4",
      angle_entity: c.angle_entity || "",
      gust_entity: c.gust_entity || "",
      gust_direction_entity: c.gust_direction_entity || "",
      gust_angle_entity: c.gust_angle_entity || "",
    };
    this._form.schema = [
      { name: "entity", label: t.entity, required: true, selector: { entity: sensor } },
      { name: "direction_entity", label: t.directionEntity, selector: { entity: sensor } },
      { name: "battery_entity", label: t.batteryEntity, selector: { entity: sensor } },
      { name: "connectivity_entity", label: t.connectivityEntity, selector: { entity: binary } },
      { name: "name", label: t.name, selector: { text: {} } },
      { name: "label", label: t.label, selector: { text: {} } },
      { name: "show_history", label: t.showHistory, selector: { boolean: {} } },
      { name: "speed_max", label: t.speedMax, selector: { number: { mode: "box", min: 1, step: "any" } } },
      { name: "decimals", label: t.decimals, selector: { number: { mode: "box", min: 0, max: 3, step: 1 } } },
      { name: "unit", label: t.unit, selector: { text: {} } },
      { name: "accent_color", label: t.accentColor, selector: { text: {} } },
      { name: "angle_entity", label: "Future: wind angle entity", selector: { entity: sensor } },
      { name: "gust_entity", label: "Future: gust speed entity", selector: { entity: sensor } },
      { name: "gust_direction_entity", label: "Future: gust direction entity", selector: { entity: sensor } },
      { name: "gust_angle_entity", label: "Future: gust angle entity", selector: { entity: sensor } },
    ];
  }
}

customElements.define("anemometer-card", AnemometerCard);
customElements.define("anemometer-card-editor", AnemometerCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "anemometer-card",
  name: "Anemometer Card",
  description: "A wind card with animated anemometer, direction, battery, connectivity, and optional 24 h history.",
});

console.info(`%c ANEMOMETER-CARD %c ${AC_VERSION} `, "color: white; background: #4a90a4; font-weight: 700;", "color: #4a90a4; background: white; font-weight: 700;");
