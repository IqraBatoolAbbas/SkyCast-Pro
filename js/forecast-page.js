let cachedData = null;
let hourlyRowsCache = [];

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

function buildHourlyRows(forecastDays, unit, localtime) {
  const hours = WeatherAPI.getNext24Hours(forecastDays);
  const currentHour = localtime ? localtime.slice(0, 13) : "";
  return hours.map((hour, index) => ({
    index: index + 1,
    time: formatHourLabel(hour.time),
    tempC: hour.temp_c,
    temp: WeatherAPI.formatTemp(hour.temp_c, unit),
    humidity: hour.humidity,
    wind: hour.wind_kph,
    condition: hour.condition.text,
    icon: "https:" + hour.condition.icon,
    isNow: currentHour && hour.time.slice(0, 13) === currentHour,
  }));
}

function sortHourlyRows(rows) {
  const sort = document.getElementById("hourlySort")?.value || "time-asc";
  const sorted = [...rows];
  if (sort === "temp-desc") sorted.sort((a, b) => b.tempC - a.tempC);
  else if (sort === "temp-asc") sorted.sort((a, b) => a.tempC - b.tempC);
  else if (sort === "time-desc") sorted.sort((a, b) => b.index - a.index);
  else sorted.sort((a, b) => a.index - b.index);
  return sorted;
}

function renderHourlyTable(rows) {
  const tbody = document.getElementById("hourlyTableBody");
  if (!tbody) return;
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr class="${r.isNow ? "row-now" : ""}">
      <td>${String(r.index).padStart(2, "0")}</td>
      <td>${r.time}${r.isNow ? ' <span class="now-badge">Now</span>' : ""}</td>
      <td><img src="${r.icon}" alt="" width="28" class="table-icon"> ${r.condition}</td>
      <td><strong>${r.temp}</strong></td>
      <td>${r.humidity}%</td>
      <td>${r.wind} km/h</td>
    </tr>`
    )
    .join("");
}

function renderHourly(forecastDays, unit, localtime) {
  const container = document.getElementById("hourlyContainer");
  container.innerHTML = "";
  hourlyRowsCache = buildHourlyRows(forecastDays, unit, localtime);
  const rows = sortHourlyRows(hourlyRowsCache);
  renderHourlyTable(rows);

  rows.forEach((r) => {
    const box = document.createElement("div");
    box.className = "hour-box" + (r.isNow ? " hour-box--now" : "");
    box.innerHTML = `
      <div class="hour-time">
        <span class="hour-index">${String(r.index).padStart(2, "0")}</span>
        <strong>${r.time}</strong>
        ${r.isNow ? '<span class="now-badge">Now</span>' : ""}
      </div>
      <div class="hour-temp">
        <img src="${r.icon}" alt="" width="40" height="40">
        <h4>${r.temp}</h4>
      </div>
      <div class="hour-details">
        <span>💧 ${r.humidity}%</span>
        <span>🌬 ${r.wind} km/h</span>
        <span class="hour-condition">${r.condition}</span>
      </div>
    `;
    container.appendChild(box);
  });
}

function refreshHourlyDisplay() {
  if (!cachedData) return;
  const unit = getUnit();
  renderHourly(cachedData.forecast.forecastday, unit, cachedData.location.localtime);
}

let dailyRowsCache = [];

function buildDailyRows(days, unit) {
  return days.map((day, i) => {
    const d = new Date(day.date);
    return {
      index: i,
      weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
      dateLabel: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      dateRaw: day.date,
      maxtemp_c: day.day.maxtemp_c,
      mintemp_c: day.day.mintemp_c,
      max: WeatherAPI.formatTemp(day.day.maxtemp_c, unit),
      min: WeatherAPI.formatTemp(day.day.mintemp_c, unit),
      rain: day.day.daily_chance_of_rain ?? 0,
      wind: day.day.maxwind_kph ?? "—",
      condition: day.day.condition.text,
      icon: "https:" + day.day.condition.icon,
    };
  });
}

function sortDailyRows(rows) {
  const sort = document.getElementById("dailySort")?.value || "date-asc";
  const sorted = [...rows];
  if (sort === "temp-desc") sorted.sort((a, b) => b.maxtemp_c - a.maxtemp_c);
  else if (sort === "temp-asc") sorted.sort((a, b) => a.maxtemp_c - b.maxtemp_c);
  else if (sort === "date-desc") sorted.sort((a, b) => b.dateRaw.localeCompare(a.dateRaw));
  else sorted.sort((a, b) => a.dateRaw.localeCompare(b.dateRaw));
  return sorted;
}

function renderDailyList(rows) {
  const container = document.getElementById("dailyContainer");
  container.innerHTML = "";
  rows.forEach((r) => {
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div>
        <h4>${r.weekday}</h4>
        <span class="muted">${r.dateLabel}</span>
      </div>
      <img src="${r.icon}" alt="" width="40">
      <p><strong>${r.max}</strong> / ${r.min}</p>
      <span>${r.condition}</span>
    `;
    container.appendChild(card);
  });
}

function renderDailyTable(rows) {
  const tbody = document.getElementById("dailyTableBody");
  if (!tbody) return;
  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${r.weekday}</td>
      <td>${r.dateLabel}</td>
      <td><img src="${r.icon}" alt="" width="28" class="table-icon"> ${r.condition}</td>
      <td><strong>${r.max}</strong> / ${r.min}</td>
      <td>${r.rain}%</td>
      <td>${r.wind} km/h</td>
    </tr>`
    )
    .join("");
}

function renderDaily(days, unit) {
  dailyRowsCache = buildDailyRows(days, unit);
  const rows = sortDailyRows(dailyRowsCache);
  const tableMode = document.getElementById("viewDailyTableBtn")?.classList.contains("active");

  if (tableMode) {
    document.getElementById("dailyContainer").hidden = true;
    document.getElementById("dailyTableWrap").hidden = false;
    renderDailyTable(rows);
  } else {
    document.getElementById("dailyContainer").hidden = false;
    document.getElementById("dailyTableWrap").hidden = true;
    renderDailyList(rows);
  }
}

function refreshDailyDisplay() {
  if (!cachedData) return;
  renderDaily(cachedData.forecast.forecastday, getUnit());
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

  document.getElementById("hourlySort")?.addEventListener("change", refreshHourlyDisplay);
  document.getElementById("viewListBtn")?.addEventListener("click", () => {
    document.getElementById("viewListBtn").classList.add("active");
    document.getElementById("viewHourlyTableBtn").classList.remove("active");
    document.getElementById("hourlyContainer").hidden = false;
    document.getElementById("hourlyTableWrap").hidden = true;
  });
  document.getElementById("viewHourlyTableBtn")?.addEventListener("click", () => {
    document.getElementById("viewHourlyTableBtn").classList.add("active");
    document.getElementById("viewListBtn").classList.remove("active");
    document.getElementById("hourlyContainer").hidden = true;
    document.getElementById("hourlyTableWrap").hidden = false;
    refreshHourlyDisplay();
  });

  document.getElementById("dailySort")?.addEventListener("change", refreshDailyDisplay);
  document.getElementById("viewDailyListBtn")?.addEventListener("click", () => {
    document.getElementById("viewDailyListBtn").classList.add("active");
    document.getElementById("viewDailyTableBtn").classList.remove("active");
    refreshDailyDisplay();
  });
  document.getElementById("viewDailyTableBtn")?.addEventListener("click", () => {
    document.getElementById("viewDailyTableBtn").classList.add("active");
    document.getElementById("viewDailyListBtn").classList.remove("active");
    refreshDailyDisplay();
  });

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
