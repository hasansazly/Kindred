# AI Pre-Date Briefing - Test Cases

## Access control
1. Unmatched user should not see briefing section content.
2. One-sided match should show unavailable/locked state.
3. Mutual match should show briefing card.

## Reliability
1. Remove `OPENAI_API_KEY` and verify page still works (fallback briefing or unavailable state, no crash).
2. Set `AI_PRE_DATE_BRIEFING_ENABLED=false` and verify feature hides gracefully.
3. Simulate malformed model output and verify safe fallback rendering.

## UX states
1. Loading state visible while generating.
2. Error state visible on API failure.
3. Success state shows structured sections.
4. Empty/unavailable state does not block match/chat flow.

## Regression checks
1. Match detail route still renders.
2. Message flow still works via "Message This Match".
3. Onboarding, login, profile upload routes unaffected.
