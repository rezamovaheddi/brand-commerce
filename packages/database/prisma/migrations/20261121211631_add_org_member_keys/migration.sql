-- N16: operator-issued organization member access keys (bootstrap access
-- control; replaced by real Identity credentials in P7). Only the SHA-256
-- hash of each key is stored. Plus an orgId index for org-scoped RFQ reads.
ALTER TABLE "OrganizationMembership" ADD COLUMN "email" TEXT;
ALTER TABLE "OrganizationMembership" ADD COLUMN "keyHash" TEXT;
ALTER TABLE "OrganizationMembership" ADD COLUMN "keyLast4" TEXT;
ALTER TABLE "OrganizationMembership" ADD COLUMN "keyRevokedAt" TIMESTAMP(3);
ALTER TABLE "OrganizationMembership" ADD COLUMN "lastUsedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "OrganizationMembership_keyHash_key" ON "OrganizationMembership"("keyHash");
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_email_key" ON "OrganizationMembership"("organizationId", "email");
CREATE INDEX "OrganizationMembership_email_idx" ON "OrganizationMembership"("email");
CREATE INDEX "Rfq_orgId_idx" ON "Rfq"("orgId");
