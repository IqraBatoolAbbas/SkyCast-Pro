function initHoverRevealCards() {
  document.querySelectorAll(".hover-reveal-card:not(.weather-card)").forEach((card) => {
    const extra = card.querySelector(".hover-extra");
    if (!extra) return;
    card.addEventListener("mouseenter", () => {
      extra.hidden = false;
    });
    card.addEventListener("mouseleave", () => {
      extra.hidden = true;
    });
  });
}

function initWeatherGallery() {
  const gallery = document.getElementById("weatherGallery");
  const lightbox = document.getElementById("galleryLightbox");
  if (!gallery || !lightbox) return;

  const imgEl = document.getElementById("lightboxImg");
  const capEl = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");

  const openLightbox = (full, caption) => {
    imgEl.src = full;
    imgEl.alt = caption;
    capEl.textContent = caption;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    imgEl.src = "";
  };

  gallery.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      openLightbox(item.dataset.full, item.dataset.caption);
    });
  });

  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeLightbox();
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initHoverRevealCards();
  initWeatherGallery();
});
