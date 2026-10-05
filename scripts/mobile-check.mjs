import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.setDefaultTimeout(15000);

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};

await page.goto(`${BASE}/`, { waitUntil: "load" });
const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
check("no horizontal overflow", overflow.scrollWidth <= overflow.clientWidth + 1, `${overflow.scrollWidth}px wide`);

const heroVisible = await page.getByRole("heading", { level: 1 }).isVisible();
check("hero renders on a 390px screen", heroVisible);

// signed-in mobile shell: bottom tab bar
await page.goto(`${BASE}/auth`, { waitUntil: "load" });
await page.fill("#email", "student@mubas.ac.mw");
await page.fill("#password", "student123");
await page.locator('form button[type="submit"]').click();
await page.waitForURL("**/dashboard");
await page.waitForTimeout(1200);

const tabs = await page.locator('nav[aria-label="Primary"] a').count();
check("bottom tab bar has up to 5 destinations", tabs > 0 && tabs <= 5, `${tabs} tabs`);

const layout = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Primary"]');
  const rect = nav?.getBoundingClientRect();
  const main = document.querySelector("main");
  const mainStyle = main ? getComputedStyle(main) : null;
  return {
    navBottom: rect ? Math.round(rect.bottom) : -1,
    navHeight: rect ? Math.round(rect.height) : -1,
    viewport: window.innerHeight,
    bodyPaddingBottom: mainStyle ? getComputedStyle(document.body).paddingBottom : "",
    scrollWidth: document.documentElement.scrollWidth,
  };
});
check("tab bar is pinned to the bottom of the viewport", Math.abs(layout.navBottom - layout.viewport) <= 2, `nav bottom ${layout.navBottom} vs viewport ${layout.viewport}`);
check("no horizontal overflow after sign-in", layout.scrollWidth <= 390, `${layout.scrollWidth}px`);

await browser.close();
const real = errors.filter((e) => !e.includes("favicon") && !e.includes("React DevTools"));
const failed = results.filter((r) => !r.ok);
if (real.length) console.log("Page errors:", [...new Set(real)].slice(0, 5));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 && real.length === 0 ? 0 : 1);