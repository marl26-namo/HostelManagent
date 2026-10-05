import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(15000);

await page.goto(`${BASE}/auth`, { waitUntil: "load" });
await page.fill("#email", "student@mubas.ac.mw");
await page.fill("#password", "student123");
await page.locator('form button[type="submit"]').click();
await page.waitForURL("**/dashboard");
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const out = {};
  const btn = document.querySelector('aside button[type="submit"]');
  if (btn) {
    const r = btn.getBoundingClientRect();
    out.signOutRect = `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const stack = document.elementsFromPoint(cx, cy).slice(0, 5).map((el) => {
      const s = getComputedStyle(el);
      return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} z=${s.zIndex} pos=${s.position}`;
    });
    out.stack = stack;
    const portal = document.querySelector("nextjs-portal");
    out.portalRect = portal
      ? JSON.stringify(portal.getBoundingClientRect())
      : "none";
    if (portal?.shadowRoot) {
      out.shadowNodes = [...portal.shadowRoot.querySelectorAll("*")]
        .map((el) => {
          const r2 = el.getBoundingClientRect();
          if (r2.width === 0 && r2.height === 0) return null;
          const s = getComputedStyle(el);
          return `${el.tagName.toLowerCase()}[${el.getAttribute("class") ?? ""}] ${Math.round(r2.x)},${Math.round(r2.y)} ${Math.round(r2.width)}x${Math.round(r2.height)} z=${s.zIndex} pos=${s.position} pe=${s.pointerEvents}`;
        })
        .filter(Boolean)
        .slice(0, 15);
    }
  }
  return out;
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
