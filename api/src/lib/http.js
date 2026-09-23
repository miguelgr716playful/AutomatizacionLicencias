const { getEnv } = require("./env");

function corsHeaders(request) {
  const env = getEnv();
  const origin = request.headers.get("origin") || "";
  const allowOrigin = env.corsOrigins.includes(origin)
    ? origin
    : env.corsOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request, status, body, extraHeaders = {}) {
  return {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(request),
      ...extraHeaders,
    },
    jsonBody: body,
  };
}

function redirect(request, location, extraHeaders = {}) {
  return {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      ...corsHeaders(request),
      ...extraHeaders,
    },
  };
}

function xml(request, status, body) {
  return {
    status,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": 'inline; filename="sp-metadata.xml"',
      ...corsHeaders(request),
    },
    body,
  };
}

function options(request) {
  return {
    status: 204,
    headers: corsHeaders(request),
  };
}

function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf("=");
        if (i === -1) return [part, ""];
        return [
          part.slice(0, i),
          decodeURIComponent(part.slice(i + 1)),
        ];
      })
  );
}

module.exports = {
  corsHeaders,
  json,
  redirect,
  xml,
  options,
  parseCookies,
};
