import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(15000);

const messages = [];
page.on("console", (msg) => messages.push(`[${msg.type()}] ${msg.text().slice(0, 500)}`));
page.on("pageerror", (err) => messages.push(`[pageerror] ${err.message.slice(0, 500)}`));

await page.goto(`${BASE}/auth`, { waitUntil: "load" });
await page.fill("#email", "student@mubas.ac.mw");
await page.fill("#password", "student123");
await page.locator('form button[type="submit"]').click();
await page.waitForURL("**/dashboard");
await page.waitForTimeout(1500);

async function probe(label) {
  const state = await page.evaluate(() => {
    const portal = document.querySelector("nextjs-portal");
    if (!portal) return { present: false };
    const rect = portal.getBoundingClientRect();
    const style = getComputedStyle(portal);
    const shadow = portal.shadowRoot;
    const bodyText = shadow
      ? (shadow.querySelector("body")?.innerText ?? shadow.textContent ?? "")
          .replace(/\s+/g, " ")
          .slice(0, 600)
      : "";
    const errNode = shadow ? shadow.querySelector("[data-nextjs-dialog]") : null;
    return {
      present: true,
      rect: `${Math.round(rect.width)}x${Math.round(rect.height)} @${Math.round(rect.x)},${Math.round(rect.y)}`,
      position: style.position,
      pointerEvents: style.pointerEvents,
      zIndex: style.zIndex,
      hasDialog: Boolean(errNode),
      text: bodyText.slice(0, 300),
    };
  });
  console.log(`\n== ${label}`);
  console.log(JSON.stringify(state, null, 2));
}

await page.getByRole("link", { name: "My room & key card" }).click();
await page.waitForURL("**/dashboard/room");
await page.waitForTimeout(3000);
await probe("room page after link nav");

messages.length = 0;
await page.goto(`${BASE}/dashboard/room`, { waitUntil: "load" });
await page.waitForTimeout(3000);
await probe("room page after full load");
console.log("\nconsole messages:", messages.length);
for (const m of [...new Set(messages)].slice(0, 12)) console.log("  ", m);

await browser.close();
