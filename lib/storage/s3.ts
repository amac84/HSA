import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { S3_CONFIG } from "@/lib/config";
import type {
  GetObjectResult,
  PutObjectInput,
  PutObjectResult,
  StorageProvider,
} from "@/lib/storage/types";

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) {
    return Buffer.alloc(0);
  }

  // Node.js readable stream path.
  const maybeStream = body as {
    transformToByteArray?: () => Promise<Uint8Array>;
    [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array>;
  };

  if (typeof maybeStream.transformToByteArray === "function") {
    const bytes = await maybeStream.transformToByteArray();
    return Buffer.from(bytes);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export class S3StorageProvider implements StorageProvider {
  readonly name = "s3" as const;
  private client: S3Client;
  private bucket: string;

  constructor() {
    if (!S3_CONFIG.bucket) {
      throw new Error("S3_BUCKET is required when STORAGE_PROVIDER=s3.");
    }

    this.bucket = S3_CONFIG.bucket;
    this.client = new S3Client({
      region: S3_CONFIG.region,
      endpoint: S3_CONFIG.endpoint,
      forcePathStyle: Boolean(S3_CONFIG.endpoint),
      credentials:
        S3_CONFIG.accessKeyId && S3_CONFIG.secretAccessKey
          ? {
              accessKeyId: S3_CONFIG.accessKeyId,
              secretAccessKey: S3_CONFIG.secretAccessKey,
            }
          : undefined,
    });
  }

  async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    return { key: input.key };
  }

  async getObject(key: string): Promise<GetObjectResult> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const buffer = await streamToBuffer(response.Body);

    return {
      buffer,
      contentType: response.ContentType ?? "application/octet-stream",
      contentLength: response.ContentLength ?? buffer.length,
    };
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string | null> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
