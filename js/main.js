/* Sonia's Sculpting & Beyond — site behavior */

/* ==== CONFIG — fill these in at launch ==== */
// Square Appointments booking page (from Sonia's Square Dashboard > Appointments > Online Booking)
const SQUARE_BOOKING_URL = ""; // e.g. "https://squareup.com/appointments/book/XXXX"
// n8n webhook endpoints (production URLs from the n8n workflows)
const CONTACT_WEBHOOK = ""; // e.g. "https://<your-n8n>/webhook/sonias-contact"
const REVIEW_WEBHOOK = "";  // e.g. "https://<your-n8n>/webhook/sonias-review"

/* ==== mobile nav ==== */
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

/* ==== services dropdown ==== */
document.querySelectorAll(".nav-dropdown").forEach((dd) => {
  const btn = dd.querySelector(".nav-drop-btn");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = dd.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
});
document.addEventListener("click", (e) => {
  document.querySelectorAll(".nav-dropdown.open").forEach((dd) => {
    if (!dd.contains(e.target)) dd.classList.remove("open");
  });
});

/* ==== Book Now buttons ==== */
/* Every element with [data-booking] points to Square once configured;
   until then it falls back to the contact page. */
document.querySelectorAll("[data-booking]").forEach((el) => {
  if (SQUARE_BOOKING_URL) {
    el.setAttribute("href", SQUARE_BOOKING_URL);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  } else {
    el.setAttribute("href", "/contact/");
  }
});

/* ==== promo modal (shown once per visitor per week) ==== */
const promo = document.querySelector(".promo-overlay");
if (promo) {
  const KEY = "ssb-promo-dismissed";
  const last = Number(localStorage.getItem(KEY) || 0);
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - last > WEEK) {
    setTimeout(() => promo.classList.add("show"), 2500);
  }
  const dismiss = () => {
    promo.classList.remove("show");
    localStorage.setItem(KEY, String(Date.now()));
  };
  promo.querySelector(".promo-close").addEventListener("click", dismiss);
  promo.addEventListener("click", (e) => {
    if (e.target === promo) dismiss();
  });
}

/* ==== form submission via n8n ==== */
async function wireForm(formId, webhook) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = form.querySelector(".form-status");
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.company) return; // honeypot filled -> bot, drop silently
    if (!webhook) {
      status.className = "form-status err";
      status.textContent =
        "Form isn't connected yet — please call (904) 290-1551 or email us.";
      return;
    }
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, page: location.pathname, ts: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.className = "form-status ok";
      status.textContent = "Thank you! We received your message and will be in touch soon.";
    } catch {
      status.className = "form-status err";
      status.textContent =
        "Something went wrong sending your message. Please call (904) 290-1551.";
    }
  });
}
wireForm("contact-form", CONTACT_WEBHOOK);
wireForm("review-form", REVIEW_WEBHOOK);
