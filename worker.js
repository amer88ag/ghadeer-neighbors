const OWNER = "amer88ag";
const REPO = "ghadeer-neighbors";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function safePath(pathname) {
  let path = decodeURIComponent(pathname || "/");
  path = path.replace(/^\/+/, "");
  if (!path || path.endsWith("/")) path += "index.html";
  if (!path.includes(".")) path = "index.html";
  if (path.includes("..") || path.includes("\\")) return null;
  return path;
}

function contentType(path) {
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? (MIME[path.slice(dot).toLowerCase()] || "application/octet-stream") : "text/plain; charset=utf-8";
}

function diagnostic(message, status = 200) {
  return new Response(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>جيران الغدير</title><body style="font-family:Arial;padding:30px"><h1>جيران حي الغدير</h1><p>${message}</p></body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/__health") {
      return new Response("ghadeer-neighbors worker: OK", {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const path = safePath(url.pathname);
    if (!path) return diagnostic("طلب ملف غير صالح.", 400);

    const upstream = await fetch(`${RAW_BASE}/${path}`, {
      method: request.method,
      headers: { "User-Agent": "ghadeer-neighbors-worker" },
      cf: { cacheTtl: 60, cacheEverything: true }
    });

    if (!upstream.ok) {
      if (path !== "index.html") {
        return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
      }
      return diagnostic(`تعذر تحميل index.html من GitHub. HTTP ${upstream.status}.`, 502);
    }

    const headers = new Headers(upstream.headers);
    headers.set("content-type", contentType(path));
    headers.set("cache-control", path === "index.html" ? "no-store" : "public, max-age=300");
    headers.set("x-ghadeer-origin", "github-raw");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers
    });
  }
};
