import { randomUUID } from "node:crypto";
import path from "node:path";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";

export const DOCUMENTS_ROOT = path.resolve(process.cwd(), "storage", "claim-documents");

function isPathInsideRoot(targetPath: string) {
  const resolved = path.resolve(targetPath);
  const relative = path.relative(DOCUMENTS_ROOT, resolved);

  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function saveClaimDocument(claimId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${randomUUID()}-${sanitized}`;
  const claimDirectory = path.join(DOCUMENTS_ROOT, claimId);
  const targetPath = path.join(claimDirectory, fileName);

  await mkdir(claimDirectory, { recursive: true });
  await writeFile(targetPath, buffer);

  return {
    fileName: file.name,
    filePath: targetPath,
    fileType: file.type || "application/octet-stream",
  };
}

export async function readStoredDocument(absolutePath: string) {
  if (!isPathInsideRoot(absolutePath)) {
    throw new Error("Invalid document path.");
  }

  const [buffer, info] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
  return { buffer, info };
}
