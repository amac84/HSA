import type { StorageProviderName } from "@/lib/config";

export type PutObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type PutObjectResult = {
  key: string;
};

export type GetObjectResult = {
  buffer: Buffer;
  contentType: string;
  contentLength: number;
};

export interface StorageProvider {
  readonly name: StorageProviderName;
  putObject(input: PutObjectInput): Promise<PutObjectResult>;
  getObject(key: string): Promise<GetObjectResult>;
  /**
   * Returns a short-lived signed download URL when supported by the provider,
   * or null when the provider cannot generate one (e.g. local disk).
   */
  getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string | null>;
  deleteObject(key: string): Promise<void>;
}

export function buildClaimDocumentKey(claimId: string, fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniquePart = `${Date.now()}-${crypto.randomUUID()}`;
  return `claims/${claimId}/${uniquePart}-${sanitized}`;
}
