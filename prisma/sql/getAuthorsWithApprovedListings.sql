-- noinspection SqlResolve
-- Finds which authors have at least one approved listing across both
-- handheld and PC listing types.
-- $1: authorIds (text[]) — inferred by TypedSQL from ANY usage

SELECT DISTINCT combined."authorId"
FROM (
  SELECT "authorId" FROM "Listing"
  WHERE "authorId" = ANY($1)
    AND status = 'APPROVED'

  UNION ALL

  SELECT "authorId" FROM "pc_listings"
  WHERE "authorId" = ANY($1)
    AND status = 'APPROVED'
) combined
