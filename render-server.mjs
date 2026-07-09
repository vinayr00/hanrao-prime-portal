// Minimal Node.js HTTP wrapper for TanStack Start / Nitro fetch handler on Render.com
import http from "node:http";
import { Readable } from "node:stream";

const PORT = parseInt(process.env.PORT || "3000", 10);

// Load the built fetch-handler exported by TanStack Start / Nitro
const { default: app } = await import("./dist/server/server.js");

const server = http.createServer(async (req, res) => {
  try {
    // Build a WHATWG Request from the Node IncomingMessage
    const proto =
      req.headers["x-forwarded-proto"] ||
      (req.socket?.encrypted ? "https" : "http");
    const host = req.headers.host || `localhost:${PORT}`;
    const url = `${proto}://${host}${req.url}`;

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) {
        if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
        else headers.set(k, v);
      }
    }

    // Stream body for POST/PUT/PATCH
    let body = undefined;
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method || "GET")) {
      body = Readable.toWeb(req);
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
      // @ts-ignore — duplex needed for streaming body
      duplex: "half",
    });

    // Call TanStack Start's fetch handler
    const response = await app.fetch(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((val, key) => res.setHeader(key, val));

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error("[server] Unhandled error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[hanrao] Listening on http://0.0.0.0:${PORT}`);
});
