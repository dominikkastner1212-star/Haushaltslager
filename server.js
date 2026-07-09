const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const productFields = [
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

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  const productMatch = url.pathname.match(/^\/api\/product\/([^/]+)$/);

  if (productMatch) {
    await handleProductLookup(decodeURIComponent(productMatch[1]), response);
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(content);
  });
});

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`Haushaltslager läuft unter http://${displayHost}:${port}`);
});

async function handleProductLookup(barcode, response) {
  if (!/^[0-9A-Za-z._-]{4,32}$/.test(barcode)) {
    sendJson(response, 400, { found: false, error: "Ungültiger Barcode" });
    return;
  }

  const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${encodeURIComponent(productFields)}`;
  try {
    const apiResponse = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Haushaltslager/1.0 (local personal pantry app)"
      }
    });
    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, { found: false, error: "Open Food Facts nicht erreichbar" });
      return;
    }
    const json = await apiResponse.json();
    sendJson(response, 200, mapOpenFoodFactsResponse(json, barcode));
  } catch (error) {
    sendJson(response, 503, { found: false, error: "Produktdienst offline" });
  }
}

function mapOpenFoodFactsResponse(json, barcode) {
  if (!json || json.status === 0 || !json.product) {
    return { found: false, code: barcode };
  }

  const product = json.product;
  const productName = product.product_name_de || product.product_name || product.generic_name || "";
  if (!productName.trim()) {
    return { found: false, code: barcode };
  }

  return {
    found: true,
    code: barcode,
    product: {
      barcode,
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

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}
