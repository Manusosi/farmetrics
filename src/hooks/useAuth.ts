import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone_number?: string;
  role: 'admin' | 'supervisor' | 'field_officer';
  region?: string;
  district?: string;
  location?: string;
  is_active: boolean;
  account_status?: string;
  approved_by?: string;
  approved_at?: string;
  gender?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to fetch profile data
  const fetchProfile = async (userId: string) => {
    try {
      console.info('Fetching user profile...');
      
      // First try to get the profile from the profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.error('🔒 RLS Policy Error: Failed to fetch profile due to insufficient permissions.', error);
          console.info('If you are an admin, ensure your user has admin role in both app_meta_data AND user_meta_data');
        } else if (error.code === '403') {
          console.error('🚫 Access Denied: Failed to fetch profile due to access restrictions.', error);
        } else if (error.code === 'PGRST116') {
          console.warn('⚠️ No profile found: The profile may not exist yet.');
        } else {
          console.error('❌ Error fetching profile:', error);
        }
        
        // If we can't get the profile from the database, try to use metadata from the user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && (user.app_metadata?.role || user.user_metadata?.role)) {
          console.info('✅ Using metadata from auth user for profile');
          
          // Create a temporary profile from user metadata
          const tempProfile: Profile = {
            id: userId,
            user_id: userId,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
            role: (user.app_metadata?.role || user.user_metadata?.role) as 'admin' | 'supervisor' | 'field_officer',
            region: user.user_metadata?.region,
            district: user.user_metadata?.district,
            location: user.user_metadata?.location,
            is_active: true
          };
          
          setProfile(tempProfile);
          return tempProfile;
        }
        
        console.warn('⚠️ Could not create profile from user metadata');
        setProfile(null);
        return null;
      } else {
        console.info('✅ Profile fetched successfully');
        setProfile(profileData);
        return profileData;
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching profile:', error);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.info(`Auth state changed: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile data after auth state change
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      console.info('Initializing auth state...');
      const { data: { session } } = await supabase.auth.getSession();
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.info('Existing session found');
        await fetchProfile(session.user.id);
      } else {
        console.info('No existing session found');
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.info('Signing in...');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign-in failed:', error.message);
        return { error };
      }
      
      console.info('✅ Sign-in successful');
      return { error: null };
    } catch (error: any) {
      console.error('❌ Unexpected error during sign-in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      console.info('Creating new account...');
      const redirectUrl = `${window.location.origin}/auth/confirm`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.full_name,
            role: userData.role,
            phone_number: userData.phone_number,
            region: userData.region,
            district: userData.district,
            location: userData.location,
          }
        }
      });
      
      if (error) {
        console.error('❌ Sign-up failed:', error.message);
      } else {
        console.info('✅ Sign-up successful');
      }
      
      return { data, error };
    } catch (error: any) {
      console.error('❌ Unexpected error during sign-up:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.info('Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign-out failed:', error.message);
      } else {
        console.info('✅ Sign-out successful');
        setUser(null);
        setSession(null);
        setProfile(null);
      }
      
      return { error };
    } catch (error: any) {
      console.error('❌ Unexpected error during sign-out:', error);
      return { error };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
}