let cachedData = null;

function setTab(tab) {
  const hourly = document.getElementById("hourlyPanel");
  const daily = document.getElementById("dailyPanel");
  document.getElementById("hourlyTab").classList.toggle("active", tab === "hourly");
  document.getElementById("dailyTab").classList.toggle("active", tab === "daily");
  hourly.hidden = tab !== "hourly";
  daily.hidden = tab !== "daily";
}

function formatHourLabel(timeStr) {
  const t = timeStr.split(" ")[1];
  const hr = parseInt(t.split(":")[0], 10);
  const min = t.split(":")[1];
  const ampm = hr >= 12 ? "PM" : "AM";
  return `${hr % 12 || 12}:${min} ${ampm}`;
}

function renderHourly(forecastDays, unit, localtime) {
  const container = document.getElementById("hourlyContainer");
  container.innerHTML = "";
  const hours = WeatherAPI.getNext24Hours(forecastDays);
  const currentHour = localtime ? localtime.slice(0, 13) : "";

  hours.forEach((hour, index) => {
    const isNow = currentHour && hour.time.slice(0, 13) === currentHour;
    const box = document.createElement("div");
    box.className = "hour-box" + (isNow ? " hour-box--now" : "");
    box.innerHTML = `
      <div class="hour-time">
        <span class="hour-index">${String(index + 1).padStart(2, "0")}</span>
        <strong>${formatHourLabel(hour.time)}</strong>
        ${isNow ? '<span class="now-badge">Now</span>' : ""}
      </div>
      <div class="hour-temp">
        <img src="https:${hour.condition.icon}" alt="" width="40" height="40">
        <h4>${WeatherAPI.formatTemp(hour.temp_c, unit)}</h4>
      </div>
      <div class="hour-details">
        <span>💧 ${hour.humidity}%</span>
        <span>🌬 ${hour.wind_kph} km/h</span>
        <span class="hour-condition">${hour.condition.text}</span>
      </div>
    `;
    container.appendChild(box);
  });
}

function renderDaily(days, unit) {
  const container = document.getElementById("dailyContainer");
  container.innerHTML = "";
  days.forEach((day) => {
    const d = new Date(day.date);
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div>
        <h4>${d.toLocaleDateString("en-US", { weekday: "long" })}</h4>
        <span class="muted">${d.toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span>
      </div>
      <img src="https:${day.day.condition.icon}" alt="" width="40">
      <p><strong>${WeatherAPI.formatTemp(day.day.maxtemp_c, unit)}</strong> / ${WeatherAPI.formatTemp(day.day.mintemp_c, unit)}</p>
      <span>${day.day.condition.text}</span>
    `;
    container.appendChild(card);
  });
}

function calculateHHVI(temp, humidity, uvIndex) {
  const metricsEl = document.getElementById("hhviMetrics");
  const meterBar = document.getElementById("riskMeterBar");
  const adviceEl = document.getElementById("healthAdvice");
  if (!metricsEl) return;

  const risk = Math.round(Math.min(Math.max(temp * 0.6 + humidity * 0.3 + uvIndex * 2, 10), 100));
  const unit = getUnit();
  metricsEl.innerHTML = `Temp <strong>${WeatherAPI.formatTemp(temp, unit)}</strong> · Humidity <strong>${humidity}%</strong> · Stress <strong>${risk}%</strong>`;
  meterBar.style.width = risk + "%";

  if (risk < 45) {
    meterBar.style.backgroundColor = "#28a745";
    adviceEl.textContent = "Low heat stress. Normal outdoor activity is fine.";
  } else if (risk < 75) {
    meterBar.style.backgroundColor = "#ffc107";
    adviceEl.textContent = "Moderate stress. Drink water and take breaks in the shade.";
  } else {
    meterBar.style.backgroundColor = "#dc3545";
    adviceEl.textContent = "High heat risk. Limit outdoor exertion and rehydrate often.";
  }
}

function renderSuggestions(current) {
  const grid = document.getElementById("aiSuggestionsGrid");
  const feels = current.feelslike_c;
  const uv = current.uv;
  const cond = current.condition.text.toLowerCase();
  let html = "";

  if (feels > 34) {
    html += `<div class="ai-card">👕 Wear light, breathable clothing.</div>`;
    html += `<div class="ai-card">💧 Drink extra water today.</div>`;
  } else {
    html += `<div class="ai-card">👕 Standard layers should be comfortable.</div>`;
  }
  if (uv >= 6) {
    html += `<div class="ai-card">🧴 High UV — use SPF 40+ sunscreen.</div>`;
  }
  if (cond.includes("rain")) {
    html += `<div class="ai-card">☂️ Carry an umbrella or rain jacket.</div>`;
  } else if (cond.includes("clear") || cond.includes("sunny")) {
    html += `<div class="ai-card">🧺 Good day for outdoor drying and activities.</div>`;
  }
  grid.innerHTML = html || `<div class="ai-card">No extra tips for current conditions.</div>`;
}

async function loadWeather(query) {
  try {
    const data = await WeatherAPI.fetchForecast(query);
    cachedData = data;
    setLastCity(data.location.name);

    document.getElementById("forecastCity").textContent =
      data.location.name + ", " + data.location.country;
    document.getElementById("forecastDate").textContent = new Date(
      data.location.localtime
    ).toLocaleString();

    const unit = getUnit();
    renderHourly(data.forecast.forecastday, unit, data.location.localtime);
    renderDaily(data.forecast.forecastday, unit);
    calculateHHVI(data.current.temp_c, data.current.humidity, data.current.uv);
    renderSuggestions(data.current);
    updateBackgroundTheme(data.current.condition.text);
    window.__lastForecastDays = data.forecast.forecastday;
    refreshCharts(data.forecast.forecastday, unit);
  } catch (err) {
    console.error(err);
    showError();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("hourlyTab").onclick = () => setTab("hourly");
  document.getElementById("dailyTab").onclick = () => setTab("daily");
  setTab("hourly");

  wireSearchBar(loadWeather);
  wireUnitToggle(() => {
    if (cachedData) {
      loadWeather(cachedData.location.name);
    }
  });

  const last = getLastCity();
  if (last) {
    document.getElementById("cityInput").value = last;
    loadWeather(last);
  } else {
    WeatherAPI.resolveLocation().then(loadWeather);
  }
});
