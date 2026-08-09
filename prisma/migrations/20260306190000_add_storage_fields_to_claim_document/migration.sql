-- AlterTable: make filePath optional and add storage provider/key fields
ALTER TABLE "ClaimDocument" ALTER COLUMN "filePath" DROP NOT NULL;
ALTER TABLE "ClaimDocument" ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "ClaimDocument" ADD COLUMN "storageKey" TEXT;
