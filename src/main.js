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

function formatHour(isoString) {
  // "2026-01-13T14:00" -> "14:00"
  return isoString.slice(11, 16);
}

function createLineChart(canvasId, labelText) {
  const canvas = document.getElementById(canvasId);

  return new Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: labelText,
          data: [],
          fill: false,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        x: { ticks: { maxRotation: 0 } },
      },
    },
  });
}

function updateChart(chart, labels, values) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.update();
}

// Creo i 3 grafici una volta sola
const charts = {
  temp: createLineChart("temperature-chart", "Temperatura (°C)"),
  rain: createLineChart("rain-chart", "Pioggia (mm)"),
  wind: createLineChart("wind-chart", "Vento (km/h)"),
};

function displayDataMeteo(data) {
  const labels = data.map((e) => formatHour(e.time));

  updateChart(charts.temp, labels, data.map((e) => e.temperature));
  updateChart(charts.rain, labels, data.map((e) => e.rain));
  updateChart(charts.wind, labels, data.map((e) => e.windSpeed));
}

const statusEl = document.getElementById("status");
const meteoService = new MeteoService();

meteoService
  .getMeteoData(24)
  .then((data) => {
    statusEl.textContent = "Dati aggiornati (prossime 24 ore).";
    displayDataMeteo(data);
  })
  .catch((err) => {
    console.error(err);
    statusEl.textContent = "Errore nel caricamento meteo.";
  });
