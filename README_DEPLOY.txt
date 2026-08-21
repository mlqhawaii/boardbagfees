BOARD BAG FEES — RATING SORT FIX

What changed:
- Airlines are ranked by surf_rating_score DESC (5 first, then 4, 3, 2, 1, 0).
- Existing sort_rank is now only a tie-breaker within the same score.
- The visible Rank column is recalculated from the actual rating order.
- Rating color is driven by the numeric score, not text/emoji.

Deploy from Terminal after unzipping:

cd ~/Downloads/BoardBagFees_Vercel_Rating_Sort_Fix
npx vercel@latest link
npx vercel@latest --prod

When Vercel asks which project, choose the existing project: boardbagfees


This version restores the simple graduated rating lights: greens -> yellow -> reds, with no mixed-color light strings.
