/**
 * SSRF (Server-Side Request Forgery) protection.
 * Blocks server-initiated requests to private/internal IP ranges, localhost,
 * and cloud metadata services before any outbound fetch is made.
 */

const PRIVATE_IP_PATTERNS = [
  /^127\./,                                        // 127.0.0.0/8 loopback
  /^10\./,                                         // 10.0.0.0/8 private
  /^172\.(1[6-9]|2\d|3[01])\./,                   // 172.16.0.0/12 private
  /^192\.168\./,                                   // 192.168.0.0/16 private
  /^169\.254\./,                                   // 169.254.0.0/16 link-local
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d|12[0-7])\./,   // 100.64.0.0/10 shared
  /^0\./,                                          // 0.0.0.0/8 current-network
  /^::1$/,                                         // IPv6 loopback
  /^fc[0-9a-f]{2}:/i,                             // IPv6 unique local fc00::/7
  /^fe[89ab][0-9a-f]:/i,                          // IPv6 link-local fe80::/10
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "169.254.169.254",           // AWS / GCP / Azure / DigitalOcean metadata
  "metadata.google.internal",  // GCP metadata
  "100.100.100.200",           // Alibaba Cloud metadata
  "192.0.0.192",               // Oracle Cloud metadata
]);

export class SsrfError extends Error {
  constructor(hostname: string) {
    super(`Blocked request to private/internal host: ${hostname}`);
    this.name = "SsrfError";
  }
}

/**
 * Validates that a URL is safe to fetch server-side.
 * Returns the parsed URL if safe; throws SsrfError otherwise.
 */
export function assertSafeFetchUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  const { hostname, protocol } = parsed;

  // Only allow HTTP/HTTPS — block file://, ftp://, etc.
  if (protocol !== "http:" && protocol !== "https:") {
    throw new SsrfError(hostname);
  }

  const lower = hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(lower)) {
    throw new SsrfError(hostname);
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(lower)) {
      throw new SsrfError(hostname);
    }
  }

  return parsed;
}
