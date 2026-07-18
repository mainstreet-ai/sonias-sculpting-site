# Sonia's Sculpting & Beyond — Website

Hand-coded static site for soniassculptingandbeyond.com. No frameworks, no monthly platform fees.

## How it works

- `src/template.html` — shared page shell (header, nav, footer, schema markup)
- `src/pages.json` — page list with titles/meta descriptions
- `src/content/<slug>.html` — the unique content of each page
- `build.js` — stitches template + content into finished pages
- `css/style.css`, `js/main.js` — shared assets

**To edit a page:** change its file in `src/content/`, then run:

```
node build.js
```

Commit and push — GitHub Pages serves the result. URL slugs match the old
Townsquare site exactly (`/body-sculpting/`, `/med-spa-resources/`, ...) so
existing Google rankings carry over without redirects.

## Launch checklist

1. **Square (her account, not yours):**
   - Get added as team member in Sonia's Square Dashboard
   - Enable free Square Appointments plan
   - Create services (see service list on /body-sculpting/, /facials/, /body-contour-benefits/, /other/)
   - Add $50 deposit / no-show protection where wanted
   - Copy the online booking URL into `SQUARE_BOOKING_URL` in `js/main.js`
2. **n8n:** create contact + review webhook workflows, paste production URLs
   into `CONTACT_WEBHOOK` / `REVIEW_WEBHOOK` in `js/main.js`
3. **GitHub Pages:** push repo, enable Pages (deploy from branch, root),
   add custom domain `www.soniassculptingandbeyond.com`, enforce HTTPS
4. **DNS:** confirm Sonia owns the domain (may be registered via Townsquare);
   point CNAME to GitHub Pages; add `CNAME` file to repo root
5. **Before cancelling Townsquare:**
   - Export customer contacts + message history from the Engage portal
   - Download payment records (though Square already holds transactions)
   - Revoke Townsquare's API access in Square Dashboard > App integrations
   - Confirm the texting number clients use is her real number
6. **Content rights:** blog article bodies on the old site were written by
   Townsquare — confirm reuse rights or write fresh posts (see
   `src/content/med-spa-resources.html`)
7. **Photos:** replace stock imagery with real photos of the spa when available
8. **Analytics:** add Google Analytics / Microsoft Clarity snippet to
   `src/template.html` before `</head>`, rebuild

## Open items

- Real photography (hero backgrounds are CSS gradients until then)
- Square booking URL + n8n webhook URLs (placeholders in `js/main.js`)
- Class-deposit payment links (Square payment links for $500 / $1,500 deposits)
- Google Ads campaign build (separate project)
