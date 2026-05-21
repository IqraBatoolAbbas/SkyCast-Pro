const AuthStore = {
  USERS: "skycast_users",
  SESSION: "skycast_session",
};

function hashPassword(pw) {
  return btoa(unescape(encodeURIComponent(pw + "_skycast_salt")));
}

function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(AuthStore.USERS) || "[]");
    if (!users.length) {
      const demo = {
        name: "Demo User",
        email: "demo@skycast.com",
        password: hashPassword("demo123"),
      };
      localStorage.setItem(AuthStore.USERS, JSON.stringify([demo]));
      return [demo];
    }
    return users;
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(AuthStore.USERS, JSON.stringify(users));
}

function getSession() {
  const email = sessionStorage.getItem(AuthStore.SESSION);
  if (!email) return null;
  return getUsers().find((u) => u.email === email) || null;
}

function setSession(email) {
  sessionStorage.setItem(AuthStore.SESSION, email);
}

function clearSession() {
  sessionStorage.removeItem(AuthStore.SESSION);
}

function registerUser({ name, email, password }) {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, message: "This email is already registered." };
  }
  users.push({ name, email: email.toLowerCase(), password: hashPassword(password) });
  saveUsers(users);
  setSession(email.toLowerCase());
  return { ok: true, message: "Account created. You are now logged in." };
}

function loginUser(email, password) {
  const user = getUsers().find(
    (u) => u.email === email.toLowerCase() && u.password === hashPassword(password)
  );
  if (!user) return { ok: false, message: "Invalid email or password." };
  setSession(user.email);
  return { ok: true, user };
}

function logoutUser() {
  clearSession();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
