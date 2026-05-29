-- Checkout payment settlement: invoice status + record_invoice_payment RPC
-- Run in Supabase SQL Editor after schema.sql

-- Allow overdue invoice status
alter table public.hotel_management_invoices
  drop constraint if exists hotel_management_invoices_status_check;

alter table public.hotel_management_invoices
  add constraint hotel_management_invoices_status_check
  check (status in (
    'draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'
  ));

-- Recompute invoice totals from payments
create or replace function public.sync_invoice_payment_totals(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric;
  v_paid numeric;
  v_balance numeric;
  v_status text;
begin
  select total_amount into v_total
  from public.hotel_management_invoices
  where id = p_invoice_id;

  if v_total is null then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  select coalesce(sum(amount), 0) into v_paid
  from public.hotel_management_payments
  where invoice_id = p_invoice_id;

  v_balance := greatest(v_total - v_paid, 0);

  if v_balance <= 0 then
    v_status := 'paid';
    v_balance := 0;
  elsif v_paid > 0 then
    v_status := 'partially_paid';
  else
    v_status := 'issued';
  end if;

  update public.hotel_management_invoices
  set
    paid_amount = v_paid,
    balance_amount = v_balance,
    status = v_status,
    updated_at = now()
  where id = p_invoice_id;
end;
$$;

-- Record a payment and update invoice paid/balance/status
create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_mode text,
  p_reference_number text default null,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.hotel_management_invoices%rowtype;
  v_payment_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  if p_payment_mode not in ('cash', 'upi', 'card', 'bank_transfer', 'bill_to_company') then
    raise exception 'Invalid payment mode: %', p_payment_mode;
  end if;

  select * into v_invoice
  from public.hotel_management_invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found: %', p_invoice_id;
  end if;

  if v_invoice.status = 'cancelled' then
    raise exception 'Cannot record payment on cancelled invoice';
  end if;

  insert into public.hotel_management_payments (
    invoice_id,
    amount,
    payment_mode,
    reference_number,
    notes
  ) values (
    p_invoice_id,
    p_amount,
    p_payment_mode,
    p_reference_number,
    p_remarks
  )
  returning id into v_payment_id;

  perform public.sync_invoice_payment_totals(p_invoice_id);

  select * into v_invoice
  from public.hotel_management_invoices
  where id = p_invoice_id;

  return jsonb_build_object(
    'payment_id', v_payment_id,
    'invoice_id', v_invoice.id,
    'paid_amount', v_invoice.paid_amount,
    'balance_amount', v_invoice.balance_amount,
    'status', v_invoice.status
  );
end;
$$;

-- Trigger: keep invoice totals in sync when payments change
create or replace function public.trg_sync_invoice_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_invoice_payment_totals(old.invoice_id);
    return old;
  end if;

  perform public.sync_invoice_payment_totals(new.invoice_id);
  return new;
end;
$$;

drop trigger if exists trg_hm_payments_sync_invoice on public.hotel_management_payments;

create trigger trg_hm_payments_sync_invoice
  after insert or update or delete on public.hotel_management_payments
  for each row
  execute function public.trg_sync_invoice_on_payment();

grant execute on function public.record_invoice_payment(uuid, numeric, text, text, text) to authenticated, service_role;
grant execute on function public.sync_invoice_payment_totals(uuid) to authenticated, service_role;
