-- Flags orders whose snapshotted purchase price no longer matches the
-- template's current live price — i.e. the template was repriced after
-- the order was placed. Read-only, informational.
--
-- Run: psql "$DATABASE_URL" -f scripts/report-price-drift.sql

SELECT
  o.order_id,
  o.slug,
  t.name AS template_name,
  o.price_at_purchase AS paid,
  tp.price AS current_price,
  tp.price - o.price_at_purchase AS drift
FROM "order" o
JOIN template t ON t.id = o.template
JOIN template_product tp ON tp.id = t.product
WHERE o.price_at_purchase IS NOT NULL
  AND tp.price <> o.price_at_purchase
ORDER BY drift DESC;
