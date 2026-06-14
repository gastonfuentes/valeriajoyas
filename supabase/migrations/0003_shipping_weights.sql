-- ============================================================================
-- valeria joyas — 0003 shipping weights
--
-- Stage 5 (Shipping) uses a fixed store weight model instead of per-variant
-- weights: silver jewelry is featherweight (3-20 g) but AR carriers bill a
-- 0.5-1 kg minimum, so a real per-item weight almost never changes the quote.
--
--   * default_item_weight_grams — assumed weight of a single catalog item
--   * packaging_weight_grams    — box + padding added once per shipment
--
-- Billable weight = (item_count * default_item_weight_grams) + packaging,
-- then floored to the carrier minimum and rounded to the carrier weight grid
-- (see src/lib/shipping/quote.ts).
-- ============================================================================
alter table public.store_settings
  add column default_item_weight_grams integer not null default 30
    check (default_item_weight_grams >= 0),
  add column packaging_weight_grams    integer not null default 100
    check (packaging_weight_grams >= 0);
