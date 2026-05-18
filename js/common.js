const Storage = {
  UNIT: "skycast_unit",
  CITY: "skycast_last_city",
  FAVORITES: "skycast_favorites",
  THEME: "skycast_theme",
};

const FOOTER_HTML = `
  <p>&copy; 2026 SkyCast Pro · <a href="https://www.weatherapi.com/" target="_blank" rel="noopener">WeatherAPI.com</a> · Engineered by <span>Iqra Batool Abbas</span></p>
`;

function getUnit() {
  return localStorage.getItem(Storage.UNIT) || "C";
}

function setUnit(unit) {
  localStorage.setItem(Storage.UNIT, unit);
}

function getTheme() {
  return localStorage.getItem(Storage.THEME) || "light";
}

function setTheme(theme) {
  localStorage.setItem(Storage.THEME, theme);
  document.documentElement.setAttribute("data-theme", theme);
  syncThemeIcon();
  if (window.tempChartInstance && window.__lastForecastDays && typeof refreshCharts === "function") {
    refreshCharts(window.__lastForecastDays, getUnit());
  }
}

function syncThemeIcon() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const dark = getTheme() === "dark";
  btn.innerHTML = dark
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
  btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

function initTheme() {
  document.documentElement.setAttribute("data-theme", getTheme());
  syncThemeIcon();
}

function wireThemeToggle() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  btn.onclick = () => setTheme(getTheme() === "dark" ? "light" : "dark");
}

function wireNavToggle() {
  const toggle = document.getElementById("navToggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.onclick = () => {
    links.classList.toggle("open");
    toggle.classList.toggle("active");
  };
  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
}

function injectSharedFooter() {
  document.querySelectorAll(".app-footer").forEach((el) => {
    el.innerHTML = FOOTER_HTML;
  });
}

function getLastCity() {
  return localStorage.getItem(Storage.CITY) || "";
}

function setLastCity(city) {
  localStorage.setItem(Storage.CITY, city);
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(Storage.FAVORITES) || "[]");
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(Storage.FAVORITES, JSON.stringify(list));
}

function setActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === page);
  });
}

function wireSearchBar(onSearch) {
  const input = document.getElementById("cityInput");
  const btn = document.getElementById("searchBtn");
  const locBtn = document.getElementById("locationBtn");

  if (!input || !btn) return;

  const run = async () => {
    const q = input.value.trim();
    if (!q) {
      alert("Please enter a city name.");
      return;
    }
    setLastCity(q);
    await onSearch(q);
  };

  btn.onclick = run;
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") run();
  });

  if (locBtn) {
    locBtn.onclick = async () => {
      locBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      const query = await WeatherAPI.resolveLocation();
      input.value = "";
      setLastCity(query);
      await onSearch(query);
      locBtn.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
    };
  }
}

function wireUnitToggle(onChange) {
  const btn = document.getElementById("unitToggleBtn");
  if (!btn) return;

  const syncLabel = () => {
    const unit = getUnit();
    btn.textContent = unit === "C" ? "°F" : "°C";
    btn.dataset.unit = unit;
  };

  syncLabel();
  btn.onclick = () => {
    setUnit(getUnit() === "C" ? "F" : "C");
    syncLabel();
    if (onChange) onChange();
  };
}

function updateBackgroundTheme(conditionText) {
  if (!conditionText || getTheme() === "dark") {
    document.body.style.removeProperty("background");
    return;
  }
  const cond = conditionText.toLowerCase();
  let gradient = "var(--bg-gradient)";

  if (cond.includes("sunny") || cond.includes("clear")) {
    gradient = "linear-gradient(145deg, #fffbeb 0%, #e0f2fe 50%, #f8fafc 100%)";
  } else if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) {
    gradient = "linear-gradient(145deg, #e0f2fe 0%, #bae6fd 55%, #f1f5f9 100%)";
  } else if (cond.includes("cloud") || cond.includes("overcast") || cond.includes("mist") || cond.includes("fog")) {
    gradient = "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 60%, #f8fafc 100%)";
  } else if (cond.includes("thunder") || cond.includes("storm")) {
    gradient = "linear-gradient(145deg, #fee2e2 0%, #e0f2fe 70%, #f8fafc 100%)";
  }

  document.body.style.background = gradient;
}

function showError(message) {
  alert(message || "Could not load weather. Check the city name and your API key.");
}

function initLayout() {
  initTheme();
  injectSharedFooter();
  wireThemeToggle();
  wireNavToggle();
  setActiveNav();
}

document.addEventListener("DOMContentLoaded", initLayout);
