-- N10/N12 (OEM itemKind) + B3 (RFQ attachments, MVP-lite bytes-in-DB storage)
ALTER TABLE "RfqItem" ADD COLUMN "itemKind" TEXT NOT NULL DEFAULT 'CATALOG';
ALTER TABLE "RfqItem" ADD COLUMN "specNote" TEXT;

CREATE TABLE "RfqAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfqId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "dataBytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "RfqAttachment_rfqId_idx" ON "RfqAttachment"("rfqId");
ALTER TABLE "RfqAttachment" ADD CONSTRAINT "RfqAttachment_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
