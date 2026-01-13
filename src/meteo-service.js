export class MeteoService {
  static apiUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=44.411&longitude=8.896" +
    "&hourly=temperature_2m,rain,weather_code,wind_speed_10m" +
    "&timezone=Europe%2FRome" +
    "&wind_speed_unit=kmh";

  getMeteoData(hours = 24) {
    return fetch(MeteoService.apiUrl)
      .then((response) => {
        if (!response.ok) throw new Error("HTTP error: " + response.status);
        return response.json();
      })
      .then((data) => this.transformData(data).slice(0, hours));
  }

  transformData(data) {
    const h = data.hourly;
    const result = [];

    for (let i = 0; i < h.time.length; i++) {
      result.push({
        time: h.time[i],
        temperature: h.temperature_2m[i],
        rain: h.rain[i],
        weatherCode: h.weather_code[i],
        windSpeed: h.wind_speed_10m[i],
      });
    }

    return result;
  }
}
