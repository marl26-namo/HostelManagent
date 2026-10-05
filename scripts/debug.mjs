import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(15000);

const messages = [];
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    messages.push(`[${msg.type()}] ${msg.text().slice(0, 400)}`);
  }
});
page.on("pageerror", (err) => messages.push(`[pageerror] ${err.message.slice(0, 400)}`));

async function overlayText() {
  return page.evaluate(() => {
    const portal = document.querySelector("nextjs-portal");
    return portal ? portal.shadowRoot?.textContent?.slice(0, 800) ?? "" : "";
  });
}

async function visit(url, label) {
  messages.length = 0;
  await page.goto(`${BASE}${url}`, { waitUntil: "load" }).catch((e) => console.log(label, "goto failed", e.message));
  await page.waitForTimeout(2500);
  const overlay = await overlayText();
  console.log(`\n== ${label} (${url})`);
  console.log(overlay ? `OVERLAY: ${overlay.replace(/\s+/g, " ")}` : "overlay: none");
  for (const m of [...new Set(messages)].slice(0, 6)) console.log("  ", m);
}

// signed-out checks
await visit("/auth", "auth");
await visit("/", "landing");

// sign in as seeded student
await page.goto(`${BASE}/auth`, { waitUntil: "load" });
await page.fill("#email", "student@mubas.ac.mw");
await page.fill("#password", "student123");
await page.locator('form button[type="submit"]').click();
await page.waitForURL("**/dashboard");
await page.waitForTimeout(1500);
console.log("\n== signed in as student");

for (const route of [
  "/dashboard",
  "/dashboard/booking",
  "/dashboard/room",
  "/dashboard/payments",
  "/dashboard/maintenance",
  "/dashboard/transfers",
  "/dashboard/complaints",
  "/dashboard/lost-found",
]) {
  await visit(route, `student ${route}`);
}

await browser.close();
