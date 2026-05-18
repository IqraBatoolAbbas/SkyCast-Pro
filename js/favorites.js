async function renderFavorites() {
  const grid = document.getElementById("favoritesGrid");
  const empty = document.getElementById("emptyFavorites");
  const list = getFavorites();
  const unit = getUnit();

  grid.querySelectorAll(".favorite-card").forEach((el) => el.remove());

  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  for (const city of list) {
    let temp = "—";
    let icon = "";
    let cond = "";
    try {
      const data = await WeatherAPI.fetchForecast(city, 1);
      temp = WeatherAPI.formatTemp(data.current.temp_c, unit);
      icon = "https:" + data.current.condition.icon;
      cond = data.current.condition.text;
    } catch {
      cond = "Could not load";
    }

    const card = document.createElement("article");
    card.className = "favorite-card";
    card.innerHTML = `
      <div class="fav-top">
        <h3>${city}</h3>
        <button type="button" class="fav-remove" data-city="${city}" aria-label="Remove">×</button>
      </div>
      ${icon ? `<img src="${icon}" alt="" width="48">` : ""}
      <p class="fav-temp">${temp}</p>
      <p class="muted">${cond}</p>
      <a href="index.html" class="btn-primary fav-open" data-city="${city}">Open</a>
    `;
    grid.appendChild(card);
  }

  grid.querySelectorAll(".fav-remove").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const city = btn.dataset.city;
      saveFavorites(getFavorites().filter((c) => c !== city));
      renderFavorites();
    };
  });

  grid.querySelectorAll(".fav-open").forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      setLastCity(link.dataset.city);
      window.location.href = "index.html";
    };
  });
}

function addFavoriteFromSearch() {
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchBtn").onclick = addFavoriteFromSearch;
  document.getElementById("cityInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") addFavoriteFromSearch();
  });
  wireUnitToggle(renderFavorites);
  renderFavorites();
});
