export class MeteoService {
    static apiUrl =
        "https://api.open-meteo.com/v1/forecast?latitude=44.411&longitude=8.896&hourly=temperature_2m,rain,weather_code,wind_speed_10m";

    constructor() {}

    getMeteoData() {
    return fetch(MeteoService.apiUrl)
        .then(response => response.json())
        .then(data => this.transformData(data));
    }


    transformData(data) {
    const hourly = data.hourly;
    const result = [];

    for (let i = 0; i < hourly.time.length; i++) {
        result.push({
            time: hourly.time[i],
            temperature: hourly.temperature_2m[i],
            rain: hourly.rain[i],
            weatherCode: hourly.weather_code[i],
            windSpeed: hourly.wind_speed_10m[i]
        });
    }

    return result;
}

}
