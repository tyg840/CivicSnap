import dotenv from "dotenv";

dotenv.config();

type Open311Environment = "test" | "production";

const DISCOVERY_URL = "https://secure.toronto.ca/open311test/discovery.json";
const ENDPOINTS: Record<Open311Environment, string> = {
  test: "https://secure.toronto.ca/open311test/ws",
  production: "https://secure.toronto.ca/webwizard/ws",
};
const JURISDICTION_ID = process.env.TORONTO_311_JURISDICTION_ID || "toronto.ca";

const args = process.argv.slice(2);
const command = args.find((arg) => !arg.startsWith("--")) || "payload";
const sendRequested = args.includes("--send");

function getEnvironment(): Open311Environment {
  const value = (process.env.TORONTO_311_ENV || "test").toLowerCase();
  if (value === "production" || value === "prod") return "production";
  return "test";
}

function getEndpoint(): string {
  return process.env.TORONTO_311_ENDPOINT || ENDPOINTS[getEnvironment()];
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env or set it for this command.`);
  }
  return value;
}

async function fetchOpen311(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Open311 request failed with ${response.status} ${response.statusText}: ${text.slice(0, 600)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function appendIfPresent(params: URLSearchParams, name: string, value: string | undefined): void {
  if (value?.trim()) {
    params.set(name, value.trim());
  }
}

function appendAttributes(params: URLSearchParams): void {
  const rawAttributes = process.env.TORONTO_311_ATTRIBUTES;
  if (!rawAttributes) return;

  const attributes = JSON.parse(rawAttributes) as Record<string, string | string[] | number | boolean>;
  for (const [code, value] of Object.entries(attributes)) {
    const key = `attribute[${code}]`;
    if (Array.isArray(value)) {
      for (const item of value) params.append(`${key}[]`, String(item));
    } else {
      params.set(key, String(value));
    }
  }
}

function buildRequestPayload(): URLSearchParams {
  const params = new URLSearchParams();

  params.set("jurisdiction_id", JURISDICTION_ID);
  params.set("service_code", requireEnv("TORONTO_311_SERVICE_CODE"));

  const lat = process.env.TORONTO_311_LAT?.trim();
  const long = process.env.TORONTO_311_LONG?.trim();
  const address = process.env.TORONTO_311_ADDRESS?.trim();
  const addressId = process.env.TORONTO_311_ADDRESS_ID?.trim();

  if (lat && long) {
    params.set("lat", lat);
    params.set("long", long);
  } else if (address) {
    params.set("address_string", address);
  } else if (addressId) {
    params.set("address_id", addressId);
  } else {
    throw new Error("Set TORONTO_311_ADDRESS, TORONTO_311_ADDRESS_ID, or both TORONTO_311_LAT and TORONTO_311_LONG.");
  }

  appendIfPresent(params, "description", process.env.TORONTO_311_DESCRIPTION);
  appendIfPresent(params, "email", process.env.TORONTO_311_EMAIL);
  appendIfPresent(params, "first_name", process.env.TORONTO_311_FIRST_NAME);
  appendIfPresent(params, "last_name", process.env.TORONTO_311_LAST_NAME);
  appendIfPresent(params, "phone", process.env.TORONTO_311_PHONE);
  appendIfPresent(params, "media_url", process.env.TORONTO_311_MEDIA_URL);
  appendAttributes(params);

  return params;
}

function paramsToObject(params: URLSearchParams): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const [key, value] of params.entries()) {
    const existing = result[key];
    if (Array.isArray(existing)) {
      existing.push(value);
    } else if (typeof existing === "string") {
      result[key] = [existing, value];
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function main(): Promise<void> {
  const endpoint = getEndpoint();

  if (command === "discovery") {
    console.log(JSON.stringify(await fetchOpen311(DISCOVERY_URL), null, 2));
    return;
  }

  if (command === "services") {
    const url = new URL(`${endpoint}/services.json`);
    url.searchParams.set("jurisdiction_id", JURISDICTION_ID);
    console.log(JSON.stringify(await fetchOpen311(url.toString()), null, 2));
    return;
  }

  if (command === "definition") {
    const serviceCode = requireEnv("TORONTO_311_SERVICE_CODE");
    const url = new URL(`${endpoint}/services/${encodeURIComponent(serviceCode)}.json`);
    url.searchParams.set("jurisdiction_id", JURISDICTION_ID);
    console.log(JSON.stringify(await fetchOpen311(url.toString()), null, 2));
    return;
  }

  if (command === "payload") {
    const payload = buildRequestPayload();
    console.log(JSON.stringify(paramsToObject(payload), null, 2));
    console.log("\nDry run only. To send, run: bun run open311:test submit --send");
    return;
  }

  if (command === "submit") {
    if (!sendRequested || process.env.TORONTO_311_SEND !== "true") {
      throw new Error("Live submit is blocked. Add --send and set TORONTO_311_SEND=true after reviewing the payload.");
    }
    if (getEnvironment() === "production" && process.env.TORONTO_311_CONFIRM_PRODUCTION !== "true") {
      throw new Error("Production submit is blocked. Set TORONTO_311_CONFIRM_PRODUCTION=true only when you intend to file a real Toronto 311 request.");
    }

    const payload = buildRequestPayload();
    payload.set("api_key", requireEnv("TORONTO_311_API_KEY"));

    const response = await fetchOpen311(`${endpoint}/requests.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: payload,
    });

    console.log(JSON.stringify(response, null, 2));
    return;
  }

  throw new Error(`Unknown command "${command}". Use discovery, services, definition, payload, or submit.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
