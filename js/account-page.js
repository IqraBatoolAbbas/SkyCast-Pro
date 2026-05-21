function showFieldError(input, message) {
  input.classList.add("invalid");
  input.classList.remove("valid");
  const err = input.parentElement.querySelector(".field-error");
  if (err) err.textContent = message;
}

function markValid(input) {
  input.classList.remove("invalid");
  input.classList.add("valid");
  const err = input.parentElement.querySelector(".field-error");
  if (err) err.textContent = "";
}

function validateLoginForm() {
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");
  let ok = true;
  if (!validateEmail(email.value.trim())) {
    showFieldError(email, "Enter a valid email.");
    ok = false;
  } else markValid(email);
  if (password.value.length < 6) {
    showFieldError(password, "Password must be at least 6 characters.");
    ok = false;
  } else markValid(password);
  return ok;
}

function validateRegisterForm() {
  const name = document.getElementById("regName");
  const email = document.getElementById("regEmail");
  const password = document.getElementById("regPassword");
  const confirm = document.getElementById("regConfirm");
  let ok = true;
  if (name.value.trim().length < 2) {
    showFieldError(name, "Name must be at least 2 characters.");
    ok = false;
  } else markValid(name);
  if (!validateEmail(email.value.trim())) {
    showFieldError(email, "Enter a valid email.");
    ok = false;
  } else markValid(email);
  if (password.value.length < 6) {
    showFieldError(password, "Password must be at least 6 characters.");
    ok = false;
  } else markValid(password);
  if (confirm.value !== password.value) {
    showFieldError(confirm, "Passwords do not match.");
    ok = false;
  } else markValid(confirm);
  return ok;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function renderUserFavorites() {
  const listEl = document.getElementById("userFavList");
  const emptyEl = document.getElementById("userFavEmpty");
  if (!listEl) return;
  const cities = getFavorites();
  listEl.innerHTML = "";
  if (!cities.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  cities.forEach((city) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(city)}</span>
      <button type="button" class="btn-secondary btn-sm fav-remove-dash" data-city="${escapeHtml(city)}">Remove</button>
      <a href="index.html" class="btn-primary btn-sm fav-open-dash" data-city="${escapeHtml(city)}">Open</a>
    `;
    listEl.appendChild(li);
  });
  listEl.querySelectorAll(".fav-remove-dash").forEach((btn) => {
    btn.onclick = () => {
      saveFavorites(getFavorites().filter((c) => c !== btn.dataset.city));
      renderUserFavorites();
    };
  });
  listEl.querySelectorAll(".fav-open-dash").forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      setLastCity(link.dataset.city);
      window.location.href = "index.html";
    };
  });
}

function renderAccountUI() {
  const user = getSession();
  document.getElementById("authSection").hidden = !!user;
  document.getElementById("loggedInSection").hidden = !user;
  if (user) {
    document.getElementById("userGreeting").textContent = `Welcome, ${user.name}`;
    renderUserFavorites();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("tab") === "register") {
    document.getElementById("registerSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderAccountUI();

  document.getElementById("loginForm").onsubmit = (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    const res = loginUser(
      document.getElementById("loginEmail").value.trim(),
      document.getElementById("loginPassword").value
    );
    const msg = document.getElementById("loginMessage");
    msg.className = res.ok ? "form-message success" : "form-message error";
    msg.textContent = res.ok ? "Login successful!" : res.message;
    if (res.ok) renderAccountUI();
  };

  document.getElementById("registerForm").onsubmit = (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;
    const res = registerUser({
      name: document.getElementById("regName").value.trim(),
      email: document.getElementById("regEmail").value.trim(),
      password: document.getElementById("regPassword").value,
    });
    const msg = document.getElementById("registerMessage");
    msg.className = res.ok ? "form-message success" : "form-message error";
    msg.textContent = res.message;
    if (res.ok) renderAccountUI();
  };

  document.getElementById("logoutBtn").onclick = () => {
    logoutUser();
    document.getElementById("loginMessage").textContent = "";
    document.getElementById("registerMessage").textContent = "";
    renderAccountUI();
  };
});


const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

showRegister.addEventListener("click", (e) => {
  e.preventDefault();

  loginSection.hidden = true;
  registerSection.hidden = false;
});

showLogin.addEventListener("click", (e) => {
  e.preventDefault();

  registerSection.hidden = true;
  loginSection.hidden = false;
});