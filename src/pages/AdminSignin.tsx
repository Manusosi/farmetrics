import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/common/Layout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function AdminSignin() {
  const [searchParams] = useSearchParams();
  const prefilledEmail = searchParams.get('email') || '';
  
  const [formData, setFormData] = useState({
    email: prefilledEmail,
    password: '',
  });
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signOut, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Update email if it comes from URL params
    if (prefilledEmail && !formData.email) {
      setFormData(prev => ({ ...prev, email: prefilledEmail }));
    }
  }, [prefilledEmail]);

  const validateEmail = (email: string) => {
    if (email && !email.endsWith('@farmetrics.org')) {
      setEmailError('Invalid email domain');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    
    // Validate on blur or when user stops typing
    if (email) {
      validateEmail(email);
    } else {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    validateEmail(formData.email);
  };

  useEffect(() => {
    // If we have both user and profile data
    if (user && profile) {
      if (profile.role === 'admin') {
        // Navigate to admin dashboard
        navigate('/admin-dashboard');
      } else {
        toast.error('Access denied. Admin privileges required.');
        // Sign out if not admin
        signOut?.();
      }
    }
  }, [user, profile, navigate, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email domain for admin accounts
    if (!formData.email.endsWith('@farmetrics.org')) {
      toast.error('Admin access requires a @farmetrics.org email address');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message || 'Failed to sign in');
        }
        setLoading(false);
      } else {
        toast.success('Signed in successfully!');
        
        // Check if we have user and profile data
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Force navigation after a short delay
          setTimeout(() => {
            navigate('/admin-dashboard');
            setLoading(false);
          }, 1000);
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Card className="shadow-large">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Sign In</CardTitle>
              <CardDescription>
                Access your Farmetrics admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    required
                    placeholder="admin@farmetrics.org"
                    className={`${emailError ? 'border-red-500' : ''} placeholder:text-gray-300 placeholder:opacity-60`}
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1">{emailError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Enter your password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/admin-signup" className="text-primary hover:underline">
                    Create one here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}