import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/common/Layout';

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!token_hash || !type) {
        toast.error('Invalid confirmation link');
        navigate('/');
        return;
      }

      try {
        // Verify the email confirmation token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          console.error('Email confirmation error:', error);
          toast.error('Failed to confirm email. Please try again or contact support.');
          navigate('/');
          return;
        }

        // Log out the user immediately to prevent auto-login
        await supabase.auth.signOut();

        // Get the user's email and role from the confirmed user data
        const email = data.user?.email || '';
        const userRole = data.user?.user_metadata?.role || 'field_officer';

        toast.success('Email confirmed successfully! Please sign in to continue.');
        
        // Redirect to confirmation success page with correct user type
        navigate(`/email-confirmation-success?userType=${userRole}&email=${encodeURIComponent(email)}`);

      } catch (error) {
        console.error('Unexpected error during email confirmation:', error);
        toast.error('An unexpected error occurred. Please try again.');
        navigate('/');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Confirming your email...</h2>
          <p className="text-muted-foreground">Please wait while we verify your account.</p>
        </div>
      </div>
    </Layout>
  );
} 