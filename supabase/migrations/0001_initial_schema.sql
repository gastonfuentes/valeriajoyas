-- ============================================================================
-- valeria joyas — initial schema (consolidated, final verified state)
--
-- Joyería de plata · e-commerce · Postgres 17 / Supabase
--
-- Conventions:
--   * Money is stored as BIGINT in centavos (ARS minor units). Never floats.
--   * RLS is enabled on every table; clients see only their own rows.
--   * Catalog is public-read (active rows) + admin-write.
--   * Orders/payments are created server-side (service role); clients read only.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto    with schema extensions; -- gen_random_uuid
create extension if not exists pg_trgm     with schema extensions; -- product search
create extension if not exists unaccent    with schema extensions; -- accent-insensitive search
create extension if not exists moddatetime with schema extensions; -- updated_at triggers

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');

create type public.order_status as enum (
  'pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'
);

create type public.payment_status as enum (
  'pending', 'in_process', 'approved', 'rejected', 'refunded', 'cancelled', 'charged_back'
);

create type public.shipment_status as enum (
  'pending', 'ready', 'in_transit', 'delivered', 'returned', 'cancelled'
);

create type public.coupon_type as enum ('percent', 'fixed');

create type public.chat_role as enum ('user', 'assistant', 'system', 'tool');

-- ============================================================================
-- IDENTITY
-- ============================================================================

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  phone      text,
  role       public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Extends auth.users with app profile data and role.';

-- is_admin(): safe admin check used across RLS. SECURITY DEFINER + locked
-- search_path so it reads profiles without RLS recursion. Only inspects the
-- CURRENT caller's role.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- handle_new_user(): auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- prevent_role_change(): block self-promotion to admin. Only regular signed-in
-- users are restricted; service_role and direct DB access (no JWT) may set roles
-- so the first admin can be bootstrapped and server code can manage roles.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if (auth.jwt() ->> 'role') = 'authenticated' and not public.is_admin() then
      raise exception 'Not authorized to change role';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.prevent_role_change() from public, anon, authenticated;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles for select
  to authenticated using ( (select auth.uid()) = id or public.is_admin() );
create policy "profiles_update_own_or_admin" on public.profiles for update
  to authenticated using ( (select auth.uid()) = id or public.is_admin() )
  with check ( (select auth.uid()) = id or public.is_admin() );
-- Inserts happen via the handle_new_user trigger; deletes cascade from auth.users.

-- ---------- addresses ----------
create table public.addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  label          text,
  recipient_name text not null,
  phone          text,
  street         text not null,
  street_number  text,
  apartment      text,
  city           text not null,
  province       text not null,
  postal_code    text not null,
  country        text not null default 'AR',
  notes          text,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses (user_id);
create trigger addresses_set_updated_at before update on public.addresses
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.addresses enable row level security;
create policy "addresses_select_own_or_admin" on public.addresses for select
  to authenticated using ( (select auth.uid()) = user_id or public.is_admin() );
create policy "addresses_insert_own" on public.addresses for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "addresses_update_own" on public.addresses for update
  to authenticated using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );
create policy "addresses_delete_own" on public.addresses for delete
  to authenticated using ( (select auth.uid()) = user_id );

-- ============================================================================
-- CATALOG  (public read of active rows + admin write)
-- ============================================================================

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories (id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index categories_parent_id_idx on public.categories (parent_id);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  summary          text,
  description      text,
  material         text default 'Plata 925',
  base_price       bigint not null check (base_price >= 0),
  compare_at_price bigint check (compare_at_price >= 0),
  currency         text not null default 'ARS',
  status           text not null default 'draft'
                     check (status in ('draft', 'active', 'archived')),
  is_featured      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index products_status_idx    on public.products (status);
create index products_featured_idx  on public.products (is_featured) where is_featured;
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create table public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku        text unique,
  name       text,
  attributes jsonb not null default '{}',
  price      bigint check (price >= 0),
  position   int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_id_idx on public.product_variants (product_id);

create table public.product_categories (
  product_id  uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_categories_category_id_idx on public.product_categories (category_id);

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  variant_id   uuid references public.product_variants (id) on delete set null,
  storage_path text not null,
  alt          text,
  position     int not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);
create index product_images_product_id_idx on public.product_images (product_id);
create index product_images_variant_id_idx on public.product_images (variant_id);

create table public.inventory (
  variant_id          uuid primary key references public.product_variants (id) on delete cascade,
  quantity            int not null default 0 check (quantity >= 0),
  reserved            int not null default 0 check (reserved >= 0),
  low_stock_threshold int not null default 3 check (low_stock_threshold >= 0),
  updated_at          timestamptz not null default now()
);

create trigger categories_set_updated_at before update on public.categories
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger products_set_updated_at before update on public.products
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger product_variants_set_updated_at before update on public.product_variants
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger inventory_set_updated_at before update on public.inventory
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.product_variants   enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images     enable row level security;
alter table public.inventory          enable row level security;

-- categories
create policy "categories_anon_read"   on public.categories for select to anon
  using ( is_active );
create policy "categories_auth_read"   on public.categories for select to authenticated
  using ( is_active or public.is_admin() );
create policy "categories_admin_insert" on public.categories for insert to authenticated
  with check ( public.is_admin() );
create policy "categories_admin_update" on public.categories for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );
create policy "categories_admin_delete" on public.categories for delete to authenticated
  using ( public.is_admin() );

-- products
create policy "products_anon_read"   on public.products for select to anon
  using ( status = 'active' );
create policy "products_auth_read"   on public.products for select to authenticated
  using ( status = 'active' or public.is_admin() );
create policy "products_admin_insert" on public.products for insert to authenticated
  with check ( public.is_admin() );
create policy "products_admin_update" on public.products for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );
create policy "products_admin_delete" on public.products for delete to authenticated
  using ( public.is_admin() );

-- product_variants
create policy "variants_anon_read"   on public.product_variants for select to anon
  using ( is_active );
create policy "variants_auth_read"   on public.product_variants for select to authenticated
  using ( is_active or public.is_admin() );
create policy "variants_admin_insert" on public.product_variants for insert to authenticated
  with check ( public.is_admin() );
create policy "variants_admin_update" on public.product_variants for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );
create policy "variants_admin_delete" on public.product_variants for delete to authenticated
  using ( public.is_admin() );

-- product_categories
create policy "product_categories_public_read" on public.product_categories for select
  to anon, authenticated using ( true );
create policy "product_categories_admin_insert" on public.product_categories for insert to authenticated
  with check ( public.is_admin() );
create policy "product_categories_admin_delete" on public.product_categories for delete to authenticated
  using ( public.is_admin() );

-- product_images
create policy "product_images_public_read" on public.product_images for select
  to anon, authenticated using ( true );
create policy "product_images_admin_insert" on public.product_images for insert to authenticated
  with check ( public.is_admin() );
create policy "product_images_admin_update" on public.product_images for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );
create policy "product_images_admin_delete" on public.product_images for delete to authenticated
  using ( public.is_admin() );

-- inventory
create policy "inventory_public_read" on public.inventory for select
  to anon, authenticated using ( true );
create policy "inventory_admin_insert" on public.inventory for insert to authenticated
  with check ( public.is_admin() );
create policy "inventory_admin_update" on public.inventory for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );
create policy "inventory_admin_delete" on public.inventory for delete to authenticated
  using ( public.is_admin() );

grant select on
  public.categories, public.products, public.product_variants,
  public.product_categories, public.product_images, public.inventory
  to anon, authenticated;
grant insert, update, delete on
  public.categories, public.products, public.product_variants,
  public.product_categories, public.product_images, public.inventory
  to authenticated;

-- ============================================================================
-- COMMERCE  (cart recomputes price; order freezes a snapshot)
-- ============================================================================

create table public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity   int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);
create index cart_items_cart_id_idx    on public.cart_items (cart_id);
create index cart_items_variant_id_idx on public.cart_items (variant_id);

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     bigint generated by default as identity (start with 1001),
  user_id          uuid references auth.users (id) on delete set null,
  status           public.order_status not null default 'pending',
  email            text not null,
  phone            text,
  subtotal         bigint not null default 0 check (subtotal >= 0),
  discount_total   bigint not null default 0 check (discount_total >= 0),
  shipping_total   bigint not null default 0 check (shipping_total >= 0),
  total            bigint not null default 0 check (total >= 0),
  currency         text not null default 'ARS',
  coupon_id        uuid,  -- FK wired after coupons table
  coupon_code      text,
  shipping_method  text,
  shipping_address jsonb,
  pickup           boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index orders_order_number_idx on public.orders (order_number);
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx  on public.orders (status);

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  variant_id   uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_name text,
  sku          text,
  unit_price   bigint not null check (unit_price >= 0),
  quantity     int not null check (quantity > 0),
  line_total   bigint not null check (line_total >= 0),
  created_at   timestamptz not null default now()
);
create index order_items_order_id_idx   on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

create trigger carts_set_updated_at before update on public.carts
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger cart_items_set_updated_at before update on public.cart_items
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger orders_set_updated_at before update on public.orders
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.carts       enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "carts_select_own_or_admin" on public.carts for select
  to authenticated using ( (select auth.uid()) = user_id or public.is_admin() );
create policy "carts_insert_own" on public.carts for insert
  to authenticated with check ( (select auth.uid()) = user_id );
create policy "carts_update_own" on public.carts for update
  to authenticated using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );
create policy "carts_delete_own" on public.carts for delete
  to authenticated using ( (select auth.uid()) = user_id );

create policy "cart_items_select_own" on public.cart_items for select
  to authenticated using (
    public.is_admin() or exists (
      select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())
    )
  );
create policy "cart_items_insert_own" on public.cart_items for insert
  to authenticated with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
  );
create policy "cart_items_update_own" on public.cart_items for update
  to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
  );
create policy "cart_items_delete_own" on public.cart_items for delete
  to authenticated using (
    exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))
  );

-- Orders are created server-side (service role). Clients read; admin updates.
create policy "orders_select_own_or_admin" on public.orders for select
  to authenticated using ( (select auth.uid()) = user_id or public.is_admin() );
create policy "orders_admin_update" on public.orders for update
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

create policy "order_items_select_own_or_admin" on public.order_items for select
  to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.carts, public.cart_items to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant update on public.orders to authenticated; -- RLS restricts to admins

-- ============================================================================
-- OPS  (coupons, payments, shipments)
-- ============================================================================

create table public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  description     text,
  type            public.coupon_type not null,
  value           bigint not null check (value >= 0),
  min_order       bigint not null default 0 check (min_order >= 0),
  max_redemptions int,
  redeemed_count  int not null default 0 check (redeemed_count >= 0),
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.orders
  add constraint orders_coupon_id_fkey
  foreign key (coupon_id) references public.coupons (id) on delete set null;
create index orders_coupon_id_idx on public.orders (coupon_id);

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  provider      text not null default 'mercadopago',
  external_id   text,
  preference_id text,
  status        public.payment_status not null default 'pending',
  status_detail text,
  amount        bigint not null check (amount >= 0),
  currency      text not null default 'ARS',
  raw           jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index payments_order_id_idx on public.payments (order_id);
create unique index payments_provider_external_idx
  on public.payments (provider, external_id) where external_id is not null;

create table public.shipments (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.orders (id) on delete cascade,
  provider                text not null,
  status                  public.shipment_status not null default 'pending',
  cost                    bigint not null default 0 check (cost >= 0),
  currency                text not null default 'ARS',
  tracking_number         text,
  label_url               text,
  estimated_days          int,
  destination_postal_code text,
  raw                     jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index shipments_order_id_idx on public.shipments (order_id);

create trigger coupons_set_updated_at before update on public.coupons
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger payments_set_updated_at before update on public.payments
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger shipments_set_updated_at before update on public.shipments
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.coupons   enable row level security;
alter table public.payments  enable row level security;
alter table public.shipments enable row level security;

-- coupons: admin only (validation/redemption happens server-side via service role)
create policy "coupons_admin_all" on public.coupons for all
  to authenticated using ( public.is_admin() ) with check ( public.is_admin() );

-- payments: owner reads (through their order), admin reads. No client write.
create policy "payments_select_own_or_admin" on public.payments for select
  to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

-- shipments: owner reads (through their order); admin full control.
create policy "shipments_select_own_or_admin" on public.shipments for select
  to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())
    )
  );
create policy "shipments_admin_insert" on public.shipments for insert to authenticated
  with check ( public.is_admin() );
create policy "shipments_admin_update" on public.shipments for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );
create policy "shipments_admin_delete" on public.shipments for delete to authenticated
  using ( public.is_admin() );

grant select, insert, update, delete on public.coupons to authenticated; -- RLS: admin only
grant select on public.payments to authenticated;                         -- RLS: owner/admin
grant select, insert, update, delete on public.shipments to authenticated;-- RLS: read owner/admin, write admin

-- ============================================================================
-- CHAT + SETTINGS
-- ============================================================================

create table public.chat_conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete set null,
  session_token text,
  title         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index chat_conversations_user_id_idx on public.chat_conversations (user_id);
create index chat_conversations_session_idx on public.chat_conversations (session_token);

create table public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  role            public.chat_role not null,
  content         text,
  tool_calls      jsonb,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);
create index chat_messages_conversation_id_idx on public.chat_messages (conversation_id);

create table public.store_settings (
  id                      smallint primary key default 1 check (id = 1),
  store_name              text not null default 'valeria joyas',
  currency                text not null default 'ARS',
  free_shipping_threshold bigint,
  pickup_enabled          boolean not null default true,
  origin_postal_code      text,
  origin_address          jsonb,
  contact_email           text,
  contact_phone           text,
  social                  jsonb not null default '{}',
  updated_at              timestamptz not null default now()
);

create trigger chat_conversations_set_updated_at before update on public.chat_conversations
  for each row execute procedure extensions.moddatetime (updated_at);
create trigger store_settings_set_updated_at before update on public.store_settings
  for each row execute procedure extensions.moddatetime (updated_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages      enable row level security;
alter table public.store_settings     enable row level security;

-- chat: server (service role) writes; authenticated reads own; admin reads all.
create policy "chat_conversations_select_own_or_admin" on public.chat_conversations for select
  to authenticated using ( (select auth.uid()) = user_id or public.is_admin() );
create policy "chat_messages_select_own_or_admin" on public.chat_messages for select
  to authenticated using (
    public.is_admin() or exists (
      select 1 from public.chat_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

-- store_settings: public read (storefront needs it), admin write.
create policy "store_settings_public_read" on public.store_settings for select
  to anon, authenticated using ( true );
create policy "store_settings_admin_insert" on public.store_settings for insert to authenticated
  with check ( public.is_admin() );
create policy "store_settings_admin_update" on public.store_settings for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

grant select on public.chat_conversations, public.chat_messages to authenticated;
grant select on public.store_settings to anon, authenticated;
grant insert, update, delete on public.store_settings to authenticated; -- RLS: admin only

-- ============================================================================
-- STORAGE  (public bucket for product images; admin-only writes)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public buckets serve objects via public URL with no SELECT policy needed.
-- (Omitting a broad SELECT policy prevents listing the whole bucket.)
create policy "product_images_admin_insert" on storage.objects for insert to authenticated
  with check ( bucket_id = 'product-images' and public.is_admin() );
create policy "product_images_admin_update" on storage.objects for update to authenticated
  using ( bucket_id = 'product-images' and public.is_admin() )
  with check ( bucket_id = 'product-images' and public.is_admin() );
create policy "product_images_admin_delete" on storage.objects for delete to authenticated
  using ( bucket_id = 'product-images' and public.is_admin() );
