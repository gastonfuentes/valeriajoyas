-- ============================================================================
-- valeria joyas — seed data (sample silver jewelry catalog)
-- Run with:  supabase db reset   (applies migrations + this seed)
-- ============================================================================

-- ---------- store settings (singleton) ----------
insert into public.store_settings
  (id, store_name, currency, free_shipping_threshold, pickup_enabled,
   origin_postal_code, contact_email, contact_phone, origin_address)
values
  (1, 'valeria joyas', 'ARS', 5000000, true, '1425',
   'hola@valeriajoyas.com', '+54 9 11 5555-0000',
   jsonb_build_object('street','Av. Santa Fe','number','1234','city','CABA',
                      'province','Buenos Aires','postal_code','1425','country','AR'))
on conflict (id) do nothing;

-- ---------- categories ----------
insert into public.categories (name, slug, description, position) values
  ('Anillos',  'anillos',  'Anillos de plata 925',            1),
  ('Collares', 'collares', 'Collares y cadenas de plata 925', 2),
  ('Pulseras', 'pulseras', 'Pulseras de plata 925',           3),
  ('Aros',     'aros',     'Aros de plata 925',               4),
  ('Dijes',    'dijes',    'Dijes de plata 925',              5)
on conflict (slug) do nothing;

-- ---------- products (prices in centavos ARS) ----------
insert into public.products
  (name, slug, summary, description, base_price, compare_at_price, status, is_featured) values
  ('Anillo Solitario',          'anillo-solitario',  'Solitario minimalista en plata 925',
   'Anillo solitario de plata 925 con cubic de talla brillante. Diseño atemporal para el uso diario.',
   1899000, 2199000, 'active', true),
  ('Anillo Hilo',               'anillo-hilo',       'Anillo hilo finito en plata 925',
   'Anillo tipo hilo, ultra liviano. Ideal para combinar apilado.',
   1299000, null, 'active', false),
  ('Collar Cadena Forzada 45cm','collar-forzada-45', 'Cadena forzada de 45 cm en plata 925',
   'Cadena forzada clásica de 45 cm. Cierre reforzado.',
   2450000, null, 'active', true),
  ('Collar Dije Luna',          'collar-dije-luna',  'Collar con dije de luna en plata 925',
   'Collar de 42 cm con dije de luna creciente.',
   1990000, 2290000, 'active', false),
  ('Pulsera Esclava Lisa',      'pulsera-esclava',   'Esclava lisa en plata 925',
   'Pulsera esclava de superficie pulida espejo. Ajustable.',
   1750000, null, 'active', true),
  ('Pulsera Cadena Rolo',       'pulsera-rolo',      'Pulsera cadena rolo en plata 925',
   'Pulsera de eslabón rolo, 18 cm con extensor.',
   1590000, null, 'active', false),
  ('Aros Argolla 12mm',         'aros-argolla-12',   'Argollas de 12 mm en plata 925',
   'Argollas lisas de 12 mm, cierre a presión.',
   1290000, null, 'active', true),
  ('Aros Punto de Luz',         'aros-punto-luz',    'Aros punto de luz en plata 925',
   'Aros pequeños con cubic. Cierre con tuerca de seguridad.',
   1490000, null, 'active', false),
  ('Dije Corazón',              'dije-corazon',      'Dije corazón en plata 925',
   'Dije de corazón liso, 12 mm. Combinable con cualquier cadena.',
    990000, null, 'active', false)
on conflict (slug) do nothing;

-- ---------- product <-> category links ----------
insert into public.product_categories (product_id, category_id)
select p.id, c.id
from public.products p
join public.categories c on c.slug = (
  case
    when p.slug in ('anillo-solitario','anillo-hilo')       then 'anillos'
    when p.slug in ('collar-forzada-45','collar-dije-luna') then 'collares'
    when p.slug in ('pulsera-esclava','pulsera-rolo')       then 'pulseras'
    when p.slug in ('aros-argolla-12','aros-punto-luz')     then 'aros'
    when p.slug in ('dije-corazon')                         then 'dijes'
  end
)
on conflict do nothing;

-- ---------- variants: rings get sizes (talles) ----------
insert into public.product_variants (product_id, sku, name, attributes, position)
select p.id,
       'VJ-' || upper(replace(p.slug,'-','')) || '-' || t.talle,
       'Talle ' || t.talle,
       jsonb_build_object('talle', t.talle, 'material', 'Plata 925'),
       t.pos
from public.products p
cross join (values ('14',1),('16',2),('18',3)) as t(talle, pos)
where p.slug in ('anillo-solitario','anillo-hilo')
on conflict (sku) do nothing;

-- ---------- variants: everything else is single ("Único") ----------
insert into public.product_variants (product_id, sku, name, attributes, position)
select p.id,
       'VJ-' || upper(replace(p.slug,'-','')),
       'Único',
       jsonb_build_object('material', 'Plata 925'),
       1
from public.products p
where p.slug not in ('anillo-solitario','anillo-hilo')
on conflict (sku) do nothing;

-- ---------- inventory: 25 each, a couple low for the dashboard demo ----------
insert into public.inventory (variant_id, quantity, low_stock_threshold)
select id, 25, 3 from public.product_variants
on conflict (variant_id) do nothing;

update public.inventory set quantity = 2
where variant_id in (
  select id from public.product_variants
  where sku in ('VJ-ANILLOSOLITARIO-18', 'VJ-AROSARGOLLA12')
);

-- ---------- welcome coupon ----------
insert into public.coupons (code, description, type, value, min_order, is_active)
values ('BIENVENIDA10', '10% de descuento en tu primera compra', 'percent', 10, 0, true)
on conflict (code) do nothing;
