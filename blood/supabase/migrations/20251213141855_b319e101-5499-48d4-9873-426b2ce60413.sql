
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('donor', 'hospital');

-- Create enum for blood groups
CREATE TYPE public.blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-');

-- Create enum for donation status
CREATE TYPE public.donation_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create profiles table for donors
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'donor',
  full_name TEXT NOT NULL,
  age INTEGER,
  blood_group blood_group,
  city TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  hospital_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blood stock table for hospitals
CREATE TABLE public.blood_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  blood_group blood_group NOT NULL,
  units_available INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hospital_id, blood_group)
);

-- Create donation notifications table (when donor marks willingness)
CREATE TABLE public.donation_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  donor_name TEXT NOT NULL,
  blood_group blood_group NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  status donation_status NOT NULL DEFAULT 'pending',
  responded_by UUID REFERENCES public.hospitals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donation history table
CREATE TABLE public.donation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
  blood_group blood_group NOT NULL,
  donation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);

-- Hospitals policies
CREATE POLICY "Hospitals can view their own data" ON public.hospitals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Hospitals can update their own data" ON public.hospitals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Hospitals can insert their own data" ON public.hospitals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "All hospitals are viewable" ON public.hospitals FOR SELECT USING (true);

-- Blood stock policies
CREATE POLICY "Anyone can view blood stock" ON public.blood_stock FOR SELECT USING (true);
CREATE POLICY "Hospitals can update their stock" ON public.blood_stock FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.hospitals WHERE id = blood_stock.hospital_id AND user_id = auth.uid())
);
CREATE POLICY "Hospitals can insert their stock" ON public.blood_stock FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hospitals WHERE id = blood_stock.hospital_id AND user_id = auth.uid())
);

-- Donation notifications policies
CREATE POLICY "Donors can create notifications" ON public.donation_notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = donation_notifications.donor_id AND user_id = auth.uid())
);
CREATE POLICY "Donors can view their notifications" ON public.donation_notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = donation_notifications.donor_id AND user_id = auth.uid())
);
CREATE POLICY "Hospitals can view all notifications" ON public.donation_notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hospitals WHERE user_id = auth.uid())
);
CREATE POLICY "Hospitals can update notifications" ON public.donation_notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.hospitals WHERE user_id = auth.uid())
);

-- Donation history policies
CREATE POLICY "Donors can view their history" ON public.donation_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = donation_history.donor_id AND user_id = auth.uid())
);
CREATE POLICY "Hospitals can view their donation records" ON public.donation_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hospitals WHERE id = donation_history.hospital_id AND user_id = auth.uid())
);
CREATE POLICY "Hospitals can create donation records" ON public.donation_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hospitals WHERE id = donation_history.hospital_id AND user_id = auth.uid())
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blood_stock_updated_at BEFORE UPDATE ON public.blood_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.donation_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_notifications;
