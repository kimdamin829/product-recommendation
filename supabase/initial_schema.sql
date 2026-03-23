-- =============================================================================
-- product-recommendation (daega-shop-web) — 초기 스키마
-- Supabase Dashboard → SQL Editor 에서 전체 실행
--
-- 전제: Supabase 프로젝트에 auth 스키마(기본) 존재
-- Storage: 상품 설명 이미지용 버킷 `product-descriptions` 는 대시보드에서 생성 권장
-- =============================================================================

-- extensions (Supabase 에서 보통 이미 켜져 있음)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 프로필 · 인증 보조 (auth.users 와 1:1)
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  phone_verified_at timestamptz,
  username text,
  username_normalized text,
  birthday date,
  status text not null default 'active',
  restored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_status_check check (status in ('active', 'deleted'))
);

create unique index if not exists users_phone_unique
  on public.users (phone) where phone is not null;
create unique index if not exists users_username_normalized_unique
  on public.users (username_normalized) where username_normalized is not null;

create table if not exists public.user_terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  terms_type text not null,
  agreed boolean not null default false,
  agreed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, terms_type)
);

create table if not exists public.auth_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  purpose text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  resend_available_at timestamptz,
  locked_until timestamptz,
  verified_at timestamptz,
  verification_token_hash text,
  verification_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_otps_phone_purpose_created_idx
  on public.auth_otps (phone, purpose, created_at desc);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  phone text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_token_hash_idx
  on public.password_reset_tokens (token_hash);

-- 소셜 연동 잔여 코드(휴대폰 병합 시 업데이트)
create table if not exists public.oauth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'unknown',
  provider_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists oauth_identities_user_id_idx on public.oauth_identities (user_id);

-- -----------------------------------------------------------------------------
-- 상품 · 이미지 · 고시
-- -----------------------------------------------------------------------------
create table if not exists public.product_notice_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  brand text,
  name text not null,
  price integer not null default 0,
  category text not null,
  average_rating numeric(3,1),
  review_count integer not null default 0,
  weight_gram integer,
  status text not null default 'active',
  tax_type text not null default 'taxable',
  unit text,
  origin text,
  notice_category_id uuid references public.product_notice_categories (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_status_check check (status in ('active', 'soldout', 'deleted')),
  constraint products_tax_type_check check (tax_type in ('taxable', 'tax_free'))
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_status_idx on public.products (status);

create table if not exists public.product_notice_fields (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_notice_categories (id) on delete cascade,
  key text not null,
  label text not null,
  required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_notice_values (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  field_id uuid not null references public.product_notice_fields (id) on delete cascade,
  value text not null,
  created_at timestamptz not null default now(),
  unique (product_id, field_id)
);

create index if not exists product_notice_values_product_idx
  on public.product_notice_values (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_priority_idx
  on public.product_images (product_id, priority);

create table if not exists public.product_description_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_description_images_product_sort_idx
  on public.product_description_images (product_id, sort_order);

-- -----------------------------------------------------------------------------
-- 프로모션 · 컬렉션 · 배너 · 히어로 · 추천
-- -----------------------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  buy_qty integer,
  discount_percent integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_type_check check (type in ('bogo', 'percent'))
);

create table if not exists public.promotion_products (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  group_id uuid,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists promotion_products_promotion_idx
  on public.promotion_products (promotion_id);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  type text not null unique,
  title text,
  description text,
  image_url text,
  color_theme jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  priority integer,
  created_at timestamptz not null default now(),
  unique (collection_id, product_id)
);

create table if not exists public.gift_categories (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.gift_category_products (
  id uuid primary key default gen_random_uuid(),
  gift_category_id uuid not null references public.gift_categories (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  unique (gift_category_id, product_id)
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle_black text,
  subtitle_red text,
  description text,
  image_url text not null,
  background_color text not null default '#FFFFFF',
  slug text unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banner_products (
  id uuid primary key default gen_random_uuid(),
  banner_id uuid not null references public.banners (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (banner_id, product_id)
);

create index if not exists banner_products_banner_idx on public.banner_products (banner_id);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendation_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendation_products (
  id uuid primary key default gen_random_uuid(),
  recommendation_category_id uuid not null references public.recommendation_categories (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  unique (recommendation_category_id, product_id)
);

create index if not exists recommendation_products_category_sort_idx
  on public.recommendation_products (recommendation_category_id, sort_order);

-- -----------------------------------------------------------------------------
-- 장바구니 · 찜
-- -----------------------------------------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  promotion_type text,
  promotion_group_id uuid,
  discount_percent numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carts_user_idx on public.carts (user_id);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 주소
-- -----------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  recipient_name text not null,
  recipient_phone text not null,
  zipcode text,
  address text not null,
  address_detail text,
  delivery_note text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses (user_id);

-- -----------------------------------------------------------------------------
-- 쿠폰
-- -----------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  discount_type text not null,
  discount_value numeric(12,2) not null,
  min_purchase_amount numeric(12,2),
  max_discount_amount numeric(12,2),
  validity_days integer not null default 30,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  issue_trigger text not null default 'ADMIN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_discount_type_check check (discount_type in ('percentage', 'fixed')),
  constraint coupons_issue_trigger_check check (issue_trigger in ('PHONE_VERIFIED', 'ADMIN', 'ETC'))
);

create table if not exists public.user_coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  is_used boolean not null default false,
  used_at timestamptz,
  order_id uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_coupons_user_idx on public.user_coupons (user_id);

create table if not exists public.coupon_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  user_id uuid not null references public.users (id) on delete cascade,
  phone text not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, phone)
);

-- -----------------------------------------------------------------------------
-- 포인트
-- -----------------------------------------------------------------------------
create table if not exists public.user_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  total_points integer not null default 0,
  purchase_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  points integer not null,
  type text not null,
  description text not null,
  order_id uuid,
  review_id uuid,
  created_at timestamptz not null default now(),
  constraint point_history_type_check check (
    type in ('purchase', 'review', 'referral', 'usage', 'expired')
  )
);

create index if not exists point_history_user_idx on public.point_history (user_id);
create index if not exists point_history_order_idx on public.point_history (order_id);

-- -----------------------------------------------------------------------------
-- 주문 초안 (결제 전)
-- -----------------------------------------------------------------------------
create table if not exists public.order_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null,
  amount integer not null,
  tax_free_amount integer not null default 0,
  expires_at timestamptz not null,
  toss_payment_key text,
  toss_approved_at timestamptz,
  confirm_status text,
  created_at timestamptz not null default now()
);

create index if not exists order_drafts_expires_at_idx on public.order_drafts (expires_at);
create index if not exists order_drafts_user_id_idx on public.order_drafts (user_id);
create index if not exists order_drafts_confirm_status_idx on public.order_drafts (confirm_status);

create unique index if not exists order_drafts_toss_payment_key_key
  on public.order_drafts (toss_payment_key)
  where toss_payment_key is not null;

-- -----------------------------------------------------------------------------
-- 주문
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  order_number text,
  total_amount integer not null default 0,
  tax_free_amount integer not null default 0,
  points_used integer not null default 0,
  coupon_discount_amount integer not null default 0,
  status text not null default 'ORDER_RECEIVED',
  delivery_type text not null,
  delivery_time text,
  shipping_address text not null default '',
  shipping_name text not null default '',
  shipping_phone text not null default '',
  delivery_note text,
  tracking_number text,
  tracking_company text,
  payment_method text,
  toss_order_id text,
  toss_payment_key text,
  is_gift boolean not null default false,
  gift_message text,
  gift_token text,
  gift_expires_at timestamptz,
  gift_recipient_phone text,
  refund_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_delivery_type_check check (delivery_type in ('pickup', 'quick', 'regular'))
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_order_number_idx on public.orders (order_number);
create index if not exists orders_toss_order_id_idx on public.orders (toss_order_id);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  price integer not null,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- order → point_history / user_coupons.order_id (FK는 순환을 피해 생략 가능; 앱에서만 연결)

-- -----------------------------------------------------------------------------
-- 리뷰 · 알림
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  content text not null,
  images jsonb,
  is_verified_purchase boolean not null default false,
  status text not null default 'approved',
  has_images boolean,
  admin_reply text,
  admin_replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_status_check check (status in ('pending', 'approved', 'rejected')),
  unique (order_id, product_id)
);

create index if not exists reviews_product_idx on public.reviews (product_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'point_history_review_fk'
  ) then
    alter table public.point_history
      add constraint point_history_review_fk
      foreign key (review_id) references public.reviews (id) on delete set null;
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  content text not null,
  type text not null default 'general',
  is_read boolean not null default false,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id);

-- -----------------------------------------------------------------------------
-- RLS (로컬/초기 개발용 — service_role 은 RLS 우회)
-- API 일부는 로그인 사용자 JWT 로 직접 조회하므로 최소 정책만 둡니다.
-- 프로덕션에서는 정책을 더 잘게 쪼개세요.
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.user_terms enable row level security;
alter table public.carts enable row level security;
alter table public.wishlists enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.user_points enable row level security;
alter table public.point_history enable row level security;
alter table public.user_coupons enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;

-- 카탈로그 / 콘텐츠: 비로그인 읽기
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_description_images enable row level security;
alter table public.product_notice_categories enable row level security;
alter table public.product_notice_fields enable row level security;
alter table public.product_notice_values enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.banners enable row level security;
alter table public.banner_products enable row level security;
alter table public.hero_slides enable row level security;
alter table public.recommendation_categories enable row level security;
alter table public.recommendation_products enable row level security;
alter table public.coupons enable row level security;

-- idempotent policy names
drop policy if exists "users_self" on public.users;
create policy "users_self" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users
  for update using (auth.uid() = id);

drop policy if exists "user_terms_self" on public.user_terms;
create policy "user_terms_self" on public.user_terms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "carts_self" on public.carts;
create policy "carts_self" on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wishlists_self" on public.wishlists;
create policy "wishlists_self" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "addresses_self" on public.addresses;
create policy "addresses_self" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "orders_self" on public.orders;
create policy "orders_self" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "order_items_via_order" on public.order_items;
create policy "order_items_via_order" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

drop policy if exists "user_points_self" on public.user_points;
create policy "user_points_self" on public.user_points
  for select using (auth.uid() = user_id);

drop policy if exists "user_points_self_insert" on public.user_points;
create policy "user_points_self_insert" on public.user_points
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_points_self_update" on public.user_points;
create policy "user_points_self_update" on public.user_points
  for update using (auth.uid() = user_id);

drop policy if exists "point_history_self" on public.point_history;
create policy "point_history_self" on public.point_history
  for select using (auth.uid() = user_id);

drop policy if exists "point_history_self_insert" on public.point_history;
create policy "point_history_self_insert" on public.point_history
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_coupons_self" on public.user_coupons;
create policy "user_coupons_self" on public.user_coupons
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_self" on public.notifications;
create policy "notifications_self" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews
  for select using (
    status = 'approved'
    or (auth.uid() is not null and user_id = auth.uid())
  );

drop policy if exists "reviews_insert_self" on public.reviews;
create policy "reviews_insert_self" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "reviews_update_self" on public.reviews;
create policy "reviews_update_self" on public.reviews
  for update using (auth.uid() = user_id);

-- 공개 읽기
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon, authenticated using (coalesce(status, 'active') <> 'deleted');

drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
  for select to anon, authenticated using (true);

drop policy if exists "product_desc_images_public_read" on public.product_description_images;
create policy "product_desc_images_public_read" on public.product_description_images
  for select to anon, authenticated using (true);

drop policy if exists "notice_cat_public_read" on public.product_notice_categories;
create policy "notice_cat_public_read" on public.product_notice_categories
  for select to anon, authenticated using (true);

drop policy if exists "notice_fields_public_read" on public.product_notice_fields;
create policy "notice_fields_public_read" on public.product_notice_fields
  for select to anon, authenticated using (true);

drop policy if exists "notice_values_public_read" on public.product_notice_values;
create policy "notice_values_public_read" on public.product_notice_values
  for select to anon, authenticated using (true);

drop policy if exists "promotions_public_read" on public.promotions;
create policy "promotions_public_read" on public.promotions
  for select to anon, authenticated using (true);

drop policy if exists "promotion_products_public_read" on public.promotion_products;
create policy "promotion_products_public_read" on public.promotion_products
  for select to anon, authenticated using (true);

drop policy if exists "collections_public_read" on public.collections;
create policy "collections_public_read" on public.collections
  for select to anon, authenticated using (coalesce(is_active, true));

drop policy if exists "collection_products_public_read" on public.collection_products;
create policy "collection_products_public_read" on public.collection_products
  for select to anon, authenticated using (true);

drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners
  for select to anon, authenticated using (coalesce(is_active, true));

drop policy if exists "banner_products_public_read" on public.banner_products;
create policy "banner_products_public_read" on public.banner_products
  for select to anon, authenticated using (true);

drop policy if exists "hero_public_read" on public.hero_slides;
create policy "hero_public_read" on public.hero_slides
  for select to anon, authenticated using (coalesce(is_active, true));

drop policy if exists "rec_cat_public_read" on public.recommendation_categories;
create policy "rec_cat_public_read" on public.recommendation_categories
  for select to anon, authenticated using (coalesce(is_active, true));

drop policy if exists "rec_products_public_read" on public.recommendation_products;
create policy "rec_products_public_read" on public.recommendation_products
  for select to anon, authenticated using (true);

drop policy if exists "coupons_public_read" on public.coupons;
create policy "coupons_public_read" on public.coupons
  for select to anon, authenticated using (coalesce(is_active, true));

-- 서버 전용(anon/authenticated 정책 없음 → JWT로는 접근 불가, service_role 만 가능)
alter table public.order_drafts enable row level security;
alter table public.auth_otps enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.coupon_claims enable row level security;
alter table public.oauth_identities enable row level security;
alter table public.gift_categories enable row level security;
alter table public.gift_category_products enable row level security;

-- -----------------------------------------------------------------------------
-- 완료
-- -----------------------------------------------------------------------------
-- 다음 단계 예시:
-- 1) Storage 에 버킷 `product-descriptions` 생성 (공개 읽기 또는 signed URL 정책)
-- 2) 관리자/서버 API는 SUPABASE_SERVICE_ROLE_KEY 사용 시 위 RLS 를 우회합니다.
-- 3) 휴대폰 인증 쿠폰 자동 발급을 쓰려면 issue_trigger = 'PHONE_VERIFIED' 인 쿠폰 1건을 INSERT
