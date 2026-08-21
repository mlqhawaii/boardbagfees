BoardBagFees Baggage Handling + Damage Reports v1

WHAT THIS ADDS
- Traveler form fields for board/bag outcome: no issue, minor damage, significant damage, broken board, delayed bag, lost bag.
- Optional baggage-claim filed + claim outcome + damage/claim details.
- Moderation queue shows those fields before approval.
- Approved outcome reports are aggregated by airline and shown beneath the existing Baggage Handling data.
- New /baggage-handling methodology page explaining U.S. DOT, SITA, IATA, UK CAA and BoardBagFees community data.
- Existing U.S. DOT baggage handling information remains intact.

IMPORTANT DEPLOY ORDER
1. In Supabase SQL Editor, run BoardBagFees_Baggage_Damage_Migration_v1.sql ONCE.
2. Deploy this ZIP to Vercel Preview.
3. Submit one test traveler report with a baggage outcome.
4. Open /admin/reviews and verify the new baggage fields appear; approve the test.
5. Refresh the homepage and confirm the Baggage Handling cell shows a community count for that airline.
6. Check /baggage-handling.
7. Only then deploy --prod.

NOTES
- No new Vercel environment variables are required.
- Existing traveler reviews remain valid; their new fields will simply be null until a traveler supplies them.
- Community statistics include only approved reports that have baggage_outcome set.
- International SITA/IATA figures are context, not falsely presented as airline-specific rankings.
