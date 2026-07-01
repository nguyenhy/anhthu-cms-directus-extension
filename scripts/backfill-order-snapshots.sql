-- One-time backfill for orders created before the `_at_purchase` snapshot
-- columns existed. Populates them from current live template state.
-- These are best-effort approximations, not verified original purchase
-- prices — there is no `backfilled` flag column on `order` today; if you
-- want that distinction later, add one and set it in this same UPDATE.
--
-- Run once: psql "$DATABASE_URL" -f scripts/backfill-order-snapshots.sql

UPDATE "order" o
SET
  price_at_purchase = tp.price,
  currency_at_purchase = tp.currency,
  template_name_at_purchase = t.name,
  discount_amount_at_purchase = 0,
  coupon_code_at_purchase = NULL
FROM template t
JOIN template_product tp ON tp.id = t.product
WHERE o.template = t.id
  AND o.price_at_purchase IS NULL;
