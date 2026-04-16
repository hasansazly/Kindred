# Vinculo V1 Matching Test Cases

## Hard Filters
1. Relationship intent mismatch
- Given user intent is `relationship` and candidate intent is `casual` only
- When `getTodayMatches` runs
- Then candidate is excluded.

2. Age preference mismatch (both ways)
- Given candidate age is outside user preferred min/max OR user age outside candidate preferred min/max
- Then candidate is excluded.

3. Distance mismatch (both ways)
- Given candidate distance is greater than either side max distance preference
- Then candidate is excluded.

4. Direct dealbreaker collision
- Given user or candidate has dealbreaker map rejecting the other side smoking/drinking/kids value
- Then candidate is excluded.

## Quality Gates
5. Incomplete profile filtered
- Given candidate onboarding is incomplete OR profile completeness < 0.7 OR no photos
- Then candidate is excluded.

6. Must have 3 honest reasons
- Given computed explanation yields fewer than 3 reasons >= 60 signal score
- Then candidate is excluded.

## Scoring + Tier Rules
7. Free threshold
- Given compatibility score is 64
- Then candidate is excluded for `free` tier.

8. Paid threshold
- Given compatibility score is 54 and explanation has 3 reasons
- Then candidate can pass for `paid` tier and is labeled `exploratory`.

9. Explanation source integrity
- Given ranking bonuses apply (completeness/mutual/recency)
- Then explanation reasons do not change from raw overlap breakdown.

10. Ranking bonuses
- Given two candidates with same compatibility score
- And one has completeness > 0.85 or mutual queue
- Then higher ranking score candidate appears first.

## Feed Hygiene
11. Recent show suppression and no duplicate in 30 days
- Given candidate appears in shown history within 30 days
- Then candidate is excluded.
- Given candidate appears within 31-60 days
- Then candidate can be considered with recency penalty.

12. Block filtering
- Given user blocked candidate or candidate blocked user
- Then candidate is excluded.

13. Report filtering
- Given any report exists between user and candidate
- Then candidate is excluded.

## Output Rules
14. Limits by tier
- Free returns maximum 3 candidates.
- Paid returns maximum 6 candidates.

15. Persistence behavior
- Running `runMatchmaking` saves recommendations and writes shown history entries for returned candidates.
