import { getStorageProvider, buildClaimDocumentKey } from "@/lib/storage";
import { LOCAL_STORAGE_ROOT, LocalStorageProvider } from "@/lib/storage/local";
import path from "node:path";

export type SavedClaimDocument = {
  fileName: string;
  storageProvider: string;
  storageKey: string;
  fileType: string;
};

export async function saveClaimDocument(claimId: string, file: File): Promise<SavedClaimDocument> {
  const storage = getStorageProvider();
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";
  const key = buildClaimDocumentKey(claimId, file.name);

  await storage.putObject({ key, body: buffer, contentType });

  return {
    fileName: file.name,
    storageProvider: storage.name,
    storageKey: key,
    fileType: contentType,
  };
}

export type ResolvedDocument =
  | { kind: "redirect"; url: string }
  | { kind: "buffer"; buffer: Buffer };

type ClaimDocumentLike = {
  storageProvider: string;
  storageKey: string | null;
  filePath: string | null;
};

/**
 * Resolves a stored document either to a signed redirect URL (when the provider
 * supports it) or to a raw buffer to stream through the app. Handles legacy rows
 * that only have a local `filePath`.
 */
export async function resolveClaimDocument(
  document: ClaimDocumentLike,
  signedUrlTtlSeconds: number,
): Promise<ResolvedDocument> {
  // Legacy records: only a local absolute filePath exists (no storageKey).
  if (!document.storageKey && document.filePath) {
    const legacyKey = toLocalKey(document.filePath);
    const local = new LocalStorageProvider();
    const { buffer } = await local.getObject(legacyKey);
    return { kind: "buffer", buffer };
  }

  if (!document.storageKey) {
    throw new Error("Document has no storage key.");
  }

  const storage = getStorageProvider();
  const signedUrl = await storage.getSignedDownloadUrl(document.storageKey, signedUrlTtlSeconds);

  if (signedUrl) {
    return { kind: "redirect", url: signedUrl };
  }

  const { buffer } = await storage.getObject(document.storageKey);
  return { kind: "buffer", buffer };
}

function toLocalKey(absoluteOrRelativePath: string) {
  const resolved = path.resolve(absoluteOrRelativePath);
  const relative = path.relative(LOCAL_STORAGE_ROOT, resolved);

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid legacy document path.");
  }

  return relative;
}
