const STORAGE_KEY = "haushaltslager-state-v1";
const SYNC_STORAGE_KEY = "haushaltslager-sync-session-v1";
const SYNC_META_STORAGE_KEY = "haushaltslager-sync-meta-v1";
const PRODUCT_FIELDS = [
  "code",
  "product_name",
  "product_name_de",
  "generic_name",
  "brands",
  "quantity",
  "stores",
  "image_url",
  "image_front_url"
].join(",");
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

const icons = {
  archive: '<svg viewBox="0 0 24 24"><path d="M3 7h18"/><path d="M5 7v12h14V7"/><path d="M8 7V4h8v3"/><path d="M9 12h6"/></svg>',
  barcode: '<svg viewBox="0 0 24 24"><path d="M4 5v14"/><path d="M8 5v14"/><path d="M11 5v14"/><path d="M15 5v14"/><path d="M20 5v14"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M14.5 5 13 3H8L6.5 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  cart: '<svg viewBox="0 0 24 24"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>',
  cloud: '<svg viewBox="0 0 24 24"><path d="M17.5 19H8a5 5 0 1 1 1.2-9.85A6.5 6.5 0 0 1 21 13.5 3.5 3.5 0 0 1 17.5 19Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  filter: '<svg viewBox="0 0 24 24"><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>',
  "minus-circle": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-15.5 6.3"/><path d="M3 12A9 9 0 0 1 18.5 5.7"/><path d="M18 2v4h4"/><path d="M6 22v-4H2"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>',
  tag: '<svg viewBox="0 0 24 24"><path d="M20 10 12 2H4v8l8 8 8-8Z"/><path d="M7.5 6.5h.01"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
};

let state = loadState();
let selectedYear = String(new Date().getFullYear());
let activeMetric = "quantity";
let lowOnly = false;
let searchTerm = "";
let scannerStream = null;
let scannerTimer = null;
let lookupController = null;
let deferredInstallPrompt = null;
let remoteSaveTimer = null;
let syncState = createSyncState();
let syncMeta = loadSyncMeta();

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  installIcons();
  bindEvents();
  registerServiceWorker();
  renderAll();
  initSync();
});

function cacheElements() {
  Object.assign(els, {
    barcode: document.querySelector("#barcode"),
    product: document.querySelector("#product"),
    quantity: document.querySelector("#quantity"),
    unit: document.querySelector("#unit"),
    location: document.querySelector("#location"),
    expires: document.querySelector("#expires"),
    price: document.querySelector("#price"),
    minStock: document.querySelector("#minStock"),
    imageUrl: document.querySelector("#imageUrl"),
    imageFile: document.querySelector("#imageFile"),
    imagePreview: document.querySelector("#product-image-preview"),
    lookupStatus: document.querySelector("#lookup-status"),
    intakeForm: document.querySelector("#intake-form"),
    inventoryList: document.querySelector("#inventory-list"),
    itemCount: document.querySelector("#item-count"),
    groupBy: document.querySelector("#group-by"),
    search: document.querySelector("#search-input"),
    lowOnlyLabel: document.querySelector("#low-only-label"),
    notifications: document.querySelector("#notifications"),
    notificationCount: document.querySelector("#notification-count"),
    priceAlerts: document.querySelector("#price-alerts"),
    priceAlertCount: document.querySelector("#price-alert-count"),
    consumptionChart: document.querySelector("#consumption-chart"),
    spendingChart: document.querySelector("#spending-chart"),
    consumptionSummary: document.querySelector("#consumption-summary"),
    spendingSummary: document.querySelector("#spending-summary"),
    yearSelect: document.querySelector("#year-select"),
    summaryList: document.querySelector("#summary-list"),
    summaryYear: document.querySelector("#summary-year"),
    consumeDialog: document.querySelector("#consume-dialog"),
    consumeForm: document.querySelector("#consume-form"),
    consumeItem: document.querySelector("#consume-item"),
    consumeQuantity: document.querySelector("#consume-quantity"),
    consumeNote: document.querySelector("#consume-note"),
    scannerDialog: document.querySelector("#scanner-dialog"),
    scannerVideo: document.querySelector("#scanner-video"),
    scannerStatus: document.querySelector("#scanner-status"),
    locationForm: document.querySelector("#location-form"),
    locationName: document.querySelector("#location-name"),
    locationList: document.querySelector("#location-list"),
    shoppingItems: document.querySelector("#shopping-items"),
    importFile: document.querySelector("#import-file"),
    installAppButton: document.querySelector("#install-app-button"),
    syncForm: document.querySelector("#sync-form"),
    syncEmail: document.querySelector("#sync-email"),
    syncPassword: document.querySelector("#sync-password"),
    syncStatusBadge: document.querySelector("#sync-status-badge"),
    syncMessage: document.querySelector("#sync-message"),
    syncAccount: document.querySelector("#sync-account"),
    syncUser: document.querySelector("#sync-user"),
    syncHousehold: document.querySelector("#sync-household"),
    syncLast: document.querySelector("#sync-last"),
    toastRegion: document.querySelector("#toast-region")
  });
}

function installIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((node) => {
    const name = node.dataset.icon;
    if (icons[name]) node.innerHTML = icons[name];
  });
}

function bindEvents() {
  els.intakeForm.addEventListener("submit", handleIntakeSubmit);
  els.intakeForm.addEventListener("reset", () => setTimeout(() => {
    els.quantity.value = "1";
    els.imageFile.value = "";
    els.lookupStatus.textContent = "Noch kein Barcode abgefragt.";
    updateImagePreview("");
  }, 0));
  els.barcode.addEventListener("change", lookupBarcode);
  els.barcode.addEventListener("input", debounce(lookupBarcode, 300));
  els.product.addEventListener("input", () => {
    if (!els.imageUrl.value.trim()) updateImagePreview("");
  });
  els.imageUrl.addEventListener("input", () => updateImagePreview(els.imageUrl.value.trim()));
  els.imageFile.addEventListener("change", handleImageFileChange);
  els.groupBy.addEventListener("change", renderInventory);
  els.search.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderInventory();
  });
  els.yearSelect.addEventListener("change", (event) => {
    selectedYear = event.target.value;
    renderCharts();
    renderSummary();
  });
  els.consumeForm.addEventListener("submit", handleConsumeSubmit);
  els.locationForm.addEventListener("submit", handleLocationSubmit);
  els.importFile.addEventListener("change", handleImport);
  els.syncForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    signInSync();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      els.search.focus();
    }
    if (event.key === "Escape") {
      stopScanner();
    }
  });

  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-view]");
    if (nav) {
      focusView(nav.dataset.view);
      return;
    }

    const scrollTarget = event.target.closest("[data-scroll]");
    if (scrollTarget) {
      document.querySelector(`#${scrollTarget.dataset.scroll}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const removeOne = event.target.closest("[data-remove-one]");
    if (removeOne) {
      const item = getItem(removeOne.dataset.removeOne);
      consumeItem(item?.id, Math.min(1, item?.quantity || 0), "Schnellentnahme");
      return;
    }

    const consumeButton = event.target.closest("[data-consume-id]");
    if (consumeButton) {
      openConsumeDialog(consumeButton.dataset.consumeId);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-id]");
    if (deleteButton) {
      deleteItem(deleteButton.dataset.deleteId);
      return;
    }

    const removeLocation = event.target.closest("[data-remove-location]");
    if (removeLocation) {
      removeLocationByName(removeLocation.dataset.removeLocation);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      handleAction(actionButton.dataset.action);
    }
  });

  document.querySelectorAll("[data-metric]").forEach((button) => {
    button.addEventListener("click", () => {
      activeMetric = button.dataset.metric;
      document.querySelectorAll("[data-metric]").forEach((node) => node.classList.toggle("is-active", node === button));
      renderCharts();
    });
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installAppButton?.classList.remove("is-hidden");
  });
}

function handleAction(action) {
  switch (action) {
    case "lookup-barcode":
      lookupBarcode();
      break;
    case "toggle-low-only":
      lowOnly = !lowOnly;
      els.lowOnlyLabel.textContent = lowOnly ? "Alle anzeigen" : "Filter";
      renderInventory();
      break;
    case "open-consume":
      openConsumeDialog();
      break;
    case "close-consume":
      closeDialog(els.consumeDialog);
      break;
    case "start-scan":
      startScanner();
      break;
    case "close-scan":
      stopScanner();
      break;
    case "request-notifications":
      requestNotifications();
      break;
    case "install-pwa":
      installPwa();
      break;
    case "export":
      exportData();
      break;
    case "copy-shopping":
      copyShoppingList();
      break;
    case "sync-sign-in":
      signInSync();
      break;
    case "sync-sign-up":
      signUpSync();
      break;
    case "sync-sign-out":
      signOutSync();
      break;
    case "sync-now":
      syncNow();
      break;
    case "reset-demo":
      resetDemoData();
      break;
    default:
      break;
  }
}

function handleIntakeSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const quantity = parseAmount(form.get("quantity"));
  const price = parseAmount(form.get("price"));
  const product = String(form.get("product") || "").trim();
  const barcode = String(form.get("barcode") || "").trim();
  const location = String(form.get("location") || "").trim();
  const unit = String(form.get("unit") || "Stück").trim();
  const minStock = parseAmount(form.get("minStock"));
  const expires = String(form.get("expires") || "").trim();
  const imageUrl = String(form.get("imageUrl") || "").trim();
  const catalogItem = barcode ? state.catalog[barcode] : null;
  const dataSource = catalogItem?.source || (imageUrl ? "Manuell" : "Lokal");

  if (!product || !location || quantity <= 0) {
    toast("Eingabe prüfen", "Produkt, Ort und Menge werden benötigt.", "danger");
    return;
  }

  const existing = state.items.find((item) => {
    return normalize(item.barcode) === normalize(barcode)
      && normalize(item.product) === normalize(product)
      && item.location === location
      && item.unit === unit
      && (item.expires || "") === expires;
  });

  if (existing) {
    existing.quantity = roundAmount(existing.quantity + quantity);
    existing.price = price || existing.price || 0;
    existing.minStock = Number.isFinite(minStock) ? minStock : existing.minStock;
    existing.imageUrl = imageUrl || existing.imageUrl || "";
    existing.dataSource = dataSource;
    existing.updatedAt = nowIso();
  } else {
    state.items.push({
      id: uid(),
      barcode,
      product,
      quantity,
      unit,
      location,
      expires,
      price,
      minStock: Number.isFinite(minStock) ? minStock : 1,
      imageUrl,
      dataSource,
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
  }

  rememberCatalog({ barcode, product, unit, price, minStock, imageUrl, source: dataSource });
  addMovement("in", { barcode, product, quantity, unit, location, price, note: "Einkauf" });
  persist();
  renderAll();
  event.currentTarget.reset();
  els.quantity.value = "1";
  els.minStock.value = "1";
  toast("Einkauf erfasst", `${product} liegt jetzt in ${location}.`, "success");
}

function handleConsumeSubmit(event) {
  event.preventDefault();
  const id = els.consumeItem.value;
  const quantity = parseAmount(els.consumeQuantity.value);
  if (consumeItem(id, quantity, els.consumeNote.value.trim())) {
    closeDialog(els.consumeDialog);
    els.consumeNote.value = "";
  }
}

function handleLocationSubmit(event) {
  event.preventDefault();
  const name = els.locationName.value.trim();
  if (!name) return;
  if (state.locations.some((location) => normalize(location) === normalize(name))) {
    toast("Ort existiert schon", `${name} ist bereits angelegt.`, "warn");
    return;
  }
  state.locations.push(name);
  state.locations.sort((a, b) => a.localeCompare(b, "de"));
  els.locationName.value = "";
  persist();
  renderAll();
  toast("Ort hinzugefügt", `${name} kann jetzt als Lagerort genutzt werden.`);
}

function consumeItem(id, quantity, note = "") {
  const item = getItem(id);
  if (!item || quantity <= 0) {
    toast("Entnahme nicht möglich", "Bitte wähle einen Artikel mit verfügbarem Bestand.", "danger");
    return false;
  }
  if (item.quantity <= 0) {
    toast("Bestand leer", `${item.product} ist in ${item.location} bereits leer.`, "warn");
    return false;
  }
  if (quantity > item.quantity) {
    toast("Menge zu hoch", `Es sind nur ${formatQuantity(item.quantity)} ${item.unit} vorhanden.`, "danger");
    return false;
  }

  item.quantity = roundAmount(item.quantity - quantity);
  item.updatedAt = nowIso();
  addMovement("out", {
    barcode: item.barcode,
    product: item.product,
    quantity,
    unit: item.unit,
    location: item.location,
    price: item.price,
    note: note || "Entnahme"
  });

  persist();
  renderAll();

  const remaining = `${formatQuantity(item.quantity)} ${item.unit}`;
  const message = item.quantity > 0
    ? `Noch ${remaining} ${item.product} in ${item.location}.`
    : `${item.product} ist in ${item.location} leer.`;
  const severity = item.quantity <= item.minStock ? "warn" : "success";
  toast("Verbrauch gebucht", message, severity);

  if (item.quantity <= item.minStock) {
    notify("Mindestbestand erreicht", `${item.product}: ${remaining} in ${item.location}.`);
  }
  return true;
}

function deleteItem(id) {
  const item = getItem(id);
  if (!item) return;
  if (!window.confirm(`${item.product} aus dem Lager löschen? Verbrauchsdaten bleiben erhalten.`)) return;
  state.items = state.items.filter((entry) => entry.id !== id);
  persist();
  renderAll();
  toast("Artikel gelöscht", `${item.product} wurde aus dem Lager entfernt.`);
}

function removeLocationByName(name) {
  const inUse = state.items.some((item) => item.location === name && item.quantity > 0);
  if (inUse) {
    toast("Ort wird genutzt", "Leere oder verschiebe zuerst alle Artikel an diesem Ort.", "warn");
    return;
  }
  state.locations = state.locations.filter((location) => location !== name);
  persist();
  renderAll();
  toast("Ort entfernt", `${name} wurde gelöscht.`);
}

async function lookupBarcode() {
  const code = els.barcode.value.trim();
  if (!code) return;
  const catalogItem = state.catalog[code] || state.items.find((item) => item.barcode === code);
  if (catalogItem) {
    applyProductLookup(catalogItem, "Lokaler Katalog");
    return;
  }

  if (code.length < 6) return;
  if (lookupController) lookupController.abort();
  lookupController = new AbortController();
  els.lookupStatus.textContent = "Suche Produktdaten ...";

  try {
    const result = await fetchProductByBarcode(code, lookupController.signal);
    if (!result?.found || !result.product) {
      els.lookupStatus.textContent = "Nicht gefunden. Du kannst das Produkt manuell anlegen.";
      toast("Barcode unbekannt", "Kein Treffer in Open Food Facts. Manuelle Eingabe bleibt möglich.", "warn");
      return;
    }
    rememberCatalog({
      barcode: code,
      product: result.product.product,
      unit: result.product.unit || "Stück",
      price: 0,
      minStock: 1,
      imageUrl: result.product.imageUrl || "",
      source: result.product.source || "Open Food Facts",
      brands: result.product.brands || "",
      stores: result.product.stores || "",
      quantityLabel: result.product.quantityLabel || ""
    });
    applyProductLookup(state.catalog[code], result.product.source || "Open Food Facts");
    toast("Produktdaten gefunden", `${result.product.product} wurde übernommen.`);
  } catch (error) {
    if (error.name === "AbortError") return;
    els.lookupStatus.textContent = "Online-Lookup nicht erreichbar. Lokale Eingabe möglich.";
  }
}

function applyProductLookup(catalogItem, sourceLabel) {
  if (!catalogItem) return;

  if (!els.product.value.trim()) els.product.value = catalogItem.product || "";
  if (catalogItem.unit) els.unit.value = catalogItem.unit;
  if (!els.price.value && catalogItem.price) els.price.value = catalogItem.price;
  if (catalogItem.minStock != null) els.minStock.value = catalogItem.minStock;
  if (catalogItem.imageUrl && !els.imageUrl.value.trim()) {
    els.imageUrl.value = catalogItem.imageUrl;
    updateImagePreview(catalogItem.imageUrl);
  } else if (!els.imageUrl.value.trim()) {
    updateImagePreview("");
  }
  els.lookupStatus.textContent = `${sourceLabel}${catalogItem.brands ? ` · ${catalogItem.brands}` : ""}${catalogItem.quantityLabel ? ` · ${catalogItem.quantityLabel}` : ""}`;
}

async function fetchProductByBarcode(code, signal) {
  const localResponse = await fetch(`/api/product/${encodeURIComponent(code)}`, { signal });
  if (localResponse.ok) return localResponse.json();
  if (localResponse.status !== 404 && localResponse.status !== 503) {
    throw new Error("Lokaler Produktdienst nicht verfügbar");
  }

  const directUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${encodeURIComponent(PRODUCT_FIELDS)}`;
  const directResponse = await fetch(directUrl, { signal });
  if (!directResponse.ok) throw new Error("Open Food Facts nicht erreichbar");
  const json = await directResponse.json();
  return mapOpenFoodFactsResponse(json, code);
}

function mapOpenFoodFactsResponse(json, code) {
  if (!json || json.status === 0 || !json.product) {
    return { found: false, code };
  }
  const product = json.product;
  const productName = product.product_name_de || product.product_name || product.generic_name || "";
  if (!productName.trim()) {
    return { found: false, code };
  }
  return {
    found: true,
    code,
    product: {
      barcode: code,
      product: productName.trim(),
      unit: "Stück",
      imageUrl: product.image_front_url || product.image_url || "",
      brands: product.brands || "",
      stores: product.stores || "",
      quantityLabel: product.quantity || "",
      source: "Open Food Facts"
    }
  };
}

async function startScanner() {
  if (!("BarcodeDetector" in window)) {
    toast("Scanner nicht verfügbar", "Dieser Browser unterstützt keine Barcode-Erkennung. Gib den Code manuell ein.", "warn");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    toast("Kamera nicht verfügbar", "Kamera-Zugriff ist nur über HTTPS oder localhost möglich.", "warn");
    return;
  }

  try {
    openDialog(els.scannerDialog);
    els.scannerStatus.textContent = "Kamera wird gestartet ...";
    scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    els.scannerVideo.srcObject = scannerStream;
    await els.scannerVideo.play();

    const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
    els.scannerStatus.textContent = "Barcode in den Rahmen halten.";
    scannerTimer = window.setInterval(async () => {
      try {
        const codes = await detector.detect(els.scannerVideo);
        if (!codes.length) return;
        els.barcode.value = codes[0].rawValue;
        lookupBarcode();
        stopScanner();
        toast("Barcode erkannt", `${codes[0].rawValue} wurde übernommen.`);
      } catch (error) {
        els.scannerStatus.textContent = "Scanner wartet auf ein klares Bild.";
      }
    }, 650);
  } catch (error) {
    stopScanner();
    toast("Kamera blockiert", "Erlaube Kamera-Zugriff oder nutze die manuelle Eingabe.", "danger");
  }
}

function stopScanner() {
  if (scannerTimer) window.clearInterval(scannerTimer);
  scannerTimer = null;
  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => track.stop());
  }
  scannerStream = null;
  if (els.scannerVideo) els.scannerVideo.srcObject = null;
  closeDialog(els.scannerDialog);
}

async function requestNotifications() {
  if (!("Notification" in window)) {
    toast("Nicht unterstützt", "Dieser Browser unterstützt keine Systembenachrichtigungen.", "warn");
    return;
  }
  const permission = await Notification.requestPermission();
  state.notificationsEnabled = permission === "granted";
  persist();
  if (state.notificationsEnabled) {
    notify("Benachrichtigungen aktiv", "Du bekommst Hinweise bei niedrigem Bestand.");
  } else {
    toast("Nicht aktiviert", "Benachrichtigungen wurden nicht erlaubt.", "warn");
  }
}

async function installPwa() {
  if (!deferredInstallPrompt) {
    toast("Installation", "Nutze im Browsermenü „App installieren“ oder „Zum Startbildschirm hinzufügen“.", "warn");
    return;
  }
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installAppButton?.classList.add("is-hidden");
  if (choice.outcome === "accepted") {
    toast("App wird installiert", "Haushaltslager kann danach wie eine normale App geöffnet werden.");
  }
}

async function initSync() {
  syncState = createSyncState();
  renderSyncPanel();
  if (!syncState.configured || !syncState.session?.accessToken) return;

  try {
    syncState.syncing = true;
    renderSyncPanel();
    await ensureFreshSession();
    syncState.user = await getAuthUser();
    await ensureHousehold();
    await reconcileRemoteState();
    setSyncMessage("Verbunden.", "success");
  } catch (error) {
    setSyncMessage(error.message || "Sync nicht erreichbar.", "warn");
  } finally {
    syncState.syncing = false;
    renderSyncPanel();
  }
}

async function signInSync() {
  if (!assertSyncConfigured()) return;
  const credentials = readSyncCredentials();
  if (!credentials) return;
  try {
    syncState.syncing = true;
    renderSyncPanel();
    const payload = await authRequest("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: credentials
    });
    setSession(payload);
    syncState.user = await getAuthUser();
    await ensureHousehold();
    await reconcileRemoteState();
    els.syncPassword.value = "";
    toast("Sync aktiv", "Dein Lager ist mit Supabase verbunden.");
    setSyncMessage("Verbunden.", "success");
  } catch (error) {
    setSyncMessage(error.message || "Anmeldung fehlgeschlagen.", "danger");
    toast("Sync fehlgeschlagen", error.message || "Anmeldung fehlgeschlagen.", "danger");
  } finally {
    syncState.syncing = false;
    renderSyncPanel();
  }
}

async function signUpSync() {
  if (!assertSyncConfigured()) return;
  const credentials = readSyncCredentials();
  if (!credentials) return;
  try {
    syncState.syncing = true;
    renderSyncPanel();
    const payload = await authRequest("/auth/v1/signup", {
      method: "POST",
      body: credentials
    });
    if (!payload.access_token) {
      setSyncMessage("Registriert. E-Mail-Bestätigung prüfen.", "warn");
      toast("Registrierung erstellt", "Prüfe deine E-Mail, falls Supabase eine Bestätigung verlangt.", "warn");
      return;
    }
    setSession(payload);
    syncState.user = await getAuthUser();
    await ensureHousehold();
    await pushRemoteState(true);
    els.syncPassword.value = "";
    toast("Sync aktiv", "Dein Konto wurde erstellt.");
    setSyncMessage("Verbunden.", "success");
  } catch (error) {
    setSyncMessage(error.message || "Registrierung fehlgeschlagen.", "danger");
    toast("Registrierung fehlgeschlagen", error.message || "Supabase hat die Anfrage abgelehnt.", "danger");
  } finally {
    syncState.syncing = false;
    renderSyncPanel();
  }
}

async function signOutSync() {
  try {
    if (syncState.session?.accessToken) {
      await authRequest("/auth/v1/logout", { method: "POST", auth: true });
    }
  } catch (error) {
    // Lokales Abmelden ist wichtiger als ein nicht erreichbarer Logout-Endpoint.
  }
  clearSyncSession();
  setSyncMessage(syncState.configured ? "Nur lokal gespeichert." : "Supabase nicht konfiguriert.", "warn");
  toast("Abgemeldet", "Neue Änderungen bleiben lokal.");
  renderSyncPanel();
}

async function syncNow() {
  if (!assertSyncConfigured() || !syncState.user) return;
  try {
    syncState.syncing = true;
    renderSyncPanel();
    await ensureFreshSession();
    await ensureHousehold();
    await pushRemoteState(true);
  } catch (error) {
    setSyncMessage(error.message || "Synchronisierung fehlgeschlagen.", "danger");
    toast("Sync fehlgeschlagen", error.message || "Supabase ist nicht erreichbar.", "danger");
  } finally {
    syncState.syncing = false;
    renderSyncPanel();
  }
}

function createSyncState() {
  const config = getSupabaseConfig();
  return {
    config,
    configured: Boolean(config.url && config.key),
    session: loadSyncSession(),
    user: null,
    householdId: "",
    householdName: "",
    syncing: false,
    pendingSave: false,
    message: config.url && config.key ? "Bereit." : "Supabase nicht konfiguriert.",
    messageType: config.url && config.key ? "success" : "warn"
  };
}

function getSupabaseConfig() {
  const config = window.HAUSHALTSLAGER_CONFIG || {};
  return {
    url: String(config.supabaseUrl || "").replace(/\/+$/, ""),
    key: String(config.supabaseAnonKey || config.supabasePublishableKey || "")
  };
}

function readSyncCredentials() {
  const email = els.syncEmail.value.trim();
  const password = els.syncPassword.value;
  if (!email || !password) {
    setSyncMessage("E-Mail und Passwort ausfüllen.", "warn");
    return null;
  }
  if (password.length < 6) {
    setSyncMessage("Passwort braucht mindestens 6 Zeichen.", "warn");
    return null;
  }
  return { email, password };
}

function assertSyncConfigured() {
  if (syncState.configured) return true;
  setSyncMessage("SUPABASE_URL und SUPABASE_ANON_KEY fehlen.", "danger");
  toast("Supabase fehlt", "Setze die Render-Umgebungsvariablen und deploye neu.", "danger");
  return false;
}

async function ensureHousehold() {
  if (!syncState.user?.id) throw new Error("Kein Supabase-Benutzer geladen.");
  if (syncState.householdId) return syncState.householdId;

  const userId = encodeURIComponent(syncState.user.id);
  const households = await restRequest(`/rest/v1/households?owner_id=eq.${userId}&select=id,name,updated_at&limit=1`);
  let household = households?.[0];
  if (!household) {
    const created = await restRequest("/rest/v1/households", {
      method: "POST",
      body: { name: "Mein Haushalt", owner_id: syncState.user.id },
      headers: { Prefer: "return=representation" }
    });
    household = created?.[0];
  }
  if (!household?.id) throw new Error("Haushalt konnte nicht angelegt werden.");

  await restRequest("/rest/v1/household_members?on_conflict=household_id,user_id", {
    method: "POST",
    body: { household_id: household.id, user_id: syncState.user.id, role: "owner" },
    headers: { Prefer: "resolution=merge-duplicates" }
  });

  syncState.householdId = household.id;
  syncState.householdName = household.name || "Mein Haushalt";
  return syncState.householdId;
}

async function reconcileRemoteState() {
  const row = await fetchRemoteState();
  if (!row) {
    await pushRemoteState(false);
    return;
  }

  const remoteUpdatedAt = row.updated_at || nowIso();
  const remoteLooksNewer = !syncMeta.localUpdatedAt || new Date(remoteUpdatedAt) >= new Date(syncMeta.localUpdatedAt);
  const loadRemote = remoteLooksNewer || window.confirm("Supabase-Daten laden und lokale Daten ersetzen?");

  if (loadRemote) {
    state = normalizeState(row.state || {});
    syncMeta.localUpdatedAt = remoteUpdatedAt;
    syncMeta.remoteUpdatedAt = remoteUpdatedAt;
    syncMeta.lastSyncAt = remoteUpdatedAt;
    saveSyncMeta();
    persist({ syncRemote: false });
    renderAll();
    toast("Sync geladen", `${state.items.length} Artikel wurden aus Supabase geladen.`);
  } else {
    await pushRemoteState(false);
  }
}

async function fetchRemoteState() {
  if (!syncState.householdId) return null;
  const householdId = encodeURIComponent(syncState.householdId);
  const rows = await restRequest(`/rest/v1/pantry_states?household_id=eq.${householdId}&select=state,updated_at&limit=1`);
  return rows?.[0] || null;
}

function scheduleRemoteSave(delay = 900) {
  if (!syncState.configured || !syncState.user || !syncState.householdId) return;
  if (syncState.syncing) {
    syncState.pendingSave = true;
    return;
  }
  window.clearTimeout(remoteSaveTimer);
  remoteSaveTimer = window.setTimeout(() => {
    pushRemoteState(false).catch((error) => {
      setSyncMessage(error.message || "Automatischer Sync fehlgeschlagen.", "warn");
    });
  }, delay);
}

async function pushRemoteState(manual) {
  if (!syncState.configured || !syncState.session?.accessToken || !syncState.householdId) return;
  const hadPendingSave = syncState.pendingSave;
  syncState.pendingSave = false;
  try {
    await ensureFreshSession();
    syncState.syncing = true;
    renderSyncPanel();
    const updatedAt = nowIso();
    await restRequest("/rest/v1/pantry_states?on_conflict=household_id", {
      method: "POST",
      body: {
        household_id: syncState.householdId,
        state: normalizeState(state),
        updated_at: updatedAt
      },
      headers: { Prefer: "resolution=merge-duplicates,return=representation" }
    });
    syncMeta.localUpdatedAt = updatedAt;
    syncMeta.remoteUpdatedAt = updatedAt;
    syncMeta.lastSyncAt = updatedAt;
    saveSyncMeta();
    setSyncMessage("Synchronisiert.", "success");
    if (manual) toast("Synchronisiert", "Supabase ist auf dem aktuellen Stand.");
  } finally {
    syncState.syncing = false;
    renderSyncPanel();
    if (hadPendingSave || syncState.pendingSave) {
      syncState.pendingSave = false;
      scheduleRemoteSave(80);
    }
  }
}

async function getAuthUser() {
  const user = await authRequest("/auth/v1/user", { method: "GET", auth: true });
  if (!user?.id) throw new Error("Supabase-Session ungültig.");
  return user;
}

async function ensureFreshSession() {
  const session = syncState.session;
  if (!session?.accessToken) throw new Error("Nicht angemeldet.");
  const expiresAt = Number(session.expiresAt || 0) * 1000;
  if (expiresAt && expiresAt - Date.now() > 60000) return session;
  if (!session.refreshToken) throw new Error("Session abgelaufen.");
  const payload = await authRequest("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: session.refreshToken }
  });
  setSession(payload);
  return syncState.session;
}

async function authRequest(path, options = {}) {
  const headers = {
    apikey: syncState.config.key,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (options.auth) headers.Authorization = `Bearer ${syncState.session?.accessToken || ""}`;
  const response = await fetch(`${syncState.config.url}${path}`, {
    method: options.method || "POST",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return parseSupabaseResponse(response);
}

async function restRequest(path, options = {}) {
  await ensureFreshSession();
  const headers = {
    apikey: syncState.config.key,
    Authorization: `Bearer ${syncState.session.accessToken}`,
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${syncState.config.url}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return parseSupabaseResponse(response);
}

async function parseSupabaseResponse(response) {
  const text = await response.text();
  const payload = text ? tryParseJson(text) : null;
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || response.statusText;
    throw new Error(message);
  }
  return payload;
}

function setSession(payload) {
  const accessToken = payload.access_token;
  const refreshToken = payload.refresh_token;
  if (!accessToken || !refreshToken) throw new Error("Supabase hat keine Session zurückgegeben.");
  const expiresAt = payload.expires_at || Math.floor(Date.now() / 1000) + Number(payload.expires_in || 3600);
  syncState.session = {
    accessToken,
    refreshToken,
    expiresAt,
    user: payload.user || null
  };
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(syncState.session));
}

function loadSyncSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY) || "null");
    return session?.accessToken ? session : null;
  } catch (error) {
    return null;
  }
}

function clearSyncSession() {
  localStorage.removeItem(SYNC_STORAGE_KEY);
  window.clearTimeout(remoteSaveTimer);
  syncState = createSyncState();
}

function loadSyncMeta() {
  try {
    const meta = JSON.parse(localStorage.getItem(SYNC_META_STORAGE_KEY) || "null");
    return meta && typeof meta === "object" ? meta : {};
  } catch (error) {
    return {};
  }
}

function saveSyncMeta() {
  localStorage.setItem(SYNC_META_STORAGE_KEY, JSON.stringify(syncMeta));
}

function setSyncMessage(message, type = "success") {
  syncState.message = message;
  syncState.messageType = type;
  renderSyncPanel();
}

function renderSyncPanel() {
  if (!els.syncStatusBadge) return;
  const online = Boolean(syncState.user);
  const badge = !syncState.configured
    ? "Fehlt"
    : syncState.syncing
      ? "Sync"
      : online
        ? "Online"
        : "Lokal";
  els.syncStatusBadge.textContent = badge;
  els.syncStatusBadge.className = `badge ${online ? "" : "neutral"}`;
  els.syncForm?.classList.toggle("is-hidden", online);
  els.syncAccount?.classList.toggle("is-hidden", !online);
  if (els.syncUser) els.syncUser.textContent = syncState.user?.email || "-";
  if (els.syncHousehold) els.syncHousehold.textContent = syncState.householdName || "-";
  if (els.syncLast) els.syncLast.textContent = syncMeta.lastSyncAt ? formatDateTime(syncMeta.lastSyncAt) : "-";
  if (els.syncMessage) {
    els.syncMessage.textContent = syncState.message || "";
    els.syncMessage.className = `field-hint sync-message ${syncState.messageType || ""}`;
  }
  document.querySelectorAll("[data-action='sync-sign-up'], [data-action='sync-now']").forEach((button) => {
    button.disabled = !syncState.configured || syncState.syncing;
  });
  const submit = els.syncForm?.querySelector("button[type='submit']");
  if (submit) submit.disabled = !syncState.configured || syncState.syncing;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .catch(() => {
        // PWA bleibt auch ohne Service Worker nutzbar, z. B. bei file://.
      });
  });
}

function notify(title, body) {
  if (state.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function renderAll() {
  renderLocationOptions();
  renderInventory();
  renderNotifications();
  renderPriceAlerts();
  renderYears();
  renderCharts();
  renderSummary();
  renderLocations();
  renderShoppingList();
  renderConsumeOptions();
}

function renderLocationOptions() {
  els.location.innerHTML = state.locations
    .map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
    .join("");
}

function renderInventory() {
  const groupBy = els.groupBy.value;
  const visibleItems = filteredItems();
  els.itemCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "Artikel" : "Artikel"}`;

  if (!visibleItems.length) {
    els.inventoryList.innerHTML = emptyState("archive", "Keine passenden Artikel", "Füge einen Einkauf hinzu oder ändere den Filter.");
    installIcons(els.inventoryList);
    return;
  }

  const groups = groupItems(visibleItems, groupBy);
  els.inventoryList.innerHTML = Array.from(groups.entries()).map(([group, items]) => {
    const value = items.reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
    return `
      <section class="group-block">
        <header class="group-header">
          <h3>${escapeHtml(group)}</h3>
          <span class="counter">${items.length} · ${formatMoney(value)}</span>
        </header>
        ${items.map(renderItemRow).join("")}
      </section>
    `;
  }).join("");
  installIcons(els.inventoryList);
}

function renderItemRow(item) {
  const status = getItemStatus(item);
  const expiry = item.expires ? formatDate(item.expires) : "kein MHD";
  const price = item.price ? formatMoney(item.price) : "kein Preis";
  return `
    <article class="item-row">
      <div class="item-main">
        ${renderProductThumb(item)}
        <div class="item-copy">
          <div class="item-title">
            <span class="status-dot ${status.className}"></span>
            <span>${escapeHtml(item.product)}</span>
          </div>
          <div class="item-meta">
            <span>${item.barcode ? escapeHtml(item.barcode) : "ohne Barcode"}</span>
            <span>${escapeHtml(status.label)}</span>
            <span>${escapeHtml(item.dataSource || "Lokal")}</span>
            <span>Min. ${formatQuantity(item.minStock)} ${escapeHtml(item.unit)}</span>
          </div>
        </div>
      </div>
      <div class="quantity-cell">
        <span class="row-label">Menge</span>
        ${formatQuantity(item.quantity)} ${escapeHtml(item.unit)}
      </div>
      <div>
        <span class="row-label">Ort</span>
        ${escapeHtml(item.location)}
      </div>
      <div>
        <span class="row-label">MHD</span>
        ${escapeHtml(expiry)}
      </div>
      <div>
        <span class="row-label">Preis</span>
        ${escapeHtml(price)}
      </div>
      <div class="row-actions">
        <button class="mini-button warn" type="button" data-remove-one="${item.id}" aria-label="Einheit entnehmen">-1</button>
        <button class="mini-button" type="button" data-consume-id="${item.id}" aria-label="Verbrauch erfassen"><span data-icon="minus-circle"></span></button>
        <button class="mini-button danger" type="button" data-delete-id="${item.id}" aria-label="Artikel löschen"><span data-icon="x"></span></button>
      </div>
    </article>
  `;
}

function renderProductThumb(item) {
  const label = productInitials(item.product);
  if (item.imageUrl) {
    return `<span class="product-thumb"><img src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" onerror="this.parentElement.textContent='${escapeHtml(label)}'; this.parentElement.classList.add('placeholder'); this.remove();"></span>`;
  }
  return `<span class="product-thumb placeholder" aria-hidden="true">${escapeHtml(label)}</span>`;
}

function renderNotifications() {
  const notices = getNotifications();
  els.notificationCount.textContent = String(notices.length);
  els.notifications.innerHTML = notices.length
    ? notices.map(renderNotice).join("")
    : emptyState("bell", "Alles im grünen Bereich", "Keine niedrigen Bestände oder nahen Ablaufdaten.");
  installIcons(els.notifications);
}

function renderPriceAlerts() {
  const alerts = getPriceAlerts();
  els.priceAlertCount.textContent = String(alerts.length);
  els.priceAlerts.innerHTML = alerts.length
    ? alerts.map((alert) => renderNotice(alert)).join("")
    : emptyState("tag", "Keine Preisänderung", "Sobald ein Produkt teurer wird, erscheint hier ein Hinweis.");
  installIcons(els.priceAlerts);
}

function renderNotice(notice) {
  return `
    <article class="notice ${notice.severity || "info"}">
      <strong>${escapeHtml(notice.title)}</strong>
      <span>${escapeHtml(notice.body)}</span>
    </article>
  `;
}

function renderYears() {
  const years = new Set([String(new Date().getFullYear())]);
  state.movements.forEach((movement) => years.add(String(new Date(movement.date).getFullYear())));
  if (!years.has(selectedYear)) selectedYear = String(new Date().getFullYear());
  els.yearSelect.innerHTML = Array.from(years)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => `<option value="${year}" ${year === selectedYear ? "selected" : ""}>${year}</option>`)
    .join("");
}

function renderCharts() {
  const year = Number(selectedYear);
  const consumption = monthTotals(year, "out", activeMetric);
  const spending = monthTotals(year, "in", "spend");
  const consumedTotal = consumption.reduce((sum, value) => sum + value, 0);
  const spendingTotal = spending.reduce((sum, value) => sum + value, 0);

  els.consumptionSummary.textContent = activeMetric === "quantity"
    ? `${formatQuantity(consumedTotal)} Einheiten entnommen`
    : `${formatMoney(consumedTotal)} Warenwert verbraucht`;
  els.spendingSummary.textContent = `${formatMoney(spendingTotal)} Einkaufswert erfasst`;

  renderBarChart(els.consumptionChart, consumption, activeMetric === "quantity" ? formatQuantity : formatMoney);
  renderLineChart(els.spendingChart, spending);
}

function renderBarChart(container, values, formatter) {
  const max = Math.max(...values, 1);
  container.innerHTML = values.map((value, index) => {
    const height = Math.max(4, (value / max) * 100);
    return `
      <div class="bar-column" title="${MONTHS[index]}: ${formatter(value)}">
        <div class="bar-track">
          <span class="bar-fill" style="height:${height}%"></span>
        </div>
        <span class="bar-value">${formatter(value)}</span>
        <span class="bar-label">${MONTHS[index]}</span>
      </div>
    `;
  }).join("");
}

function renderLineChart(container, values) {
  const width = 520;
  const height = 220;
  const padding = 28;
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / 11;
    const y = height - padding - (value / max) * (height - padding * 2);
    return { x, y, value };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const grid = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = height - padding - ratio * (height - padding * 2);
    return `<line class="line-grid" x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}"></line>`;
  }).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Ausgaben pro Monat">
      ${grid}
      <path class="line-area" d="${area}"></path>
      <path class="line-path" d="${path}"></path>
      ${points.map((point, index) => `<circle class="line-dot" cx="${point.x}" cy="${point.y}" r="4"><title>${MONTHS[index]}: ${formatMoney(point.value)}</title></circle>`).join("")}
      ${MONTHS.map((month, index) => {
        const x = padding + (index * (width - padding * 2)) / 11;
        return `<text class="line-label" x="${x}" y="${height - 6}" text-anchor="middle">${month}</text>`;
      }).join("")}
    </svg>
  `;
}

function renderSummary() {
  const year = Number(selectedYear);
  const totalValue = state.items.reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
  const activeItems = state.items.filter((item) => item.quantity > 0).length;
  const lowStock = state.items.filter((item) => item.quantity > 0 && item.quantity <= item.minStock).length;
  const expiring = state.items.filter((item) => getDaysUntil(item.expires) != null && getDaysUntil(item.expires) <= 7 && item.quantity > 0).length;
  const spend = monthTotals(year, "in", "spend").reduce((sum, value) => sum + value, 0);
  const consumedValue = monthTotals(year, "out", "spend").reduce((sum, value) => sum + value, 0);
  const rows = [
    ["Aktive Artikel", activeItems],
    ["Lagerwert", formatMoney(totalValue)],
    ["Niedrige Bestände", lowStock],
    ["MHD ≤ 7 Tage", expiring],
    [`Einkäufe ${year}`, formatMoney(spend)],
    [`Verbrauch ${year}`, formatMoney(consumedValue)]
  ];
  els.summaryYear.textContent = year;
  els.summaryList.innerHTML = rows.map(([label, value]) => `
    <div class="summary-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(String(value))}</dd>
    </div>
  `).join("");
}

function renderLocations() {
  els.locationList.innerHTML = state.locations.map((location) => {
    const items = state.items.filter((item) => item.location === location && item.quantity > 0);
    const value = items.reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
    return `
      <article class="location-row">
        <div>
          <strong>${escapeHtml(location)}</strong>
          <div class="muted">${items.length} Artikel · ${formatMoney(value)}</div>
        </div>
        <button class="mini-button danger" type="button" data-remove-location="${escapeHtml(location)}" aria-label="Ort löschen"><span data-icon="x"></span></button>
      </article>
    `;
  }).join("");
  installIcons(els.locationList);
}

function renderShoppingList() {
  const lowItems = state.items
    .filter((item) => item.quantity <= item.minStock)
    .sort((a, b) => a.product.localeCompare(b.product, "de"));
  els.shoppingItems.innerHTML = lowItems.length
    ? lowItems.map((item) => {
      const target = Math.max(item.minStock + 1 - item.quantity, 1);
      return `
        <article class="shopping-row">
          <div>
            <strong>${escapeHtml(item.product)}</strong>
            <div class="muted">${escapeHtml(item.location)} · aktuell ${formatQuantity(item.quantity)} ${escapeHtml(item.unit)}</div>
          </div>
          <span class="status-pill">${formatQuantity(target)} ${escapeHtml(item.unit)}</span>
        </article>
      `;
    }).join("")
    : emptyState("check", "Keine Nachkäufe", "Alle Bestände liegen über dem Mindestbestand.");
  installIcons(els.shoppingItems);
}

function renderConsumeOptions(selectedId = "") {
  const items = state.items.filter((item) => item.quantity > 0);
  els.consumeItem.innerHTML = items.length
    ? items.map((item) => `
      <option value="${item.id}" ${item.id === selectedId ? "selected" : ""}>
        ${escapeHtml(item.product)} · ${escapeHtml(item.location)} · ${formatQuantity(item.quantity)} ${escapeHtml(item.unit)}
      </option>
    `).join("")
    : '<option value="">Kein Bestand vorhanden</option>';
}

function openConsumeDialog(selectedId = "") {
  renderConsumeOptions(selectedId);
  els.consumeQuantity.value = "1";
  openDialog(els.consumeDialog);
}

function openDialog(dialog) {
  if (dialog?.showModal && !dialog.open) dialog.showModal();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

function focusView(view) {
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
  const target = {
    lager: ".inventory-panel",
    scan: "#intake-card",
    verbrauch: "#analytics-card",
    preise: "[data-section='preise']",
    orte: "[data-section='orte']"
  }[view];
  document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function filteredItems() {
  return state.items
    .filter((item) => !lowOnly || item.quantity <= item.minStock)
    .filter((item) => {
      if (!searchTerm) return true;
      return [item.product, item.barcode, item.location, item.unit]
        .filter(Boolean)
        .some((value) => normalize(value).includes(searchTerm));
    })
    .sort((a, b) => {
      const statusDiff = getItemStatus(a).priority - getItemStatus(b).priority;
      if (statusDiff) return statusDiff;
      return a.product.localeCompare(b.product, "de");
    });
}

function groupItems(items, groupBy) {
  const groups = new Map();
  items.forEach((item) => {
    const key = groupBy === "status"
      ? getItemStatus(item).label
      : groupBy === "product"
        ? item.product.slice(0, 1).toUpperCase()
        : item.location;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return new Map(Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, "de")));
}

function getNotifications() {
  const notices = [];
  state.items.forEach((item) => {
    if (item.quantity <= 0) {
      notices.push({
        severity: "danger",
        title: `${item.product} ist leer`,
        body: `${item.location}: Bitte nachkaufen oder aus dem Lager löschen.`
      });
      return;
    }
    if (item.quantity <= item.minStock) {
      notices.push({
        severity: "warn",
        title: `Mindestbestand erreicht`,
        body: `${item.product}: noch ${formatQuantity(item.quantity)} ${item.unit} in ${item.location}.`
      });
    }
    const days = getDaysUntil(item.expires);
    if (days != null && days < 0) {
      notices.push({
        severity: "danger",
        title: `MHD überschritten`,
        body: `${item.product} in ${item.location} ist seit ${Math.abs(days)} Tagen abgelaufen.`
      });
    } else if (days != null && days <= 7) {
      notices.push({
        severity: "warn",
        title: `MHD in ${days} Tagen`,
        body: `${item.product} in ${item.location} bald verbrauchen.`
      });
    }
  });
  return notices.slice(0, 8);
}

function getPriceAlerts() {
  const byProduct = new Map();
  state.movements
    .filter((movement) => movement.type === "in" && movement.price > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((movement) => {
      const key = movement.barcode || movement.product;
      if (!byProduct.has(key)) byProduct.set(key, []);
      byProduct.get(key).push(movement);
    });

  return Array.from(byProduct.values()).flatMap((history) => {
    if (history.length < 2) return [];
    const previous = history[history.length - 2];
    const latest = history[history.length - 1];
    if (latest.price <= previous.price * 1.1) return [];
    const change = ((latest.price - previous.price) / previous.price) * 100;
    return [{
      severity: "info",
      title: `${latest.product} +${Math.round(change)}%`,
      body: `Aktuell ${formatMoney(latest.price)}, vorher ${formatMoney(previous.price)}.`
    }];
  }).slice(0, 5);
}

function getItemStatus(item) {
  if (item.quantity <= 0) return { label: "Leer", className: "empty", priority: 0 };
  const days = getDaysUntil(item.expires);
  if (days != null && days < 0) return { label: "Abgelaufen", className: "expired", priority: 1 };
  if (item.quantity <= item.minStock) return { label: "Niedrig", className: "low", priority: 2 };
  if (days != null && days <= 7) return { label: "Bald verbrauchen", className: "low", priority: 3 };
  return { label: "OK", className: "ok", priority: 4 };
}

function monthTotals(year, type, metric) {
  const values = Array(12).fill(0);
  state.movements.forEach((movement) => {
    const date = new Date(movement.date);
    if (date.getFullYear() !== year || movement.type !== type) return;
    const amount = metric === "spend" ? movement.quantity * (movement.price || 0) : movement.quantity;
    values[date.getMonth()] += amount;
  });
  return values.map(roundAmount);
}

function addMovement(type, payload) {
  state.movements.push({
    id: uid(),
    type,
    barcode: payload.barcode || "",
    product: payload.product,
    quantity: roundAmount(payload.quantity),
    unit: payload.unit,
    location: payload.location,
    price: roundAmount(payload.price || 0),
    note: payload.note || "",
    date: nowIso()
  });
}

function rememberCatalog({ barcode, product, unit, price, minStock, imageUrl = "", source = "Lokal", brands = "", stores = "", quantityLabel = "" }) {
  if (!barcode) return;
  state.catalog[barcode] = {
    product,
    unit,
    price: roundAmount(price || 0),
    minStock: Number.isFinite(minStock) ? minStock : 1,
    imageUrl,
    source,
    brands,
    stores,
    quantityLabel,
    updatedAt: nowIso()
  };
}

function getItem(id) {
  return state.items.find((item) => item.id === id);
}

function getDaysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date - today) / 86400000);
}

function emptyState(icon, title, body) {
  return `
    <div class="empty-state">
      <span data-icon="${icon}"></span>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(body)}</span>
    </div>
  `;
}

function updateImagePreview(imageUrl) {
  const fallback = productInitials(els.product?.value || els.barcode?.value || "?");
  if (!els.imagePreview) return;
  if (!imageUrl) {
    els.imagePreview.className = "product-thumb placeholder";
    els.imagePreview.textContent = fallback;
    return;
  }
  els.imagePreview.className = "product-thumb";
  els.imagePreview.innerHTML = `<img src="${escapeHtml(imageUrl)}" alt="" onerror="this.parentElement.className='product-thumb placeholder'; this.parentElement.textContent='${escapeHtml(fallback)}';">`;
}

async function handleImageFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast("Kein Bild", "Bitte wähle ein Foto oder Produktbild aus.", "warn");
    return;
  }

  try {
    const dataUrl = await resizeImageFile(file, 700, 0.78);
    els.imageUrl.value = dataUrl;
    updateImagePreview(dataUrl);
    toast("Bild übernommen", "Das Foto wird lokal mit dem Artikel gespeichert.");
  } catch (error) {
    toast("Bild nicht übernommen", "Das Foto konnte nicht verarbeitet werden.", "danger");
  }
}

function resizeImageFile(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function productInitials(value) {
  const words = String(value || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!words.length) return "?";
  return words.map((word) => word[0]).join("").toUpperCase();
}

function copyShoppingList() {
  const lines = state.items
    .filter((item) => item.quantity <= item.minStock)
    .map((item) => `- ${item.product}: ${formatQuantity(Math.max(item.minStock + 1 - item.quantity, 1))} ${item.unit}`);
  const text = lines.length ? lines.join("\n") : "Keine Nachkäufe nötig.";
  navigator.clipboard?.writeText(text)
    .then(() => toast("Einkaufsliste kopiert", "Die Liste liegt in der Zwischenablage."))
    .catch(() => toast("Kopieren nicht möglich", text, "warn"));
}

function exportData() {
  const payload = {
    version: 1,
    exportedAt: nowIso(),
    state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `haushaltslager-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("Export erstellt", "Bestand, Orte, Preise und Verbrauch wurden als JSON exportiert.");
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const imported = payload.state || payload;
      if (!Array.isArray(imported.items) || !Array.isArray(imported.locations) || !Array.isArray(imported.movements)) {
        throw new Error("invalid");
      }
      if (!window.confirm("Aktuelle lokale Daten durch den Import ersetzen?")) return;
      state = normalizeState(imported);
      persist();
      renderAll();
      toast("Import abgeschlossen", `${state.items.length} Artikel wurden geladen.`);
    } catch (error) {
      toast("Import fehlgeschlagen", "Die Datei passt nicht zum Haushaltslager-Format.", "danger");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function resetDemoData() {
  if (!window.confirm("Demo-Daten laden und aktuelle lokale Daten ersetzen?")) return;
  state = createSeedState();
  persist();
  renderAll();
  toast("Demo geladen", "Beispielbestand und Jahresdaten wurden wiederhergestellt.");
}

function toast(title, body, type = "success") {
  const node = document.createElement("div");
  node.className = `toast ${type === "danger" ? "danger" : type === "warn" ? "warn" : ""}`;
  node.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>`;
  els.toastRegion.appendChild(node);
  window.setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateY(8px)";
    node.style.transition = "opacity 180ms ease, transform 180ms ease";
    window.setTimeout(() => node.remove(), 220);
  }, 3600);
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return stored ? normalizeState(stored) : createSeedState();
  } catch (error) {
    return createSeedState();
  }
}

function normalizeState(input) {
  const normalized = {
    locations: Array.isArray(input.locations) && input.locations.length ? input.locations : ["Kühlschrank", "Gefrierfach", "Vorratsschrank"],
    items: Array.isArray(input.items) ? input.items : [],
    movements: Array.isArray(input.movements) ? input.movements : [],
    catalog: input.catalog && typeof input.catalog === "object" ? input.catalog : {},
    notificationsEnabled: Boolean(input.notificationsEnabled)
  };
  normalized.items = normalized.items.map((item) => ({
    id: item.id || uid(),
    barcode: item.barcode || "",
    product: item.product || "Unbenannter Artikel",
    quantity: roundAmount(item.quantity || 0),
    unit: item.unit || "Stück",
    location: item.location || normalized.locations[0],
    expires: item.expires || "",
    price: roundAmount(item.price || 0),
    minStock: roundAmount(item.minStock ?? 1),
    imageUrl: item.imageUrl || "",
    dataSource: item.dataSource || (item.imageUrl ? "Manuell" : "Lokal"),
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || nowIso()
  }));
  normalized.catalog = Object.fromEntries(Object.entries(normalized.catalog).map(([barcode, entry]) => [barcode, {
    product: entry.product || "",
    unit: entry.unit || "Stück",
    price: roundAmount(entry.price || 0),
    minStock: roundAmount(entry.minStock ?? 1),
    imageUrl: entry.imageUrl || "",
    source: entry.source || "Lokal",
    brands: entry.brands || "",
    stores: entry.stores || "",
    quantityLabel: entry.quantityLabel || "",
    updatedAt: entry.updatedAt || nowIso()
  }]));
  normalized.movements = normalized.movements.map((movement) => ({
    id: movement.id || uid(),
    type: movement.type === "out" ? "out" : "in",
    barcode: movement.barcode || "",
    product: movement.product || "Unbenannter Artikel",
    quantity: roundAmount(movement.quantity || 0),
    unit: movement.unit || "Stück",
    location: movement.location || "",
    price: roundAmount(movement.price || 0),
    note: movement.note || "",
    date: movement.date || nowIso()
  }));
  return normalized;
}

function createSeedState() {
  const locations = ["Kühlschrank", "Gefrierfach", "Vorratsschrank", "Kellerregal"];
  const currentYear = new Date().getFullYear();
  const items = [
    seedItem("4311501670013", "Hafermilch 1L", 4, "Packung", "Vorratsschrank", 1.29, 2, 94),
    seedItem("4008400401821", "Naturjoghurt", 1, "Becher", "Kühlschrank", 0.89, 2, 5),
    seedItem("4010355416100", "Tomaten passiert", 6, "Packung", "Kellerregal", 0.99, 3, 210),
    seedItem("4061458042448", "TK-Erbsen", 2, "Packung", "Gefrierfach", 1.79, 1, 160),
    seedItem("4001724012302", "Spaghetti", 3, "Packung", "Vorratsschrank", 1.19, 2, 360),
    seedItem("4005500081014", "Butter", 1, "Stück", "Kühlschrank", 2.29, 1, 19)
  ];
  const catalog = Object.fromEntries(items.map((item) => [item.barcode, {
    product: item.product,
    unit: item.unit,
    price: item.price,
    minStock: item.minStock,
    imageUrl: item.imageUrl,
    source: item.dataSource,
    brands: "",
    stores: "",
    quantityLabel: "",
    updatedAt: item.updatedAt
  }]));
  const movements = [];
  const products = items.slice(0, 5);
  for (let month = 0; month < 12; month += 1) {
    const product = products[month % products.length];
    const price = roundAmount(product.price + (month % 4) * 0.08);
    movements.push(seedMovement("in", product, 2 + (month % 3), price, currentYear, month, 4 + (month % 20)));
    if (month <= new Date().getMonth()) {
      movements.push(seedMovement("out", product, 1 + (month % 2), price, currentYear, month, 12 + (month % 14)));
    }
  }
  return normalizeState({ locations, items, movements, catalog, notificationsEnabled: false });
}

function seedItem(barcode, product, quantity, unit, location, price, minStock, daysUntilExpiry) {
  return {
    id: uid(),
    barcode,
    product,
    quantity,
    unit,
    location,
    expires: dateOffset(daysUntilExpiry),
    price,
    minStock,
    imageUrl: "",
    dataSource: "Demo",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

function seedMovement(type, item, quantity, price, year, month, day) {
  return {
    id: uid(),
    type,
    barcode: item.barcode,
    product: item.product,
    quantity,
    unit: item.unit,
    location: item.location,
    price,
    note: type === "in" ? "Demo-Einkauf" : "Demo-Verbrauch",
    date: new Date(year, month, day, 10, 0, 0).toISOString()
  };
}

function persist(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (options.syncRemote === false) return;
  syncMeta.localUpdatedAt = nowIso();
  saveSyncMeta();
  scheduleRemoteSave();
}

function parseAmount(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? roundAmount(parsed) : 0;
}

function roundAmount(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatQuantity(value) {
  return roundAmount(value).toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

function formatMoney(value) {
  return roundAmount(value).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function debounce(callback, wait) {
  let timer = 0;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), wait);
  };
}
