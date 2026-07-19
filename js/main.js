/* Sonia's Sculpting & Beyond — site behavior */

/* ==== CONFIG — fill these in at launch ==== */
// Square Appointments booking page (from Sonia's Square Dashboard > Appointments > Online Booking)
// SANDBOX (MainStreet AI LLC test account) — swap for Sonia's real booking URL at launch
const SQUARE_BOOKING_URL = "https://book.squareup.com/appointments/e6dteoexwqafsj/location/LEJJDXBH9BJZB";
// n8n webhook endpoints (production URLs from the n8n workflows)
const CONTACT_WEBHOOK = ""; // e.g. "https://<your-n8n>/webhook/sonias-contact"
const REVIEW_WEBHOOK = "";  // e.g. "https://<your-n8n>/webhook/sonias-review"

/* site root (works at domain root and in a subfolder like github.io staging) —
   derived from this script's own URL: <root>/js/main.js */
const SITE_ROOT = new URL(
  "..",
  document.querySelector('script[src$="main.js"]').src
).pathname;

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
/* Every element with [data-booking] goes to the on-site booking page (which
   embeds Square). An element can deep-link a specific service with
   data-booking-service="<service-path>". Falls back to the contact page if
   no booking URL is configured. */
document.querySelectorAll("[data-booking]").forEach((el) => {
  if (SQUARE_BOOKING_URL) {
    const svc = el.getAttribute("data-booking-service");
    el.setAttribute(
      "href",
      SITE_ROOT + "book/" + (svc ? "#" + svc : "")
    );
  } else {
    el.setAttribute("href", SITE_ROOT + "contact/");
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
