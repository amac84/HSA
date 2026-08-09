import { STORAGE_PROVIDER } from "@/lib/config";
import { LocalStorageProvider } from "@/lib/storage/local";
import { S3StorageProvider } from "@/lib/storage/s3";
import type { StorageProvider } from "@/lib/storage/types";

declare global {
  var __storageProvider: StorageProvider | undefined;
}

function createStorageProvider(): StorageProvider {
  if (STORAGE_PROVIDER === "s3") {
    return new S3StorageProvider();
  }

  return new LocalStorageProvider();
}

export function getStorageProvider(): StorageProvider {
  if (!globalThis.__storageProvider) {
    globalThis.__storageProvider = createStorageProvider();
  }

  return globalThis.__storageProvider;
}

export type { StorageProvider } from "@/lib/storage/types";
export { buildClaimDocumentKey } from "@/lib/storage/types";
