-- Migration: Pre-registration system for consultant emails
-- This allows admins to pre-register emails that will automatically receive 'consultor' role upon signup

-- Table for pre-registered consultant emails
CREATE TABLE IF NOT EXISTS public.consultant_pre_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT, -- Suggested name for the consultant
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ, -- When the email was used to create an account
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.consultant_pre_registrations ENABLE ROW LEVEL SECURITY;

-- Create index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_consultant_pre_registrations_email 
ON public.consultant_pre_registrations(email);

-- RLS Policies: Only admins can manage pre-registrations
CREATE POLICY "Admins can view consultant pre-registrations"
ON public.consultant_pre_registrations
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert consultant pre-registrations"
ON public.consultant_pre_registrations
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update consultant pre-registrations"
ON public.consultant_pre_registrations
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete consultant pre-registrations"
ON public.consultant_pre_registrations
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Update handle_new_user function to check pre-registrations
-- Admin email: fmbp1981@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pre_reg_id UUID;
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  );
  
  -- Check role assignment priority:
  -- 1. Admin email (hardcoded)
  -- 2. Pre-registered consultant email
  -- 3. Default: cliente
  
  IF NEW.email = 'fmbp1981@gmail.com' THEN
    -- Admin email - assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Check if email is pre-registered as consultant
    SELECT id INTO pre_reg_id
    FROM public.consultant_pre_registrations
    WHERE email = NEW.email
      AND used_at IS NULL;
    
    IF pre_reg_id IS NOT NULL THEN
      -- Email is pre-registered - assign consultor role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'consultor');
      
      -- Mark pre-registration as used
      UPDATE public.consultant_pre_registrations
      SET used_at = now(),
          used_by_user_id = NEW.id
      WHERE id = pre_reg_id;
    ELSE
      -- Default role as cliente
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'cliente');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON TABLE public.consultant_pre_registrations IS 
'Pre-registered emails that will automatically receive consultor role upon signup. 
Only admins can manage this table. The handle_new_user trigger checks this table 
when a new user registers.';
