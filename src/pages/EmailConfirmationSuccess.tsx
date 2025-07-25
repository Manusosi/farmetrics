import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/common/Layout';

export default function EmailConfirmationSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const userType = searchParams.get('userType') || 'field_officer';
  const email = searchParams.get('email') || '';

  useEffect(() => {
    // Countdown timer for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirectToSignIn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRedirectToSignIn = () => {
    const signInRoutes = {
      admin: '/admin-signin',
      supervisor: '/supervisor-signin',
      field_officer: '/signin'
    };

    const route = signInRoutes[userType as keyof typeof signInRoutes] || '/signin';
    const params = email ? `?email=${encodeURIComponent(email)}` : '';
    navigate(`${route}${params}`);
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
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                Email Confirmed!
              </CardTitle>
              <CardDescription>
                Your account has been successfully verified
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Welcome to Farmetrics!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your {getUserTypeText(userType).toLowerCase()} account is ready.
                    {userType !== 'admin' && ' Please wait for administrator approval to access full features.'}
                  </p>
                </div>
              </div>

              {email && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Account verified for:
                  </p>
                  <p className="font-medium bg-muted px-3 py-2 rounded-md">
                    {email}
                  </p>
                </div>
              )}

              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Redirecting to sign in page in {countdown} seconds...
                </p>
                
                <Button
                  onClick={handleRedirectToSignIn}
                  className="w-full"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Sign In Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 