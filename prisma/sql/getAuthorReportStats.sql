-- noinspection SqlResolve
-- Counts active reports (PENDING or UNDER_REVIEW) per author across both
-- handheld and PC listing types.
-- $1: authorIds (text[]) — inferred by TypedSQL from ANY usage

SELECT
  combined."authorId",
  SUM(combined.cnt)::int AS "reportCount"
FROM (
  SELECT l."authorId", COUNT(lr.id)::int AS cnt
  FROM "Listing" l
  INNER JOIN "listing_reports" lr ON lr."listingId" = l.id
  WHERE l."authorId" = ANY($1)
    AND lr.status IN ('PENDING', 'UNDER_REVIEW')
  GROUP BY l."authorId"

  UNION ALL

  SELECT pc."authorId", COUNT(pcr.id)::int AS cnt
  FROM "pc_listings" pc
  INNER JOIN "pc_listing_reports" pcr ON pcr."pcListingId" = pc.id
  WHERE pc."authorId" = ANY($1)
    AND pcr.status IN ('PENDING', 'UNDER_REVIEW')
  GROUP BY pc."authorId"
) combined
GROUP BY combined."authorId"
