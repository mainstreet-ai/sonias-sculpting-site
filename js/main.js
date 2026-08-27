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
  "signature-glow-facial": "",
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
  "Sonia's Signature Glow": "signature-glow-facial",
};

// Single-service pages: URL path fragment -> service key, for buttons not inside a
// titled service card. Empty since the single-service pages were retired Aug 2026;
// add an entry here if a new standalone service page is created.
const PATH_TO_KEY = {};

// n8n webhook endpoints (production URLs from the n8n workflows)
const CONTACT_WEBHOOK = "https://lineagestudio.app.n8n.cloud/webhook/931f551c-797b-4be2-81ce-380505712db0/sonias-contact";
// The review form posts directly with a standard HTML form (method="POST" action="...")
// so it never touches fetch() and never hits CORS. The endpoint lives in the form tag in
// src/content/testimonials.html. Recorded here so both halves stay findable:
//   https://lineagestudio.app.n8n.cloud/webhook/sonias-review
// n8n workflow: "Sonia's Sculpting Website Review Form" (Hf2SU4buog8jbMrI).

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
/* Show Square's booking inside the page in a frame, so the visitor stays on Sonia's
   site. The frame src is set to the resolved Square URL (per-service if ?s=<key> is
   present, otherwise the general booking page). A small fallback link and phone
   number sit below in case a visitor's browser blocks the frame. Runs against both
   the deployed page markup and the rebuilt one. */
(function configureBookingPage() {
  const wrap = document.querySelector(".booking-embed-wrap");
  if (!wrap) return;

  const params = new URLSearchParams(location.search);
  const url = bookingUrlFor(params.get("s"));

  // remove any previously injected launch box (idempotent across deploys)
  const oldBox = wrap.querySelector(".booking-launch");
  if (oldBox) oldBox.remove();

  // show the booking frame, creating it if the page does not already have one
  let frame = wrap.querySelector(".booking-embed");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.className = "booking-embed";
    frame.title = "Online booking";
    frame.setAttribute("loading", "eager");
    frame.setAttribute("allow", "payment");
    wrap.insertBefore(frame, wrap.firstChild);
    if (!document.getElementById("booking-embed-style")) {
      const st = document.createElement("style");
      st.id = "booking-embed-style";
      st.textContent =
        ".booking-embed{width:100%;height:min(78vh,900px);border:1px solid var(--line,#e6ddcf);" +
        "background:var(--ivory,#fffdf9);box-shadow:0 12px 32px rgba(19,17,16,.10)}" +
        ".booking-fallback{margin-top:.8rem;font-size:.9rem;color:var(--muted,#6b6257);text-align:center}";
      document.head.appendChild(st);
    }
  }
  frame.style.display = "";
  frame.setAttribute("src", url);

  // fallback line below the frame
  let fb = wrap.querySelector(".booking-fallback");
  if (!fb) {
    fb = document.createElement("p");
    fb.className = "booking-fallback";
    fb.innerHTML =
      'Having trouble with the booking window? ' +
      '<a data-booking-launch target="_blank" rel="noopener" href="#">Open it in a new tab</a> ' +
      'or call <a href="tel:+19042901551">904-290-1551</a>.';
    wrap.appendChild(fb);
  }
  // point any launch/fallback link (including a hardcoded Square link) at the URL
  wrap.querySelectorAll('[data-booking-launch], .booking-fallback a[href*="squareup.com"]').forEach((a) => {
    a.setAttribute("href", url);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });
})();

/* ==== Get Directions link (site-wide, in the footer) ==== */
/* Matches the Get Directions quick action from the old Townsquare popup. Opens
   Google Maps directions to the studio. Injected into the footer so it shows on
   every page and on all devices. */
(function addDirections() {
  const footer = document.querySelector(".site-footer");
  if (!footer || footer.querySelector("[data-directions]")) return;
  const dirUrl =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent("1550 Normandy Village Parkway, Suite 1, Jacksonville, FL 32221");
  // find the paragraph holding the street address
  let addrP = null;
  footer.querySelectorAll("p").forEach((p) => {
    if (/Normandy/i.test(p.textContent)) addrP = p;
  });
  const a = document.createElement("a");
  a.href = dirUrl;
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("data-directions", "");
  a.textContent = "Get Directions";
  a.style.cssText = "display:inline-block;margin-top:.35rem;color:var(--gold,#c9a24b)";
  if (addrP) addrP.insertAdjacentElement("afterend", a);
  else footer.appendChild(a);
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

/* ==== review form (standard HTML POST, no fetch) ==== */
/* Fills the two hidden anti-bot fields the n8n Spam Gate checks, and guards against
   the double-submit that created duplicate leads on the MainStreet AI form.
     ssb_ok  proves JavaScript ran on this page. Must match the token n8n rebuilds.
     ssb_t   milliseconds spent on the page before submitting. Must be >= 4000. */
(function prepareReviewForm() {
  const form = document.getElementById("review-form");
  if (!form) return;

  const loadedAt = Date.now();

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function tokenFor(ms) {
    const d = new Date(ms);
    const stamp = "" + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
    return stamp.split("").reverse().join("") + "-ssb";
  }

  const okField = document.getElementById("ssb_ok");
  const tField = document.getElementById("ssb_t");
  if (okField) okField.value = tokenFor(Date.now());

  const btn = document.getElementById("review-submit");
  let submitted = false;

  form.addEventListener("submit", (e) => {
    if (submitted) {
      e.preventDefault();
      return;
    }
    submitted = true;
    if (okField) okField.value = tokenFor(Date.now());
    if (tField) tField.value = String(Date.now() - loadedAt);
    if (btn) {
      /* Disabling inside the submit handler cancels the native POST in some
         browsers. A zero-delay timer lets the POST leave first. */
      setTimeout(() => {
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
        btn.textContent = "Sending...";
      }, 0);
    }
  });

  /* Back-button navigation serves a frozen form from bfcache; restore the button. */
  window.addEventListener("pageshow", () => {
    submitted = false;
    if (btn) {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.textContent = "Submit Review";
    }
  });
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
/* review-form submits as a standard HTML POST; see prepareReviewForm() above. */
