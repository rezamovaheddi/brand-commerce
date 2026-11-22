-- N10 (custom-order brief fields) + B3 (application attachments)
ALTER TABLE "Rfq" ADD COLUMN "targetMarket" TEXT;
ALTER TABLE "Rfq" ADD COLUMN "packaging" TEXT;
ALTER TABLE "Rfq" ADD COLUMN "requestedDeliveryDate" TIMESTAMP(3);
ALTER TABLE "Rfq" ADD COLUMN "confidentiality" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ApplicationAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "dataBytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ApplicationAttachment_applicationId_idx" ON "ApplicationAttachment"("applicationId");
ALTER TABLE "ApplicationAttachment" ADD CONSTRAINT "ApplicationAttachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "B2BApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
