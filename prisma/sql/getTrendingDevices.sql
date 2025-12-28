-- noinspection SqlResolve
-- @param {DateTime} $1:sinceDate? Optional date filter for recent listings
-- @param {Int} $2:deviceLimit Maximum number of devices to return

SELECT
  d.id,
  d."modelName",
  b.id as "brandId",
  b.name as "brandName",
  s.manufacturer as "socManufacturer",
  s.name as "socName",
  COUNT(l.id)::int as "listingCount"
FROM "Device" d
INNER JOIN "DeviceBrand" b ON d."brandId" = b.id
LEFT JOIN "SoC" s ON d."socId" = s.id
INNER JOIN "Listing" l ON l."deviceId" = d.id
WHERE l.status = 'APPROVED'
  AND ($1::timestamp IS NULL OR l."createdAt" >= $1)
GROUP BY d.id, b.id, b.name, s.manufacturer, s.name
ORDER BY "listingCount" DESC
LIMIT $2
