import "./style.css";
import { MeteoService } from "./meteo-service.js";

const meteoService = new MeteoService();

meteoService.getMeteoData().then(data => {
    console.log(data);
});

 export function displayDataMeteo(data) {
        const container = document.getElementById("meteo-data");
        data.forEach(entry => {
            const entryDiv = document.createElement("div");
            entryDiv.classList.add("meteo-entry");
            entryDiv.innerHTML = `
                <p><strong>Time:</strong> ${entry.time}</p>
                <p><strong>Temperature:</strong> ${entry.temperature} °C</p>
                <p><strong>Rain:</strong> ${entry.rain} mm</p>
                <p><strong>Weather Code:</strong> ${entry.weatherCode}</p>
                <p><strong>Wind Speed:</strong> ${entry.windSpeed} km/h</p>
                <hr/>
            `;
            container.appendChild(entryDiv);
        });
 }
 
meteoService.getMeteoData().then(data => {
    displayDataMeteo(data);
});
