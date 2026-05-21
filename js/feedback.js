const FeedbackStore = { KEY: "skycast_feedback" };

function getFeedbackList() {
  try {
    return JSON.parse(localStorage.getItem(FeedbackStore.KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFeedback(entry) {
  const list = getFeedbackList();
  list.unshift(entry);
  localStorage.setItem(FeedbackStore.KEY, JSON.stringify(list.slice(0, 100)));
}

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

function validateFeedbackForm() {
  const subject = document.getElementById("fbSubject");
  const rating = document.getElementById("fbRating");
  const message = document.getElementById("fbMessage");
  let ok = true;
  if (subject.value.trim().length < 3) {
    showFieldError(subject, "Subject must be at least 3 characters.");
    ok = false;
  } else markValid(subject);
  if (!rating.value) {
    showFieldError(rating, "Please select a rating.");
    ok = false;
  } else markValid(rating);
  if (message.value.trim().length < 10) {
    showFieldError(message, "Message must be at least 10 characters.");
    ok = false;
  } else markValid(message);
  return ok;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function renderFeedbackTable() {
  const tbody = document.getElementById("feedbackTableBody");
  const user = getSession();
  if (!tbody || !user) return;
  const list = getFeedbackList().filter((f) => f.userEmail === user.email);
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">No feedback yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = list
    .map(
      (f) => `
    <tr>
      <td>${escapeHtml(f.subject)}</td>
      <td>${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</td>
      <td>${escapeHtml(f.message)}</td>
      <td>${new Date(f.date).toLocaleDateString()}</td>
    </tr>`
    )
    .join("");
}

function renderFeedbackPage() {
  const loggedIn = isLoggedIn();
  document.getElementById("loginPrompt").hidden = loggedIn;
  document.getElementById("feedbackContent").hidden = !loggedIn;
  if (loggedIn) renderFeedbackTable();
}

document.addEventListener("DOMContentLoaded", () => {
  renderFeedbackPage();

  document.getElementById("feedbackForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = getSession();
    if (!user) {
      window.location.href = "account.html";
      return;
    }
    if (!validateFeedbackForm()) return;

    saveFeedback({
      userEmail: user.email,
      userName: user.name,
      subject: document.getElementById("fbSubject").value.trim(),
      rating: parseInt(document.getElementById("fbRating").value, 10),
      message: document.getElementById("fbMessage").value.trim(),
      date: new Date().toISOString(),
    });

    document.getElementById("feedbackForm").reset();
    document.querySelectorAll("#feedbackForm .valid").forEach((el) => el.classList.remove("valid"));
    document.getElementById("fbSuccess").textContent = "Thank you! Feedback saved.";
    renderFeedbackTable();
  });
});
