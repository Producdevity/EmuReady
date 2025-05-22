-- CreateTable
CREATE TABLE "ListingCustomFieldValue" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "customFieldDefinitionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingCustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingCustomFieldValue_listingId_idx" ON "ListingCustomFieldValue"("listingId");

-- CreateIndex
CREATE INDEX "ListingCustomFieldValue_customFieldDefinitionId_idx" ON "ListingCustomFieldValue"("customFieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingCustomFieldValue_listingId_customFieldDefinitionId_key" ON "ListingCustomFieldValue"("listingId", "customFieldDefinitionId");

-- AddForeignKey
ALTER TABLE "ListingCustomFieldValue" ADD CONSTRAINT "ListingCustomFieldValue_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingCustomFieldValue" ADD CONSTRAINT "ListingCustomFieldValue_customFieldDefinitionId_fkey" FOREIGN KEY ("customFieldDefinitionId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
