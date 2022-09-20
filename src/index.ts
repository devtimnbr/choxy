import { Context, Hono } from "hono";
import {
  getProxyUrl,
  getDuration,
  initProxyHeaders,
  initResponseHeaders,
} from "./utils";

const app = new Hono();

const CORS_ORIGINS = "*";
const FONT_HOSTNAME = "fonts.gstatic.com";

const chacheProxyRequest = async (
  c: Context<any>,
  cacheDuration: number,
  subPath = "/"
) => {
  const proxyUrl = getProxyUrl(c.req.url, subPath);

  // check the url with regex when not on cloudflare workers free tier
  if (!proxyUrl.includes(".")) {
    return c.text("400 No valid proxy url provided", 400);
  }

  let cache = caches.default;
  let response = await cache.match(proxyUrl);

  // CACHE-HIT
  if (response) {
    return response;
  }

  const proxyInit = initProxyHeaders(c);

  // could check response status codes - cloudflare handles it nonetheless
  response = await fetch(proxyUrl, proxyInit);

  const contentType = response.headers.get("Content-type");

  // get blob if proxy request is an image
  let proxyBody = contentType?.includes("image")
    ? await response.blob()
    : await response.text();

  // replace font hostname url with proxy url if it's a css response
  if (contentType === "text/css") {
    proxyBody = (proxyBody as string).replaceAll(
      FONT_HOSTNAME,
      c.env.WORKER_DOMAIN + FONT_HOSTNAME
    );
  }

  const responseInit = initResponseHeaders(response);

  response = new Response(proxyBody, responseInit);

  response.headers.append("Cache-control", `max-age=${cacheDuration}`);
  response.headers.set("access-control-allow-origin", CORS_ORIGINS);

  await cache.put(proxyUrl, response.clone());
  return response;
};

// cache response based on duration
app.get("/:duration{[0-9]+[smhdwMy]}/*", (c) => {
  const subPath = c.req.param("duration");
  const cacheDuration = getDuration(subPath);

  if (cacheDuration < 0) {
    return c.text("500 Internal Server Error", 500);
  }

  return chacheProxyRequest(c, cacheDuration, `/${subPath}/`);
});

// cache font requests for a year
app.get("/fonts/*", async (c) => {
  return await chacheProxyRequest(c, 31536000, "/fonts/");
});

// process font response without caching
app.get("/fonts.gstatic.com/*", (c) => {
  return fetch(getProxyUrl(c.req.url), c.req);
});

app.get("*", async (c) => {
  return c.text("404 Not found");
});

export default app;
