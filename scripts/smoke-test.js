const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const nodePath = process.execPath;
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 4173;
const debugPort = Number(process.env.DEBUG_PORT || (9300 + Math.floor(Math.random() * 500)));
const profileDir = path.join(process.env.TEMP || root, `haushaltslager-smoke-profile-${debugPort}`);
const screenshotPath = path.join(process.env.TEMP || root, "haushaltslager-smoke.png");

let server;
let chrome;
let chromeErrors = "";

main().catch((error) => {
  console.error(error.message || error);
  cleanup();
  process.exit(1);
});

async function main() {
  if (fs.existsSync(profileDir)) fs.rmSync(profileDir, { recursive: true, force: true });
  fs.mkdirSync(profileDir, { recursive: true });

  server = spawn(nodePath, ["server.js"], { cwd: root, stdio: "ignore" });
  await waitForHttp(`http://127.0.0.1:${port}/index.html`, 8000);

  chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-crash-reporter",
    "--disable-crashpad",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-allow-origins=*",
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${debugPort}`,
    "--window-size=1440,1000",
    `http://127.0.0.1:${port}/index.html`
  ], { stdio: ["ignore", "ignore", "pipe"] });
  chrome.stderr.on("data", (chunk) => {
    chromeErrors += chunk.toString();
  });

  const wsUrl = await waitForPageWebSocket(debugPort, 8000);
  const cdp = await connectCdp(wsUrl);
  const exceptions = [];
  cdp.on("Runtime.exceptionThrown", (event) => exceptions.push(event.exceptionDetails?.text || "Runtime exception"));
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
  await cdp.waitFor("Page.loadEventFired", 8000);
  await delay(1000);

  const smoke = await cdp.evaluate(`(() => {
    const setValue = (selector, value) => {
      const node = document.querySelector(selector);
      if (!node) throw new Error(selector + " fehlt");
      node.value = value;
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    };

    document.querySelector("#barcode").value = "9990001112223";
    setValue("#product", "Smoke Test Reis");
    setValue("#quantity", "3");
    setValue("#unit", "Packung");
    setValue("#location", "Kühlschrank");
    setValue("#price", "2.49");
    setValue("#minStock", "2");
    setValue("#imageUrl", "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23167a54'/%3E%3Ctext x='32' y='38' text-anchor='middle' font-size='20' fill='white'%3ERS%3C/text%3E%3C/svg%3E");
    document.querySelector("#intake-form").requestSubmit();

    const added = document.body.textContent.includes("Smoke Test Reis");
    const row = Array.from(document.querySelectorAll(".item-row"))
      .find((item) => item.textContent.includes("Smoke Test Reis"));
    row?.querySelector("[data-remove-one]")?.click();
    const consumed = row?.textContent.includes("2 Packung") || document.body.textContent.includes("Noch 2 Packung");
    const hasImage = Boolean(row?.querySelector(".product-thumb img"));
    const hasCharts = document.querySelector("#consumption-chart .bar-fill") && document.querySelector("#spending-chart svg");
    const hasAlerts = Number(document.querySelector("#notification-count")?.textContent || "0") >= 1;
    const hasPwa = Boolean(document.querySelector("link[rel='manifest']")) && "serviceWorker" in navigator;

    return {
      title: document.title,
      added,
      consumed,
      hasImage,
      hasCharts: Boolean(hasCharts),
      hasAlerts,
      hasPwa,
      itemCount: document.querySelector("#item-count")?.textContent || ""
    };
  })()`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html` });
  await cdp.waitFor("Page.loadEventFired", 8000);
  await delay(700);
  const mobile = await cdp.evaluate(`(() => {
    const navScrollable = Array.from(document.querySelectorAll(".nav-list, .sidebar-section, .sidebar-footer"))
      .some((node) => node.scrollWidth > node.clientWidth + 1);
    return {
      innerWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      navScrollable
    };
  })()`);

  await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false })
    .then((result) => fs.writeFileSync(screenshotPath, Buffer.from(result.data, "base64")));
  cdp.close();
  cleanup();

  if (exceptions.length) throw new Error(`Browser-Fehler: ${exceptions.join("; ")}`);
  if (!smoke.added || !smoke.consumed || !smoke.hasImage || !smoke.hasCharts || !smoke.hasAlerts || !smoke.hasPwa) {
    throw new Error(`Smoke-Test fehlgeschlagen: ${JSON.stringify(smoke)}`);
  }
  if (mobile.documentWidth > mobile.innerWidth + 1 || mobile.bodyWidth > mobile.innerWidth + 1) {
    throw new Error(`Mobile Overflow: ${JSON.stringify(mobile)}`);
  }

  console.log(JSON.stringify({ ok: true, screenshotPath, ...smoke, mobile }, null, 2));
}

function cleanup() {
  if (chrome && !chrome.killed) chrome.kill("SIGKILL");
  if (server && !server.killed) server.kill("SIGKILL");
}

async function waitForHttp(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      await delay(150);
    }
  }
  throw new Error(`${url} nicht erreichbar`);
}

async function waitForPageWebSocket(debugPort, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (chrome && chrome.exitCode !== null) {
      throw new Error(`Chrome wurde beendet, bevor DevTools bereit war. ${chromeErrors.trim()}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const pages = await response.json();
      const page = pages.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch (error) {
      await delay(150);
    }
  }
  throw new Error("Chrome DevTools nicht erreichbar");
}

function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();

  ws.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      payload.error ? reject(new Error(payload.error.message)) : resolve(payload.result || {});
      return;
    }
    if (payload.method && listeners.has(payload.method)) {
      listeners.get(payload.method).forEach((listener) => listener(payload.params || {}));
    }
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const id = nextId++;
          ws.send(JSON.stringify({ id, method, params }));
          return new Promise((resolveSend, rejectSend) => {
            pending.set(id, { resolve: resolveSend, reject: rejectSend });
          });
        },
        on(method, listener) {
          if (!listeners.has(method)) listeners.set(method, []);
          listeners.get(method).push(listener);
        },
        waitFor(method, timeoutMs) {
          return new Promise((resolveWait, rejectWait) => {
            const timer = setTimeout(() => rejectWait(new Error(`${method} Timeout`)), timeoutMs);
            const listener = (params) => {
              clearTimeout(timer);
              resolveWait(params);
            };
            if (!listeners.has(method)) listeners.set(method, []);
            listeners.get(method).push(listener);
          });
        },
        async evaluate(expression) {
          const result = await this.send("Runtime.evaluate", {
            expression,
            awaitPromise: true,
            returnByValue: true
          });
          if (result.exceptionDetails) {
            throw new Error(result.exceptionDetails.text || "Runtime.evaluate fehlgeschlagen");
          }
          return result.result.value;
        },
        close() {
          ws.close();
        }
      });
    });
    ws.addEventListener("error", () => reject(new Error("CDP WebSocket fehlgeschlagen")));
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
