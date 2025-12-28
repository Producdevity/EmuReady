-- @param {DateTime} $1:sinceDate? Optional date filter for contributions
-- @param {Int} $2:contributorLimit Maximum number of contributors to return

WITH listing_counts AS (
  SELECT
    l."authorId" as "userId",
    COUNT(*) as count,
    MAX(l."createdAt") as "lastDate"
  FROM "Listing" l
  WHERE l.status IN ('APPROVED', 'PENDING')
    AND ($1::timestamp IS NULL OR l."createdAt" >= $1)
  GROUP BY l."authorId"
),
pc_listing_counts AS (
  SELECT
    pc."authorId" as "userId",
    COUNT(*) as count,
    MAX(pc."createdAt") as "lastDate"
  FROM "pc_listings" pc
  WHERE pc.status IN ('APPROVED', 'PENDING')
    AND ($1::timestamp IS NULL OR pc."createdAt" >= $1)
  GROUP BY pc."authorId"
),
game_counts AS (
  SELECT
    g."submittedBy" as "userId",
    COUNT(*) as count,
    MAX(COALESCE(g."approvedAt", g."submittedAt")) as "lastDate"
  FROM "Game" g
  WHERE g.status != 'REJECTED'
    AND g."submittedBy" IS NOT NULL
    AND ($1::timestamp IS NULL OR g."approvedAt" >= $1 OR (g."approvedAt" IS NULL AND g."submittedAt" >= $1))
  GROUP BY g."submittedBy"
),
active_bans AS (
  SELECT DISTINCT "userId"
  FROM "user_bans"
  WHERE "isActive" = true
    AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
),
combined AS (
  SELECT
    COALESCE(l."userId", pc."userId", g."userId") as "userId",
    COALESCE(l.count, 0)::int as listings,
    COALESCE(pc.count, 0)::int as "pcListings",
    COALESCE(g.count, 0)::int as games,
    (COALESCE(l.count, 0) + COALESCE(pc.count, 0))::int as total,
    GREATEST(l."lastDate", pc."lastDate", g."lastDate") as "lastContributionAt"
  FROM listing_counts l
  FULL OUTER JOIN pc_listing_counts pc ON l."userId" = pc."userId"
  FULL OUTER JOIN game_counts g ON COALESCE(l."userId", pc."userId") = g."userId"
)
SELECT
  c."userId",
  c.listings,
  c."pcListings",
  c.games,
  c.total,
  c."lastContributionAt"
FROM combined c
WHERE c.total > 0
  AND c."userId" NOT IN (SELECT "userId" FROM active_bans)
ORDER BY c.total DESC, c."lastContributionAt" DESC NULLS LAST
LIMIT $2
