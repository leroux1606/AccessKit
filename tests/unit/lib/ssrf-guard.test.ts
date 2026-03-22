import { assertSafeFetchUrl, SsrfError } from "@/lib/ssrf-guard";

describe("assertSafeFetchUrl", () => {
  // ─── Allowed URLs ───────────────────────────────────────────────────────────

  it("allows public HTTPS URLs", () => {
    expect(() => assertSafeFetchUrl("https://example.com")).not.toThrow();
  });

  it("allows public HTTP URLs", () => {
    expect(() => assertSafeFetchUrl("http://example.com")).not.toThrow();
  });

  it("allows HTTPS URLs with paths and query strings", () => {
    expect(() =>
      assertSafeFetchUrl("https://mysite.com/page?foo=bar"),
    ).not.toThrow();
  });

  it("returns the parsed URL for valid addresses", () => {
    const url = assertSafeFetchUrl("https://example.com/path");
    expect(url.hostname).toBe("example.com");
    expect(url.pathname).toBe("/path");
  });

  // ─── Localhost / loopback ───────────────────────────────────────────────────

  it("blocks localhost hostname", () => {
    expect(() => assertSafeFetchUrl("http://localhost")).toThrow(SsrfError);
    expect(() => assertSafeFetchUrl("http://localhost:8080")).toThrow(SsrfError);
  });

  it("blocks 127.0.0.1 loopback", () => {
    expect(() => assertSafeFetchUrl("http://127.0.0.1")).toThrow(SsrfError);
    expect(() => assertSafeFetchUrl("http://127.0.0.1:3000")).toThrow(SsrfError);
  });

  it("blocks other 127.x.x.x loopback addresses", () => {
    expect(() => assertSafeFetchUrl("http://127.1.2.3")).toThrow(SsrfError);
  });

  // ─── Private ranges ─────────────────────────────────────────────────────────

  it("blocks 10.x.x.x private range", () => {
    expect(() => assertSafeFetchUrl("http://10.0.0.1")).toThrow(SsrfError);
    expect(() => assertSafeFetchUrl("http://10.255.255.255")).toThrow(SsrfError);
  });

  it("blocks 192.168.x.x private range", () => {
    expect(() => assertSafeFetchUrl("http://192.168.0.1")).toThrow(SsrfError);
    expect(() => assertSafeFetchUrl("http://192.168.1.100")).toThrow(SsrfError);
  });

  it("blocks 172.16-31 private range", () => {
    expect(() => assertSafeFetchUrl("http://172.16.0.1")).toThrow(SsrfError);
    expect(() => assertSafeFetchUrl("http://172.20.1.1")).toThrow(SsrfError);
    expect(() => assertSafeFetchUrl("http://172.31.255.255")).toThrow(SsrfError);
  });

  it("allows 172.32.x.x (just outside the private range)", () => {
    expect(() => assertSafeFetchUrl("http://172.32.0.1")).not.toThrow();
  });

  it("allows 172.15.x.x (below the private range)", () => {
    expect(() => assertSafeFetchUrl("http://172.15.0.1")).not.toThrow();
  });

  // ─── Link-local and metadata ────────────────────────────────────────────────

  it("blocks 169.254.x.x link-local range", () => {
    expect(() => assertSafeFetchUrl("http://169.254.0.1")).toThrow(SsrfError);
  });

  it("blocks the AWS/GCP/Azure metadata endpoint (169.254.169.254)", () => {
    expect(() =>
      assertSafeFetchUrl("http://169.254.169.254/latest/meta-data/"),
    ).toThrow(SsrfError);
  });

  it("blocks by hostname (metadata.google.internal)", () => {
    expect(() =>
      assertSafeFetchUrl("http://metadata.google.internal/computeMetadata/v1/"),
    ).toThrow(SsrfError);
  });

  // ─── Protocol blocking ──────────────────────────────────────────────────────

  it("blocks file:// protocol", () => {
    expect(() => assertSafeFetchUrl("file:///etc/passwd")).toThrow();
  });

  it("blocks ftp:// protocol", () => {
    expect(() => assertSafeFetchUrl("ftp://example.com")).toThrow(SsrfError);
  });

  it("blocks javascript: protocol", () => {
    expect(() => assertSafeFetchUrl("javascript:alert(1)")).toThrow();
  });

  // ─── Invalid URLs ───────────────────────────────────────────────────────────

  it("throws for completely invalid URLs", () => {
    expect(() => assertSafeFetchUrl("not-a-url")).toThrow();
    expect(() => assertSafeFetchUrl("")).toThrow();
  });

  it("throws for relative URLs", () => {
    expect(() => assertSafeFetchUrl("/relative/path")).toThrow();
  });

  // ─── Error type ─────────────────────────────────────────────────────────────

  it("throws SsrfError (not a generic Error) for blocked hosts", () => {
    let caughtError: unknown;
    try {
      assertSafeFetchUrl("http://10.0.0.1");
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeInstanceOf(SsrfError);
    expect((caughtError as SsrfError).name).toBe("SsrfError");
  });
});
