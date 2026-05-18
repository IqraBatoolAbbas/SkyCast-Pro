const WeatherAPI = {
  base: "https://api.weatherapi.com/v1",

  async fetchForecast(query, days = 5) {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `${this.base}/forecast.json?key=${API_KEY}&q=${q}&days=${days}&aqi=yes&alerts=yes`
    );
    if (!res.ok) throw new Error("City not found");
    return res.json();
  },

  getNext24Hours(forecastDays) {
    const allHours = forecastDays.flatMap((day) => day.hour);
    const now = new Date();
    const upcoming = allHours.filter((h) => new Date(h.time.replace(" ", "T")) >= now);

    if (upcoming.length >= 24) return upcoming.slice(0, 24);

    const padded = [...upcoming];
    for (const h of allHours) {
      if (padded.length >= 24) break;
      if (!padded.some((x) => x.time === h.time)) padded.push(h);
    }
    return padded.slice(0, 24);
  },

  getUVText(uv) {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    return "Very High";
  },

  calcDewPoint(tempC, humidity) {
    return Math.round(tempC - (100 - humidity) / 5);
  },

  formatTemp(celsius, unit) {
    if (unit === "C") return `${Math.round(celsius)}°C`;
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  },

  async resolveLocation() {
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        );
        return `${pos.coords.latitude},${pos.coords.longitude}`;
      } catch {
        /* fall through */
      }
    }
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data.city) return data.city;
    } catch {
      /* fall through */
    }
    return "Lahore";
  },
};
