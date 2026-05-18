let cachedData = null;

async function loadWeather(query) {
  try {
    const data = await WeatherAPI.fetchForecast(query);
    cachedData = data;
    setLastCity(data.location.name);
    renderHome(data);
    updateBackgroundTheme(data.current.condition.text);
  } catch (err) {
    console.error(err);
    showError("City not found. Try another name.");
  }
}

function renderHome(data) {
  const unit = getUnit();
  const c = data.current;
  const loc = data.location;

  document.getElementById("cityName").textContent = loc.name;
  document.getElementById("regionText").textContent = `${loc.region || ""}, ${loc.country}`.replace(/^, /, "");
  document.getElementById("date").textContent = new Date(loc.localtime).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  document.getElementById("temp").textContent = WeatherAPI.formatTemp(c.temp_c, unit);
  document.getElementById("feelsLikeMain").textContent =
    "Feels like: " + WeatherAPI.formatTemp(c.feelslike_c, unit);
  document.getElementById("condition").textContent = c.condition.text;
  document.getElementById("weatherIcon").src = "https:" + c.condition.icon;

  document.getElementById("windData").textContent = c.wind_kph + " km/h";
  document.getElementById("humidityData").textContent = c.humidity + "%";
  document.getElementById("uvData").textContent =
    c.uv + " (" + WeatherAPI.getUVText(c.uv) + ")";
  document.getElementById("visibilityData").textContent = c.vis_km + " km";
  document.getElementById("pressureData").textContent = c.pressure_mb + " mb";

  const dew = WeatherAPI.calcDewPoint(c.temp_c, c.humidity);
  document.getElementById("dewPointData").textContent = WeatherAPI.formatTemp(dew, unit);

  const day = data.forecast.forecastday[0].day;
  const summaryEl = document.getElementById("todaySummaryText");
  summaryEl.innerHTML = `
    <p class="summary-lead">${c.condition.text}</p>
    <div class="summary-stats">
      <span><strong>${WeatherAPI.formatTemp(day.maxtemp_c, unit)}</strong> high</span>
      <span><strong>${WeatherAPI.formatTemp(day.mintemp_c, unit)}</strong> low</span>
      <span><strong>${day.daily_chance_of_rain}%</strong> rain</span>
      <span><strong>${day.maxwind_kph} km/h</strong> wind</span>
    </div>
    <p class="summary-note">Full 24-hour timeline is on the <a href="forecast.html">Forecast</a> page.</p>
  `;

  renderAlerts(c, day);
}

function renderAlerts(current, day) {
  const box = document.getElementById("alertBox");
  const tempC = current.temp_c;

  if (tempC > 40) {
    box.innerHTML = "🚨 <strong>Heat warning:</strong> Very high temperature. Stay hydrated and limit sun exposure.";
    box.className = "alert-box alert-danger";
  } else if (day.daily_chance_of_rain > 65) {
    box.innerHTML = "🌧 <strong>Rain likely:</strong> " + day.daily_chance_of_rain + "% chance of rain today.";
    box.className = "alert-box alert-rain";
  } else if (current.uv >= 7) {
    box.innerHTML = "☀ <strong>High UV:</strong> Use sunscreen (SPF 30+) if you go outside.";
    box.className = "alert-box alert-warn";
  } else {
    box.innerHTML = "✅ Conditions look stable for today.";
    box.className = "alert-box";
  }
}

function addCurrentToFavorites() {
  if (!cachedData) {
    alert("Load a city first.");
    return;
  }
  const name = cachedData.location.name;
  const list = getFavorites();
  if (list.includes(name)) {
    alert(name + " is already in favorites.");
    return;
  }
  list.push(name);
  saveFavorites(list);
  document.getElementById("addFavoriteBtn").textContent = "★ Saved";
  setTimeout(() => {
    document.getElementById("addFavoriteBtn").textContent = "☆ Save city";
  }, 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  wireSearchBar(loadWeather);
  wireUnitToggle(() => cachedData && renderHome(cachedData));

  document.getElementById("addFavoriteBtn").onclick = addCurrentToFavorites;

  const input = document.getElementById("cityInput");
  const last = getLastCity();
  if (last) {
    input.value = last;
    loadWeather(last);
  } else {
    WeatherAPI.resolveLocation().then(loadWeather);
  }
});
