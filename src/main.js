// src/main.js
import "./style.css";
import { MeteoService } from "./meteo-service.js";
import {
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/* =========================
   UTILS
   ========================= */
function formatHour(isoString) {
  return isoString.slice(11, 16);
}

function dateKey(isoString) {
  return isoString.slice(0, 10);
}

function formatDay(yyyyMmDd) {
  const yyyy = yyyyMmDd.slice(0, 4);
  const mm = yyyyMmDd.slice(5, 7);
  const dd = yyyyMmDd.slice(8, 10);
  return `${dd}/${mm}/${yyyy}`;
}

function getCssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function n(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Number(value).toFixed(decimals);
}

function weatherInfo(code) {
  if (code === 0) return { icon: "☀️", label: "Sereno" };
  if ([1, 2].includes(code)) return { icon: "🌤️", label: "Parz. nuvoloso" };
  if (code === 3) return { icon: "☁️", label: "Coperto" };
  if ([45, 48].includes(code)) return { icon: "🌫️", label: "Nebbia" };
  if ([51, 53, 55].includes(code)) return { icon: "🌦️", label: "Pioviggine" };
  if ([61, 63, 65].includes(code)) return { icon: "🌧️", label: "Pioggia" };
  if ([71, 73, 75].includes(code)) return { icon: "❄️", label: "Neve" };
  if ([80, 81, 82].includes(code)) return { icon: "🌧️", label: "Rovesci" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️", label: "Temporale" };
  return { icon: "🌡️", label: `Codice ${code}` };
}

/* =========================
   NEXT 24 HOURS (from now)
   ========================= */
function pickNextHoursFromNow(allData, hours = 24) {
  const now = new Date();
  now.setMinutes(0, 0, 0); // arrotonda all'inizio dell'ora

  const startIndex = allData.findIndex((e) => new Date(e.time) >= now);
  const start = startIndex === -1 ? 0 : startIndex;

  return allData.slice(start, start + hours);
}

/* =========================
   SEZIONI (senza cambiare HTML)
   ========================= */
function ensureDaysSection() {
  const grid = document.querySelector(".grid");
  if (!grid) return null;

  let section = document.querySelector(".days-section");
  if (!section) {
    section = document.createElement("section");
    section.className = "days-section";
    section.innerHTML = `
      <h2 class="section-title">Oggi + 6 giorni</h2>
      <div class="days-grid" id="days-grid"></div>
    `;
    grid.parentNode.insertBefore(section, grid);
  }

  return document.getElementById("days-grid");
}

/* =========================
   TOOLTIP
   ========================= */
function ensureTooltip() {
  let tip = document.getElementById("meteo-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "meteo-tooltip";
    tip.className = "meteo-tooltip";
    tip.hidden = true;
    document.body.appendChild(tip);

    document.addEventListener("click", (e) => {
      if (tip.hidden) return;
      const hourCard = e.target.closest(".hour-card");
      const tooltip = e.target.closest("#meteo-tooltip");
      if (!hourCard && !tooltip) hideTooltip();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideTooltip();
    });
  }
  return tip;
}

function hideTooltip() {
  const tip = document.getElementById("meteo-tooltip");
  if (tip) tip.hidden = true;
}

function showTooltipNear(el, html) {
  const tip = ensureTooltip();
  tip.innerHTML = html;
  tip.querySelector(".meteo-tooltip-close")?.addEventListener("click", hideTooltip);

  const rect = el.getBoundingClientRect();
  const margin = 10;

  const top = rect.bottom + margin + window.scrollY;
  const left = Math.min(window.innerWidth - 340, Math.max(10, rect.left)) + window.scrollX;

  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
  tip.hidden = false;
}

/* =========================
   DATA: 7 days x 24 hours
   ========================= */
function groupInto7Days(dataAll) {
  const byDay = new Map();

  for (const e of dataAll) {
    const key = dateKey(e.time);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(e);
  }

  const dayKeys = Array.from(byDay.keys()).sort().slice(0, 7);

  return dayKeys.map((k) => ({
    dayKey: k,
    hours: byDay.get(k).slice(0, 24),
  }));
}

/* =========================
   RENDER UI
   ========================= */
function renderDays(days7) {
  const container = ensureDaysSection();
  if (!container) return;

  container.innerHTML = days7
    .map((d, dayIdx) => {
      const dayLabel = formatDay(d.dayKey);

      const hoursHtml = d.hours
        .map((h, hourIdx) => {
          const info = weatherInfo(h.weatherCode);
          return `
            <button class="hour-card" type="button" data-day="${dayIdx}" data-hour="${hourIdx}">
              <div class="hour-time">${formatHour(h.time)}</div>
              <div class="hour-icon" aria-hidden="true">${info.icon}</div>
              <div class="hour-temp">${n(h.temperature, 1)}°</div>
            </button>
          `;
        })
        .join("");

      return `
        <div class="day-card">
          <div class="day-header">
            <div class="day-title">${dayLabel}</div>
          </div>
          <div class="hours-row">${hoursHtml}</div>
        </div>
      `;
    })
    .join("");
}

function attachHourCardHandler(getDays7) {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".hour-card");
    if (!btn) return;

    const dayIdx = Number(btn.dataset.day);
    const hourIdx = Number(btn.dataset.hour);

    const days7 = getDays7();
    const entry = days7?.[dayIdx]?.hours?.[hourIdx];
    if (!entry) return;

    const info = weatherInfo(entry.weatherCode);

    showTooltipNear(
      btn,
      `
      <div class="meteo-tooltip-header">
        <div class="meteo-tooltip-title">${formatDay(dateKey(entry.time))} • ${formatHour(
        entry.time
      )}</div>
        <button class="meteo-tooltip-close" aria-label="Chiudi">✕</button>
      </div>

      <div class="meteo-tooltip-body">
        <div class="meteo-tooltip-row"><span>Meteo</span><strong>${info.icon} ${info.label}</strong></div>
        <div class="meteo-tooltip-row"><span>Temperatura</span><strong>${n(entry.temperature, 1)} °C</strong></div>
        <div class="meteo-tooltip-row"><span>Pioggia</span><strong>${n(entry.rain, 2)} mm</strong></div>
        <div class="meteo-tooltip-row"><span>Vento</span><strong>${n(entry.windSpeed, 0)} km/h</strong></div>
        <div class="meteo-tooltip-row"><span>Weather code</span><strong>${entry.weatherCode ?? "-"}</strong></div>
      </div>
      `
    );
  });
}

/* =========================
   CHARTS (più dettagli: tutte le 24 ore sui tick)
   ========================= */
function createLineChart(canvasId, labelText, lineColor) {
  const canvas = document.getElementById(canvasId);

  const textColor = getCssVar("--chart-text", "#111111");
  const gridColor = getCssVar("--chart-grid", "rgba(0,0,0,0.12)");

  return new Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: labelText,
          data: [],
          tension: 0.2,
          fill: false,
          borderColor: lineColor,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: lineColor,
          pointBorderColor: lineColor,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: textColor } },
        tooltip: { enabled: true, mode: "index", intersect: false },
      },
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            autoSkip: false, // ✅ mostra tutte le 24 ore
            minRotation: 60,
            maxRotation: 60,
            padding: 6,
            font: { size: 11 },
          },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
        },
      },
    },
  });
}

function updateChart(chart, labels, values) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.update();
}

const charts = {
  temp: createLineChart("temperature-chart", "Temperatura (°C)", "#ff6b6b"),
  rain: createLineChart("rain-chart", "Pioggia (mm)", "#4dabf7"),
  wind: createLineChart("wind-chart", "Vento (km/h)", "#69db7c"),
};

function displayCharts24h(next24) {
  const labels = next24.map((e) => formatHour(e.time));

  updateChart(charts.temp, labels, next24.map((e) => e.temperature));
  updateChart(charts.rain, labels, next24.map((e) => e.rain));
  updateChart(charts.wind, labels, next24.map((e) => e.windSpeed));

  // debug pioggia
  const rains = next24.map((e) => Number(e.rain ?? 0));
  console.log("RAIN next24:", rains);
  console.log("rain min/max:", Math.min(...rains), Math.max(...rains));
}

/* =========================
   APP
   ========================= */
const statusEl = document.getElementById("status");
const meteoService = new MeteoService();

let days7State = [];
attachHourCardHandler(() => days7State);

meteoService
  .getMeteoData(24 * 7)
  .then((all) => {
    statusEl.textContent = "Dati aggiornati.";

    days7State = groupInto7Days(all);
    renderDays(days7State);

    const next24 = pickNextHoursFromNow(all, 24);
    displayCharts24h(next24);
  })
  .catch((err) => {
    console.error(err);
    statusEl.textContent = "Errore nel caricamento meteo.";
  });
