# Couple Mode V1 - Test Cases

## Access control
1. User without auth visits `/app/couples`:
   - page should not crash.
   - API returns unauthorized and UI shows a safe error state.
2. Authenticated user with no `couples` row:
   - UI shows "Not in Couple Mode yet".
   - no prompt/check-in/love-note submit controls appear.
3. Authenticated user in `couples` with `status='confirmed'`:
   - Couple Mode content loads.

## Couple-only behavior
1. Couple page should not show discovery/swipe/daily match browse CTAs.
2. Couple page should only show:
   - Today’s Prompt
   - Weekly Check-In
   - Love Notes
   - Shared Memory Timeline

## Today’s Prompt
1. When current user has not answered:
   - prompt input is shown.
   - partner answer is not shown yet.
2. After submit:
   - user answer appears.
   - status changes to waiting/complete based on partner response.

## Weekly Check-In
1. User can submit:
   - connected score (1-5)
   - felt good text
   - want more text
2. Submission should save and render safely.

## Love Notes
1. User submits a short note:
   - note appears in love notes list.
   - note also appears in timeline.
2. Empty note submission should be blocked.

## Timeline
1. Timeline renders without crashing.
2. Timeline includes:
   - completed prompt/check-in entries
   - love note entries

## Safety compatibility
1. If pair is blocked/unmatched:
   - Couple Mode APIs should return unavailable state.
   - page should not crash.

## Regression checks
1. Login flow still works.
2. Onboarding flow still works.
3. Photo upload flow still works.
4. Messaging pages still work.
5. Existing matches/discover routes still work.
