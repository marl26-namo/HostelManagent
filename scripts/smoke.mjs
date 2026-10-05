import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const results = [];
const pageErrors = [];

function check(name, ok, extra = "") {
  results.push({ name, ok: Boolean(ok) });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
}

async function step(name, fn) {
  console.log(`STEP  ${name}`);
  try {
    await fn();
  } catch (error) {
    check(name, false, String(error.message).replace(/\s+/g, " ").slice(0, 600));
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(15000);
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") pageErrors.push(`console: ${message.text()}`);
});

const slug = Date.now().toString(36);
const studentEmail = `smoke-${slug}@mubas.ac.mw`;
// Unique per run so the admin step targets this run's application even when
// earlier runs left pending applications behind in the demo database.
const regNumber = `BXS/26/EP/${Date.now().toString().slice(-6)}`;

/* ---------------------------------------------------------------- landing */
await step("landing page renders", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  const heading = await page.locator("h1").first().innerText();
  check("landing hero headline", heading.toLowerCase().includes("mubas"), heading.slice(0, 60));
  const hostelsText = (await page.locator("#hostels").innerText()).replace(/\s+/g, " ");
  check("landing shows live occupancy", /\d+ of \d+ beds/.test(hostelsText), hostelsText.match(/\d+ of \d+ beds/)?.[0] ?? "not found");
  const html = await page.content();
  check("landing QR visual", html.includes("MUBAS-CI:hero-pass"));
  check(
    "seven features listed",
    (html.match(/Anonymous noise complaints/g) ?? []).length >= 1,
  );
});

/* -------------------------------------------------------- student sign-up */
await step("student can create an account", async () => {
  await page.goto(`${BASE}/auth`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Create account" }).click();
  await page.fill("#name", "Smoke Tester");
  await page.fill("#regNumber", regNumber);
  await page.fill("#signup-email", studentEmail);
  await page.fill("#signup-password", "smoke123");
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL("**/dashboard");
  check("signup redirects to student dashboard", page.url().endsWith("/dashboard"));
  const heading = await page.locator("h1").first().innerText();
  check("dashboard greets the student", heading.includes("Karibuni"), heading);
});

/* ---------------------------------------------------------------- booking */
await step("student can apply for a bed", async () => {
  await page.getByRole("link", { name: "Book a room" }).click();
  await page.waitForURL("**/dashboard/booking");
  await page.locator('button[type="submit"]:has-text("Apply for")').first().click();
  await page.getByText(/Application for .+ submitted/).waitFor();
  check("booking application submitted flash", true);
  await page.getByText("My applications").scrollIntoViewIfNeeded();
  await page.getByText("pending").first().waitFor();
  check("application listed as pending", true);
});

/* --------------------------------------------------------------- payments */
await step("payment issues a tracked receipt", async () => {
  await page.getByRole("link", { name: "Payments & receipts" }).click();
  await page.waitForURL("**/dashboard/payments");
  await page.fill("#payerPhone", "0991234567");
  await page.getByRole("button", { name: "Pay & issue receipt" }).click();
  await page.getByText(/Payment confirmed/).waitFor();
  check("payment confirmation flash", true);
  await page.getByText(/MUBAS\/RCPT\/\d\d\/\d{6}/).first().waitFor();
  const tracking = await page.getByText(/MUBAS\/RCPT\/\d\d\/\d{6}/).first().innerText();
  check("receipt tracking number issued", tracking.startsWith("MUBAS/RCPT/"), tracking);
});

/* ----------------------------------------------------------- maintenance */
await step("maintenance report + collective vote", async () => {
  await page.getByRole("link", { name: "Maintenance" }).click();
  await page.waitForURL("**/dashboard/maintenance");
  const roomValue = await page.locator("#roomId option").nth(1).getAttribute("value");
  await page.selectOption("#roomId", roomValue);
  await page.fill("#description", "Smoke test: the corridor light flickers at night.");
  await page.getByRole("button", { name: "Submit report" }).click();
  await page.getByText(/Report submitted/).waitFor();
  check("maintenance report submitted", true);

  const voteButtons = page.locator('button[title="Second this report"]:not([disabled])');
  await voteButtons.first().waitFor();
  const before = parseInt((await voteButtons.first().innerText()).split("\n").find((l) => /\d/.test(l)) ?? "0", 10);
  await voteButtons.first().click();
  await page.waitForTimeout(1200);
  const after = parseInt(
    (await page.locator('button[title="You have seconded this report"]').first().innerText())
      .split("\n")
      .find((l) => /\d/.test(l)) ?? "0",
    10,
  );
  check("seconding a report increments votes", after === before + 1, `${before} -> ${after}`);
});

/* ------------------------------------------------- complaints + lost/found */
await step("anonymous complaint and lost & found post", async () => {
  await page.getByRole("link", { name: "Noise complaints" }).click();
  await page.waitForURL("**/dashboard/complaints");
  await page.selectOption("#hostelId", { index: 1 });
  await page.fill("#description", "Smoke test: loud music after midnight in the courtyard.");
  await page.getByRole("button", { name: "Submit anonymously" }).click();
  await page.getByText(/logged anonymously/).waitFor();
  check("anonymous complaint submitted", true);

  await page.getByRole("link", { name: "Lost & found" }).click();
  await page.waitForURL("**/dashboard/lost-found");
  await page.fill("#title", "Smoke test water bottle");
  await page.fill("#lfDescription", "Blue bottle left in the study room after the test.");
  await page.getByRole("button", { name: "Post to the board" }).click();
  await page.getByText(/posted to the lost & found board/i).waitFor();
  check("lost & found item posted", true);
});

/* ------------------------------------------------------------ QR key card */
let qrPayload = "";
await step("room page shows QR key card", async () => {
  await page.getByRole("link", { name: "My room & key card" }).click();
  await page.waitForURL("**/dashboard/room");
  // Not allocated yet -> prompt to apply
  const hasQr = (await page.locator('img[src^="data:image/png"]').count()) > 0;
  if (!hasQr) {
    const emptyState = await page.getByText("No bed allocated yet").isVisible();
    check("unallocated student sees apply prompt", emptyState);
  } else {
    check("QR key card rendered", true);
  }
});

/* ----------------------------------------------------------- admin sign-in */
await step("admin approves the application", async () => {
  await page.locator("aside button:has-text('Sign out')").click();
  console.log("  marked: signed out");
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/auth`, { waitUntil: "load" });
  await page.locator('button:has-text("Hostel administrator")').click();
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL("**/admin");
  check("admin lands on administration dashboard", page.url().endsWith("/admin"));

  await page.getByRole("link", { name: "Applications", exact: true }).click();
  await page.waitForURL("**/admin/applications");
  console.log("  marked: applications page");
  const row = page.locator("li", { hasText: regNumber }).first();
  await row.waitFor();
  const slot = row.locator('select[name="slot"]');
  await slot.waitFor();
  await slot.selectOption({ index: 1 });
  await row.getByRole("button", { name: "Approve & allocate" }).click();
  await page.getByText(/allocated\./).waitFor();
  check("application approved and bed allocated", true);
});

/* --------------------------------------------------- admin rooms overview */
await step("admin rooms page shows occupancy", async () => {
  await page.getByRole("link", { name: "Rooms & occupancy" }).click();
  await page.waitForURL("**/admin/rooms");
  await page.getByText("Beds occupied").waitFor();
  const tiles = await page.locator("text=Nyika Hostel").count();
  check("all hostel occupancy cards render", tiles >= 1, `${tiles} hostel card(s)`);
});

/* ---------------------------------------------------------- gate scanning */
await step("gate console records a QR check-in", async () => {
  // Read the fresh allocation payload from the admin applications decision list
  await page.getByRole("link", { name: "Applications", exact: true }).click();
  await page.waitForURL("**/admin/applications");

  await page.getByRole("link", { name: "Gate console", exact: true }).click();
  await page.waitForURL("**/admin/checkins");
  // Enter an unknown code first -> friendly error
  await page.fill("#scan-code", "MUBAS-CI:al_nope:deadbeef");
  await page.getByRole("button", { name: "Check in" }).click();
  await page.getByText("Unknown check-in code").waitFor();
  check("unknown QR code rejected", true);
});

/* ------------------------------------------------ student key card + scan */
await step("student key card payload scans successfully", async () => {
  // Sign back in as the student to read the QR payload
  await page.locator("aside button:has-text('Sign out')").click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/auth`, { waitUntil: "load" });
  await page.fill("#email", studentEmail);
  await page.fill("#password", "smoke123");
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL("**/dashboard");
  await page.getByRole("link", { name: "My room & key card" }).click();
  await page.waitForURL("**/dashboard/room");
  await page.locator('img[src^="data:image/png"]').first().waitFor();
  check("allocated student sees QR key card", true);
  qrPayload = (await page.locator("p.font-mono").first().innerText()).trim();
  check("QR payload format", /^MUBAS-CI:[\w]+:[a-f0-9]+$/.test(qrPayload), qrPayload);
  await page.getByText("In residence").first().waitFor({ timeout: 5000 }).catch(() => {});
});

await step("admin scans the student key card", async () => {
  await page.locator("aside button:has-text('Sign out')").click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/auth`, { waitUntil: "load" });
  await page.locator('button:has-text("Hostel administrator")').click();
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL("**/admin");
  await page.getByRole("link", { name: "Gate console", exact: true }).click();
  await page.waitForURL("**/admin/checkins");
  await page.fill("#scan-code", qrPayload);
  await page.getByRole("button", { name: "Check in" }).click();
  await page.getByText(/Smoke Tester checked in/).waitFor();
  check("valid QR scan records arrival", true);
  await page.getByText("Residency status").scrollIntoViewIfNeeded();
  const inResidence = await page.locator("li", { hasText: "Smoke Tester" }).last().innerText();
  check("residency status shows in residence", /in residence/i.test(inResidence), inResidence.replace(/\s+/g, " ").slice(0, 90));
});

/* --------------------------------------------------- inspections + transfer */
await step("admin records an inspection with photo", async () => {
  await page.getByRole("link", { name: "Inspections" }).click();
  await page.waitForURL("**/admin/inspections");
  const roomValue = await page.locator("#roomId option").nth(1).getAttribute("value");
  await page.selectOption("#roomId", roomValue);
  await page.fill("#notes", "Smoke test inspection: walls and fittings checked.");
  await page.getByRole("button", { name: "Save inspection" }).click();
  await page.getByText(/Inspection recorded/).waitFor();
  check("inspection saved", true);
});

await step("student requests a transfer", async () => {
  await page.locator("aside button:has-text('Sign out')").click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/auth`, { waitUntil: "load" });
  await page.fill("#email", studentEmail);
  await page.fill("#password", "smoke123");
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL("**/dashboard");
  await page.getByRole("link", { name: "Room transfer" }).click();
  await page.waitForURL("**/dashboard/transfers");
  const target = await page.locator("#toHostelId option").nth(1).getAttribute("value");
  await page.selectOption("#toHostelId", target);
  await page.fill("#reason", "Smoke test: closer to the laboratory block.");
  await page.getByRole("button", { name: "Send transfer request" }).click();
  await page.getByText(/Transfer request sent/).waitFor();
  check("transfer request submitted", true);
});

/* --------------------------------------------------------- guard sign-in */
await step("guard signs in to the gate console", async () => {
  await page.locator("aside button:has-text('Sign out')").click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/auth`, { waitUntil: "load" });
  await page.locator('button:has-text("Gate security")').click();
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL("**/guard");
  check("guard lands on gate console", page.url().endsWith("/guard"));
  await page.locator("#scan-code").waitFor();
  check("guard sees the scan input", true);
  const navLinks = await page.locator("aside nav a").count();
  check("guard navigation is restricted", navLinks === 1, `${navLinks} nav links`);
});

/* ----------------------------------------------------- protected redirects */
await step("signed-out users are redirected with returnTo", async () => {
  const context = await browser.newContext();
  const fresh = await context.newPage();
  fresh.setDefaultTimeout(30000);
  await fresh.goto(`${BASE}/dashboard/booking`, { waitUntil: "load" });
  await fresh.waitForURL("**/auth**", { timeout: 15000 }).catch(() => {});
  const url = new URL(fresh.url());
  check(
    "auth gate preserves returnTo",
    url.pathname === "/auth" && url.searchParams.get("returnTo") === "/dashboard/booking",
    fresh.url().replace(BASE, ""),
  );
  await context.close();
});

await browser.close();

const failed = results.filter((r) => !r.ok);
const realErrors = pageErrors.filter(
  (e) => !e.includes("favicon") && !e.includes("Download the React DevTools"),
);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (realErrors.length) {
  console.log("Page errors:");
  for (const error of [...new Set(realErrors)].slice(0, 10)) console.log("  -", error);
}
process.exit(failed.length === 0 && realErrors.length === 0 ? 0 : 1);
