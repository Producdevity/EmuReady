-- noinspection SqlResolve
-- Computes vote statistics per author (total votes, downvote ratio, 24h volume)
-- across both handheld and PC listing votes.
-- $1: authorIds (text[]) — inferred by TypedSQL from ANY usage
-- @param {DateTime} $2:since Date cutoff for recent vote counting

SELECT
  combined."userId",
  SUM(combined.total_votes)::int AS "totalVotes",
  SUM(combined.downvotes)::int AS "downvotes",
  SUM(combined.recent_votes)::int AS "votesLast24h"
FROM (
  SELECT
    v."userId",
    COUNT(*) AS total_votes,
    COUNT(*) FILTER (WHERE v.value = false) AS downvotes,
    COUNT(*) FILTER (WHERE v."createdAt" >= $2) AS recent_votes
  FROM "Vote" v
  WHERE v."userId" = ANY($1)
    AND v."nullifiedAt" IS NULL
  GROUP BY v."userId"

  UNION ALL

  SELECT
    pv."userId",
    COUNT(*) AS total_votes,
    COUNT(*) FILTER (WHERE pv.value = false) AS downvotes,
    COUNT(*) FILTER (WHERE pv."createdAt" >= $2) AS recent_votes
  FROM "pc_listing_votes" pv
  WHERE pv."userId" = ANY($1)
    AND pv."nullifiedAt" IS NULL
  GROUP BY pv."userId"
) combined
GROUP BY combined."userId"
