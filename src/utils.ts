import { Context } from "hono";

export const getDuration = (durationString: string): any => {
  const timeFormat = durationString.slice(durationString.length - 1);
  let duration = Number(durationString.slice(0, -1));

  switch (timeFormat) {
    case "s":
      duration = duration;
      break;
    case "m":
      duration *= 60;
      break;
    case "h":
      duration *= 3600;
      break;
    case "d":
      duration *= 3600 * 24;
      break;
    case "W":
      duration *= 3600 * 24 * 7;
      break;
    case "M":
      duration *= 3600 * 24 * 30;
      break;
    case "y":
      duration *= 3600 * 24 * 30 * 12;
      break;
    default:
      return -1;
  }

  return duration;
};

export const initProxyHeaders = (c: Context) => {
  let init = {
    headers: {} as any,
  };
  // Only pass through a subset of headers
  const proxyHeaders = [
    "Accept",
    "Accept-Encoding",
    "Accept-Language",
    "Referer",
    "User-Agent",
  ];
  for (let name of proxyHeaders) {
    let value = c.req.headers.get(name);
    if (value) {
      init.headers[name] = value;
    }
  }

  // Add an X-Forwarded-For with the client IP
  const clientAddr = c.req.headers.get("cf-connecting-ip");
  if (clientAddr) {
    init.headers["X-Forwarded-For"] = clientAddr;
  }

  return init;
};

export const initResponseHeaders = (response: Response) => {
  const responseHeaders = [
    "Content-Type",
    "Cache-Control",
    "Expires",
    "Accept-Ranges",
    "Date",
    "Last-Modified",
    "ETag",
  ];
  // Only include a strict subset of response headers
  let responseInit = {
    status: response.status,
    statusText: response.statusText,
    headers: {} as any,
  };
  for (let name of responseHeaders) {
    let value = response.headers.get(name);
    if (value) {
      responseInit.headers[name] = value;
    }
  }
  // Add some security headers to make sure there isn't scriptable content
  // being proxied.
  responseInit.headers["X-Content-Type-Options"] = "nosniff";

  return responseInit;
};
