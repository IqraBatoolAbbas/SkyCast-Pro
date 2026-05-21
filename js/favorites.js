let favoritesCache = [];

async function loadFavoriteData(city) {
  try {
    const data = await WeatherAPI.fetchForecast(city, 1);
    return {
      city,
      tempC: data.current.temp_c,
      temp: WeatherAPI.formatTemp(data.current.temp_c, getUnit()),
      icon: "https:" + data.current.condition.icon,
      condition: data.current.condition.text,
      humidity: data.current.humidity,
    };
  } catch {
    return { city, tempC: -999, temp: "—", icon: "", condition: "Error", humidity: 0 };
  }
}

function getFilteredSorted(list) {
  const q = (document.getElementById("favFilter")?.value || "").toLowerCase();
  const sort = document.getElementById("favSort")?.value || "name-asc";

  let items = [...list].filter((i) => i.city.toLowerCase().includes(q));

  items.sort((a, b) => {
    if (sort === "name-asc") return a.city.localeCompare(b.city);
    if (sort === "name-desc") return b.city.localeCompare(a.city);
    if (sort === "temp-desc") return b.tempC - a.tempC;
    if (sort === "temp-asc") return a.tempC - b.tempC;
    return 0;
  });
  return items;
}

function renderCardView(items) {
  const grid = document.getElementById("favoritesGrid");
  grid.querySelectorAll(".favorite-card").forEach((el) => el.remove());
  const empty = document.getElementById("emptyFavorites");

  if (!items.length) {
    empty.hidden = false;
    empty.textContent = favoritesCache.length
      ? "No cities match your search."
      : "No favorites yet. Search a city on Home and click “Save city”, or add one above.";
    return;
  }
  empty.hidden = true;

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "favorite-card";
    card.innerHTML = `
      <div class="fav-top">
        <h3>${item.city}</h3>
        <button type="button" class="fav-remove" data-city="${item.city}" aria-label="Remove">×</button>
      </div>
      ${item.icon ? `<img src="${item.icon}" alt="" width="48">` : ""}
      <p class="fav-temp">${item.temp}</p>
      <p class="muted">${item.condition}</p>
      <a href="index.html" class="btn-primary fav-open" data-city="${item.city}">Open</a>
    `;
    grid.appendChild(card);
  });
  wireFavoriteActions();
}

function renderTableView(items) {
  const tbody = document.getElementById("favoritesTableBody");
  const tableWrap = document.getElementById("favoritesTableWrap");
  const grid = document.getElementById("favoritesGrid");
  const empty = document.getElementById("emptyFavorites");

  grid.querySelectorAll(".favorite-card").forEach((el) => el.remove());

  if (!items.length) {
    tableWrap.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  tableWrap.hidden = false;
  tbody.innerHTML = items
    .map(
      (item) => `
    <tr>
      <td>${item.icon ? `<img src="${item.icon}" alt="" width="32" class="table-icon">` : ""} ${item.city}</td>
      <td><strong>${item.temp}</strong></td>
      <td>${item.condition}</td>
      <td>${item.humidity}%</td>
      <td class="table-actions">
        <button type="button" class="btn-secondary btn-sm fav-open" data-city="${item.city}">Open</button>
        <button type="button" class="btn-secondary btn-sm fav-remove" data-city="${item.city}">Remove</button>
      </td>
    </tr>`
    )
    .join("");
  wireFavoriteActions();
}

function wireFavoriteActions() {
  document.querySelectorAll(".fav-remove").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const city = btn.dataset.city;
      saveFavorites(getFavorites().filter((c) => c !== city));
      renderFavorites();
    };
  });
  document.querySelectorAll(".fav-open").forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      setLastCity(link.dataset.city);
      window.location.href = "index.html";
    };
  });
}

async function renderFavorites() {
  const cities = getFavorites();
  favoritesCache = [];
  for (const city of cities) {
    favoritesCache.push(await loadFavoriteData(city));
  }

  const items = getFilteredSorted(favoritesCache);
  const view = document.getElementById("viewTableBtn")?.classList.contains("active") ? "table" : "cards";

  document.getElementById("favoritesTableWrap").hidden = view !== "table";
  if (view === "table") renderTableView(items);
  else renderCardView(items);
}

function addFavoriteFromSearch() {
  if (!isLoggedIn()) {
    window.location.href = "account.html";
    return;
  }
  const input = document.getElementById("cityInput");
  const name = input.value.trim();
  if (!name) return;
  const list = getFavorites();
  if (list.includes(name)) {
    alert("Already saved.");
    return;
  }
  list.push(name);
  saveFavorites(list);
  input.value = "";
  renderFavorites();
}

function updateFavoritesPageAccess() {
  const loggedIn = isLoggedIn();
  document.getElementById("loginPrompt").hidden = loggedIn;
  document.getElementById("favoritesContent").hidden = !loggedIn;
  const searchBox = document.querySelector(".search-box");
  if (searchBox) searchBox.style.display = loggedIn ? "" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  updateFavoritesPageAccess();
  if (!isLoggedIn()) return;

  document.getElementById("searchBtn").onclick = addFavoriteFromSearch;
  document.getElementById("cityInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") addFavoriteFromSearch();
  });
  document.getElementById("favFilter")?.addEventListener("input", renderFavorites);
  document.getElementById("favSort")?.addEventListener("change", renderFavorites);

  document.getElementById("viewCardsBtn")?.addEventListener("click", () => {
    document.getElementById("viewCardsBtn").classList.add("active");
    document.getElementById("viewTableBtn").classList.remove("active");
    renderFavorites();
  });
  document.getElementById("viewTableBtn")?.addEventListener("click", () => {
    document.getElementById("viewTableBtn").classList.add("active");
    document.getElementById("viewCardsBtn").classList.remove("active");
    renderFavorites();
  });

  wireUnitToggle(renderFavorites);
  renderFavorites();
});
