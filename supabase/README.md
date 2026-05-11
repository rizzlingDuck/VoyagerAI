# Supabase Setup

Apply migrations with the Supabase CLI from the repo root:

```sh
supabase db push
```

The `trips` table is protected with row-level security. Users can only select, insert, update, and delete rows where `user_id = auth.uid()`.

The frontend hook at `frontend/src/hooks/useSavedTrips.js` expects:

- table: `public.trips`
- selected columns: `id`, `destination`, `saved_at`, `itinerary`
- sorted by `saved_at desc`

The itinerary JSON contract is documented in `docs/itinerary-json-contract.md`.
