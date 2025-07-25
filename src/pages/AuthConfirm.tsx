import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const userType = searchParams.get('userType') || 'field_officer';

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

        // Get the user's email from the confirmed user data
        const email = data.user?.email || '';

        toast.success('Email confirmed successfully! Please sign in to continue.');
        
        // Redirect to confirmation success page
        navigate(`/email-confirmation-success?userType=${userType}&email=${encodeURIComponent(email)}`);

      } catch (error) {
        console.error('Unexpected error during email confirmation:', error);
        toast.error('An unexpected error occurred. Please try again.');
        navigate('/');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirming your email...</h2>
        <p className="text-gray-600">Please wait while we verify your account.</p>
      </div>
    </div>
  );
} 