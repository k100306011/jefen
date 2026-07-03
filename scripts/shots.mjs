import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE || "http://localhost:3005";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });

console.log("launching chrome...");
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 120000,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--hide-scrollbars",
    "--disable-gpu",
  ],
});
console.log("launched.");
const page = await browser.newPage();

async function shot(name, url, { w = 1440, h = 900, mobile = false } = {}) {
  console.log("goto", url, `${w}x${h}`);
  await page.setViewport({
    width: w,
    height: h,
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
  });
  await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log("  saved", name);
}

await shot("landing-desktop", "/", { w: 1440, h: 900 });
await shot("landing-mobile", "/", { w: 390, h: 844, mobile: true });
await shot("signin-mobile", "/auth/signin", { w: 390, h: 844, mobile: true });

console.log("logging in...");
await page.goto(BASE + "/auth/signin", { waitUntil: "domcontentloaded" });
const status = await page.evaluate(async () => {
  const csrf = await fetch("/api/auth/csrf").then((r) => r.json());
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email: "demo@jifen.app",
    callbackUrl: "/dashboard",
  });
  const res = await fetch("/api/auth/callback/dev", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual",
  });
  return res.status;
});
console.log("login status:", status);

await shot("dashboard-mobile", "/dashboard", { w: 390, h: 844, mobile: true });
await shot("dashboard-desktop", "/dashboard", { w: 1440, h: 900 });
await shot("results-mobile", "/results", { w: 390, h: 844, mobile: true });
await shot("results-desktop", "/results", { w: 1440, h: 900 });
await shot("rate-mobile", "/rate", { w: 390, h: 844, mobile: true });
await shot("upload-mobile", "/upload", { w: 390, h: 844, mobile: true });

await browser.close();
console.log("DONE");
