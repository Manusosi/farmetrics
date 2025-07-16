-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'supervisor', 'field_officer');

-- Create users table extending Supabase auth
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role user_role NOT NULL DEFAULT 'field_officer',
    region TEXT,
    district TEXT,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create farmers table
CREATE TABLE public.farmers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT,
    region TEXT NOT NULL,
    district TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farms table
CREATE TABLE public.farms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    region TEXT NOT NULL,
    district TEXT NOT NULL,
    location TEXT,
    polygon_coordinates JSONB,
    total_area DECIMAL,
    assigned_officer_id UUID REFERENCES public.profiles(id),
    visit_count INTEGER NOT NULL DEFAULT 0,
    last_visit_date TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visits table
CREATE TABLE public.visits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visit_number INTEGER NOT NULL,
    notes TEXT,
    coordinates JSONB,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create images table for visit photos
CREATE TABLE public.visit_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    exif_data JSONB,
    coordinates JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issues table
CREATE TABLE public.issues (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'resolved')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transfers table for supervisor transfer requests
CREATE TABLE public.transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_supervisor UUID NOT NULL REFERENCES public.profiles(id),
    to_supervisor UUID REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_comment TEXT,
    processed_by UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Supervisors can view profiles in their region" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles supervisor
            WHERE supervisor.user_id = auth.uid() 
            AND supervisor.role = 'supervisor'
            AND supervisor.region = profiles.region
        ) OR auth.uid() = user_id
    );

-- Farmers policies
CREATE POLICY "Admins can manage all farmers" ON public.farmers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Supervisors can view farmers in their region" ON public.farmers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles supervisor
            WHERE supervisor.user_id = auth.uid() 
            AND supervisor.role = 'supervisor'
            AND supervisor.region = farmers.region
        )
    );

-- Farms policies
CREATE POLICY "Admins can manage all farms" ON public.farms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Supervisors can manage farms in their region" ON public.farms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles supervisor
            WHERE supervisor.user_id = auth.uid() 
            AND supervisor.role = 'supervisor'
            AND supervisor.region = farms.region
        )
    );

CREATE POLICY "Field officers can view assigned farms" ON public.farms
    FOR SELECT USING (
        assigned_officer_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Visits policies
CREATE POLICY "Admins can view all visits" ON public.visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Supervisors can view visits in their region" ON public.visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles supervisor
            WHERE supervisor.user_id = auth.uid() 
            AND supervisor.role = 'supervisor'
            AND EXISTS (
                SELECT 1 FROM public.farms 
                WHERE farms.id = visits.farm_id 
                AND farms.region = supervisor.region
            )
        )
    );

CREATE POLICY "Officers can manage their own visits" ON public.visits
    FOR ALL USING (
        officer_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Issues policies  
CREATE POLICY "Admins can manage all issues" ON public.issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Supervisors can manage issues in their region" ON public.issues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles supervisor
            WHERE supervisor.user_id = auth.uid() 
            AND supervisor.role = 'supervisor'
            AND EXISTS (
                SELECT 1 FROM public.farms 
                WHERE farms.id = issues.farm_id 
                AND farms.region = supervisor.region
            )
        )
    );

-- Transfers policies
CREATE POLICY "Admins can manage all transfers" ON public.transfers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Supervisors can view related transfers" ON public.transfers
    FOR SELECT USING (
        from_supervisor IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        ) OR to_supervisor IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at
    BEFORE UPDATE ON public.farmers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farms_updated_at
    BEFORE UPDATE ON public.farms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Unknown User'),
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'field_officer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();