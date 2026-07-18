// Static site builder for Sonia's Sculpting & Beyond
// Usage: node build.js
// Reads src/template.html + src/pages.json + src/content/<slug>.html
// Writes finished pages to the repo root (index.html or <slug>/index.html).

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src");
const template = fs.readFileSync(path.join(SRC, "template.html"), "utf8");
const pages = JSON.parse(fs.readFileSync(path.join(SRC, "pages.json"), "utf8"));

for (const page of pages) {
  const content = fs.readFileSync(
    path.join(SRC, "content", page.slug + ".html"),
    "utf8"
  );
  // relative prefix back to the site root, so the site works both at a
  // domain root (custom domain) and in a subfolder (github.io staging)
  const root = page.slug === "index" ? "./" : "../";
  let html = template
    .replaceAll("{{TITLE}}", page.title)
    .replaceAll("{{DESC}}", page.desc)
    .replaceAll("{{CANONICAL}}", page.slug === "index" ? "/" : `/${page.slug}/`)
    .replaceAll("{{CONTENT}}", content)
    .replaceAll("{{ROOT}}", root);

  // mark active nav item
  html = html.replace(
    new RegExp(`data-nav="${page.nav || page.slug}"`),
    `$& class="active"`
  );

  const outDir =
    page.slug === "index" ? __dirname : path.join(__dirname, page.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  console.log("built", page.slug);
}
console.log(`\n${pages.length} pages built.`);
