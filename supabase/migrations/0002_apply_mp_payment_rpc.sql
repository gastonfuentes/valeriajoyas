-- ============================================================================
-- valeria joyas — 0002 apply_mp_payment()
--
-- Atomic + idempotent application of a Mercado Pago payment notification:
--   * upserts the payments row (idempotent on provider + external_id)
--   * decrements stock once on the transition into 'paid'
--   * restores stock on a refund/chargeback of a previously paid order
--   * sets the order status, never downgrading a paid order on a stale event
--
-- Called server-side via the service role (webhook + process-payment route).
-- ============================================================================
create or replace function public.apply_mp_payment(
  p_order_id      uuid,
  p_provider      text,
  p_external_id   text,
  p_status        public.payment_status,
  p_status_detail text,
  p_amount        bigint,
  p_raw           jsonb
) returns public.order_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_status public.order_status;
  v_new_status public.order_status;
begin
  -- Lock the order so concurrent webhook + process-payment calls serialize.
  select status into v_old_status from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  -- Idempotent payment upsert (unique on provider + external_id).
  insert into public.payments
    (order_id, provider, external_id, status, status_detail, amount, currency, raw)
  values
    (p_order_id, p_provider, p_external_id, p_status, p_status_detail, p_amount, 'ARS', p_raw)
  on conflict (provider, external_id) where external_id is not null
  do update set
    status = excluded.status,
    status_detail = excluded.status_detail,
    raw = excluded.raw,
    updated_at = now();

  -- Map payment status -> order status.
  v_new_status := case p_status
    when 'approved'     then 'paid'
    when 'pending'      then 'pending'
    when 'in_process'   then 'pending'
    when 'rejected'     then 'cancelled'
    when 'cancelled'    then 'cancelled'
    when 'refunded'     then 'refunded'
    when 'charged_back' then 'refunded'
    else 'pending'
  end::public.order_status;

  -- Stock side effects, only on the real transition (idempotent).
  if v_new_status = 'paid' and v_old_status <> 'paid' then
    update public.inventory inv
    set quantity = greatest(0, inv.quantity - oi.quantity)
    from public.order_items oi
    where oi.order_id = p_order_id and oi.variant_id = inv.variant_id;
  elsif v_old_status = 'paid' and v_new_status in ('refunded', 'cancelled') then
    update public.inventory inv
    set quantity = inv.quantity + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id and oi.variant_id = inv.variant_id;
  end if;

  -- Never downgrade a paid order back to pending on a stale notification.
  if v_old_status = 'paid' and v_new_status = 'pending' then
    return v_old_status;
  end if;

  update public.orders set status = v_new_status where id = p_order_id;
  return v_new_status;
end;
$$;

revoke execute on function public.apply_mp_payment(uuid, text, text, public.payment_status, text, bigint, jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_mp_payment(uuid, text, text, public.payment_status, text, bigint, jsonb)
  to service_role;
