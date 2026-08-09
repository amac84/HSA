import path from "node:path";
import { mkdir, writeFile, readFile, stat, rm } from "node:fs/promises";

import type {
  GetObjectResult,
  PutObjectInput,
  PutObjectResult,
  StorageProvider,
} from "@/lib/storage/types";

export const LOCAL_STORAGE_ROOT = path.resolve(process.cwd(), "storage", "claim-documents");

function resolveKeyToPath(key: string) {
  // Prevent path traversal: resolve and ensure the result stays within the root.
  const resolved = path.resolve(LOCAL_STORAGE_ROOT, key);
  const relative = path.relative(LOCAL_STORAGE_ROOT, resolved);

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid storage key.");
  }

  return resolved;
}

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;

  async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    const targetPath = resolveKeyToPath(input.key);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, input.body);

    return { key: input.key };
  }

  async getObject(key: string): Promise<GetObjectResult> {
    const targetPath = resolveKeyToPath(key);
    const [buffer, info] = await Promise.all([readFile(targetPath), stat(targetPath)]);

    return {
      buffer,
      contentType: "application/octet-stream",
      contentLength: info.size,
    };
  }

  async getSignedDownloadUrl(_key: string, _expiresInSeconds: number): Promise<string | null> {
    // Local disk cannot generate signed URLs; caller should stream bytes instead.
    void _key;
    void _expiresInSeconds;
    return null;
  }

  async deleteObject(key: string): Promise<void> {
    const targetPath = resolveKeyToPath(key);
    await rm(targetPath, { force: true });
  }
}
