import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Email Confirmed!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your email has been successfully verified
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <p className="font-medium text-green-800 mb-1">
                Welcome to Farmetrics!
              </p>
              <p className="text-sm text-green-700">
                Your {getUserTypeText(userType).toLowerCase()} account is now verified.
              </p>
            </div>
          </div>

          {userType !== 'admin' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-center">
                <p className="font-medium text-yellow-800 mb-1">
                  Pending Approval
                </p>
                <p className="text-sm text-yellow-700">
                  Your account is awaiting administrator approval before you can access all features.
                </p>
              </div>
            </div>
          )}

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Please sign in to continue
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Redirecting to sign in page in <span className="font-bold">{countdown}</span> seconds...
              </p>
            </div>

            <Button
              onClick={handleRedirectToSignIn}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Sign In Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 