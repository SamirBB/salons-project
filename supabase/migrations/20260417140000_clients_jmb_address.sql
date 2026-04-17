-- Nova polja za klijente (JMB, adresa). Pokreni na projektu: Supabase SQL Editor ili `supabase db push`.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS jmb text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS postal_code text;

COMMENT ON COLUMN public.clients.jmb IS 'JMB / JMBG ili sličan identifikator (samo salon, osjetljivi podatak).';
COMMENT ON COLUMN public.clients.street IS 'Ulica i broj';
COMMENT ON COLUMN public.clients.city IS 'Grad';
COMMENT ON COLUMN public.clients.postal_code IS 'Poštanski broj';
