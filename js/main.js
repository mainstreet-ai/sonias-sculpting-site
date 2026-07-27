/* Sonia's Sculpting & Beyond — site behavior */

/* ==== CONFIG — fill these in at launch ==== */
// General Square Appointments booking page
// (Square Dashboard > Appointments > Online Booking > "Website Embed" gives the URL).
// SANDBOX (MainStreet AI LLC test account) — swap for Sonia's real booking URL at launch.
const SQUARE_BOOKING_URL = "https://book.squareup.com/appointments/e6dteoexwqafsj/location/LEJJDXBH9BJZB";

// Live chat (Bug 3). Create a free account at https://www.tawk.to, then Admin >
// Channels > Chat Widget, and paste the Property ID and Widget ID here. Until real
// IDs are pasted, the widget stays off. It then loads on every page.
const TAWK_PROPERTY_ID = "6a67ab6865781e1d468dc38c";
const TAWK_WIDGET_ID = "1juifb3tn";

// Per-service deep links (Bug 2). Key = service key. Value = that service's own
// Square booking URL (open a single service in Square's booking flow and copy its
// URL). Empty values fall back to the general booking page automatically.
const BOOKING_SERVICES = {
  "lipo-360": "", "sculpt-stomach": "", "sculpt-arms": "", "sculpt-legs": "",
  "bbl": "", "breast-lift": "", "em-sculpt": "",
  "cavitation": "", "radio-frequency": "", "laser-lipo": "", "wood-therapy": "",
  "muscle-stimulation": "", "vacuum-therapy": "", "sauna": "", "vibration": "",
  "teen-facial": "", "basic-facial": "", "rejuvenation-facial": "",
  "microdermabrasion": "", "hydrodermabrasion": "", "skin-tightening-facial": "",
  "weight-loss-program": "", "iv-hydration": "", "makeup-application": "",
  "eyelash-extensions": "", "pedicure": "", "nail-services": "",
  "laser-hair-removal": "", "hair-restoration": "", "teeth-whitening": "",
  "vaginal-rejuvenation": "",
};

// Service-card heading text -> service key (Bug 2 runtime mapping, so per-service
// booking works without editing the built pages).
const HEADING_TO_KEY = {
  "Lipo 360": "lipo-360", "Stomach": "sculpt-stomach", "Arms": "sculpt-arms",
  "Legs": "sculpt-legs", "Non-Invasive Butt Lift (BBL)": "bbl",
  "Non-Invasive Breast Lift / Enhancement": "breast-lift", "EM-Sculpt": "em-sculpt",
  "Cavitation": "cavitation", "Radio Frequency": "radio-frequency",
  "Laser Lipo": "laser-lipo", "Wood Therapy": "wood-therapy",
  "Muscle Stimulation": "muscle-stimulation", "Vacuum Therapy": "vacuum-therapy",
  "Sauna": "sauna", "Vibration": "vibration",
  "Teen Facial": "teen-facial", "Basic Facial": "basic-facial",
  "Rejuvenation Facial": "rejuvenation-facial",
  "Microdermabrasion Facial": "microdermabrasion",
  "Hydrodermabrasion Facial": "hydrodermabrasion",
  "Skin Tightening Facial": "skin-tightening-facial",
  "Laser Hair Removal": "laser-hair-removal", "Hair Restore": "hair-restoration",
  "Teeth Whitening": "teeth-whitening", "Vaginal Rejuvenation": "vaginal-rejuvenation",
};

// Single-service pages: URL path fragment -> service key, for buttons not inside a
// titled service card.
const PATH_TO_KEY = {
  "eyelash-extensions": "eyelash-extensions",
  "iv-hydration-services": "iv-hydration",
  "nail-services": "nail-services",
  "pedicure-services": "pedicure",
  "professional-makeup": "makeup-application",
  "weight-loss-services": "weight-loss-program",
};

// n8n webhook endpoints (production URLs from the n8n workflows)
const CONTACT_WEBHOOK = ""; // e.g. "https://<your-n8n>/webhook/sonias-contact"
const REVIEW_WEBHOOK = "";  // e.g. "https://<your-n8n>/webhook/sonias-review"

/* site root (works at domain root and in a subfolder like github.io staging) */
const SITE_ROOT = new URL(
  "..",
  document.querySelector('script[src$="main.js"]').src
).pathname;

function bookingUrlFor(serviceKey) {
  if (serviceKey && BOOKING_SERVICES[serviceKey]) return BOOKING_SERVICES[serviceKey];
  return SQUARE_BOOKING_URL;
}

/* work out the service key for a Book Now button: explicit attribute, else the
   service card heading it sits in, else the page path. */
function serviceKeyForButton(el) {
  const explicit = el.getAttribute("data-booking-service");
  if (explicit) return explicit;
  const card = el.closest(".card");
  if (card) {
    const h = card.querySelector("h3");
    if (h) {
      const key = HEADING_TO_KEY[h.textContent.trim()];
      if (key) return key;
    }
  }
  for (const frag in PATH_TO_KEY) {
    if (location.pathname.indexOf(frag) !== -1) return PATH_TO_KEY[frag];
  }
  return "";
}

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

/* ==== Book Now buttons (Bug 2) ==== */
/* Every [data-booking] goes to the on-site /book/ page so the visitor stays on
   Sonia's site, carrying its service as ?s=<key> so the booking page can open that
   service. */
document.querySelectorAll("[data-booking]").forEach((el) => {
  if (SQUARE_BOOKING_URL) {
    const svc = serviceKeyForButton(el);
    el.setAttribute("href", SITE_ROOT + "book/" + (svc ? "?s=" + encodeURIComponent(svc) : ""));
  } else {
    el.setAttribute("href", SITE_ROOT + "contact/");
  }
});

/* ==== booking page (Bug 1) ==== */
/* Square blocks its hosted booking site from loading in an iframe on other domains
   (X-Frame-Options), so the old raw iframe showed blank. Replace the booking area
   with a clear launch button plus phone fallback, wired to the right Square URL
   (per-service if ?s=<key> is present). This runs against the deployed page markup
   as well as the rebuilt one, so it works either way. */
(function configureBookingPage() {
  const wrap = document.querySelector(".booking-embed-wrap");
  if (!wrap) return;

  const params = new URLSearchParams(location.search);
  const url = bookingUrlFor(params.get("s"));

  // hide any blank Square iframe
  wrap.querySelectorAll(".booking-embed").forEach((f) => { f.style.display = "none"; });

  // reuse an existing launch button if the rebuilt page has one, else build it
  let launch = wrap.querySelector("[data-booking-launch]");
  if (!launch) {
    const box = document.createElement("div");
    box.className = "booking-launch";
    box.innerHTML =
      '<p>Ready to book?</p>' +
      '<a class="btn btn-gold" data-booking-launch href="#">Open Booking</a>' +
      '<p class="booking-fallback">Prefer to talk to us? Call ' +
      '<a href="tel:+19042901551">904-290-1551</a>. Same-day appointments are often available.</p>';
    wrap.insertBefore(box, wrap.firstChild);
    launch = box.querySelector("[data-booking-launch]");

    // minimal styles so the injected block looks right on the deployed page
    if (!document.getElementById("booking-launch-style")) {
      const st = document.createElement("style");
      st.id = "booking-launch-style";
      st.textContent =
        ".booking-launch{text-align:center;padding:clamp(1.5rem,5vw,3rem) 1.5rem;" +
        "border:1px solid var(--line,#e6ddcf);background:var(--ivory,#fffdf9);" +
        "box-shadow:0 12px 32px rgba(19,17,16,.10)}" +
        ".booking-launch p{margin:0 0 1rem}.booking-launch .btn{display:inline-block}" +
        ".booking-launch .booking-fallback{margin-top:1rem;font-size:.9rem;color:var(--muted,#6b6257)}";
      document.head.appendChild(st);
    }
  }
  launch.setAttribute("href", url);
  launch.setAttribute("target", "_blank");
  launch.setAttribute("rel", "noopener");
})();

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

/* ==== live chat widget, site-wide (Bug 3) ==== */
/* Loads Tawk.to on every page. Stays off until real IDs are set above. Skips if a
   Tawk script is already present (for example if also added to the template). */
(function loadChat() {
  if (TAWK_PROPERTY_ID === "TAWK_PROPERTY_ID" || TAWK_WIDGET_ID === "TAWK_WIDGET_ID") return;
  if (document.querySelector('script[src*="embed.tawk.to"]')) return;
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_LoadStart = new Date();
  const s1 = document.createElement("script");
  const s0 = document.getElementsByTagName("script")[0];
  s1.async = true;
  s1.src = "https://embed.tawk.to/" + TAWK_PROPERTY_ID + "/" + TAWK_WIDGET_ID;
  s1.charset = "UTF-8";
  s1.setAttribute("crossorigin", "*");
  s0.parentNode.insertBefore(s1, s0);
})();

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
