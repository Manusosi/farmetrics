import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/common/Layout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const email = searchParams.get('email') || '';
  const userType = searchParams.get('userType') || 'field_officer';

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Email address is required to resend confirmation');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error('Failed to resend confirmation email');
      } else {
        setResendCount(prev => prev + 1);
        toast.success('Confirmation email sent successfully!');
      }
    } catch (error) {
      toast.error('An error occurred while resending email');
    } finally {
      setIsResending(false);
    }
  };

  const getUserTypeText = (type: string) => {
    switch (type) {
      case 'admin':
        return 'Administrator';
      case 'supervisor':
        return 'Supervisor';
      case 'field_officer':
        return 'Field Officer';
      default:
        return 'User';
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="shadow-large">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Check Your Email
              </CardTitle>
              <CardDescription>
                We've sent a confirmation link to verify your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800 dark:text-green-200">Registration Submitted</p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      Your {getUserTypeText(userType).toLowerCase()} account has been created successfully.
                    </p>
                  </div>
                </div>
              </div>

              {email && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Confirmation email sent to:
                  </p>
                  <p className="font-medium bg-muted px-3 py-2 rounded-md">
                    {email}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Next Steps:</h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Check your email inbox (and spam/junk folder)</li>
                    <li>Click the confirmation link in the email</li>
                    <li>Sign in with your credentials</li>
                    {userType !== 'admin' && (
                      <li>Wait for administrator approval to access full features</li>
                    )}
                  </ol>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResendConfirmation}
                  disabled={isResending || resendCount >= 3}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {resendCount > 0 ? 'Resend Again' : 'Resend Confirmation'}
                    </>
                  )}
                </Button>

                {resendCount >= 3 && (
                  <p className="text-xs text-destructive text-center">
                    Maximum resend limit reached. Please contact support if you still don't receive the email.
                  </p>
                )}

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Remember your credentials?{' '}
                    <Link 
                      to={userType === 'admin' ? '/admin-signin' : userType === 'supervisor' ? '/supervisor-signin' : '/signin'}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 