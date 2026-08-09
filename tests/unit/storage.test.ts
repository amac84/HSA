import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildClaimDocumentKey } from "@/lib/storage/types";
import { LocalStorageProvider } from "@/lib/storage/local";

describe("buildClaimDocumentKey", () => {
  it("namespaces by claim id and sanitizes the file name", () => {
    const key = buildClaimDocumentKey("claim_123", "My Receipt (final).pdf");

    expect(key.startsWith("claims/claim_123/")).toBe(true);
    // No spaces or parentheses should remain in the sanitized suffix.
    expect(key).not.toMatch(/[()\s]/);
    expect(key.endsWith("My_Receipt__final_.pdf")).toBe(true);
  });

  it("produces unique keys for the same file name", () => {
    const a = buildClaimDocumentKey("claim_1", "receipt.pdf");
    const b = buildClaimDocumentKey("claim_1", "receipt.pdf");

    expect(a).not.toEqual(b);
  });
});

describe("LocalStorageProvider", () => {
  const provider = new LocalStorageProvider();
  const keys: string[] = [];

  afterEach(async () => {
    await Promise.all(keys.map((key) => provider.deleteObject(key)));
    keys.length = 0;
  });

  it("stores and retrieves an object", async () => {
    const key = buildClaimDocumentKey("claim_local", "note.txt");
    keys.push(key);

    await provider.putObject({ key, body: Buffer.from("hello world"), contentType: "text/plain" });
    const result = await provider.getObject(key);

    expect(result.buffer.toString()).toBe("hello world");
    expect(result.contentLength).toBe(11);
  });

  it("does not support signed URLs", async () => {
    const url = await provider.getSignedDownloadUrl("claims/x/y", 60);
    expect(url).toBeNull();
  });

  it("rejects keys that traverse outside the storage root", async () => {
    await expect(provider.getObject("../../etc/passwd")).rejects.toThrow("Invalid storage key.");
  });
});

describe("resolveClaimDocument", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns a redirect when the provider supports signed URLs", async () => {
    vi.doMock("@/lib/storage", () => ({
      getStorageProvider: () => ({
        name: "s3",
        getSignedDownloadUrl: vi.fn().mockResolvedValue("https://signed.example/doc"),
        getObject: vi.fn(),
        putObject: vi.fn(),
        deleteObject: vi.fn(),
      }),
      buildClaimDocumentKey,
    }));

    const { resolveClaimDocument } = await import("@/lib/documents");
    const resolved = await resolveClaimDocument(
      { storageProvider: "s3", storageKey: "claims/1/file.pdf", filePath: null },
      300,
    );

    expect(resolved).toEqual({ kind: "redirect", url: "https://signed.example/doc" });
  });

  it("streams a buffer when signed URLs are unavailable", async () => {
    vi.doMock("@/lib/storage", () => ({
      getStorageProvider: () => ({
        name: "local",
        getSignedDownloadUrl: vi.fn().mockResolvedValue(null),
        getObject: vi.fn().mockResolvedValue({
          buffer: Buffer.from("bytes"),
          contentType: "application/octet-stream",
          contentLength: 5,
        }),
        putObject: vi.fn(),
        deleteObject: vi.fn(),
      }),
      buildClaimDocumentKey,
    }));

    const { resolveClaimDocument } = await import("@/lib/documents");
    const resolved = await resolveClaimDocument(
      { storageProvider: "local", storageKey: "claims/1/file.pdf", filePath: null },
      300,
    );

    expect(resolved.kind).toBe("buffer");
    if (resolved.kind === "buffer") {
      expect(resolved.buffer.toString()).toBe("bytes");
    }
  });
});
