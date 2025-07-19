-- Fix the handle_new_user function to properly capture all user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id, 
        full_name, 
        phone_number,
        role,
        region,
        district,
        location
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Unknown User'),
        NEW.raw_user_meta_data ->> 'phone_number',
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'field_officer'),
        NEW.raw_user_meta_data ->> 'region',
        NEW.raw_user_meta_data ->> 'district',
        NEW.raw_user_meta_data ->> 'location'
    );
    RETURN NEW;
END;
$$;

-- Add RLS policy for profile insertion during signup
CREATE POLICY "Allow profile creation during signup" ON public.profiles
    FOR INSERT WITH CHECK (true);