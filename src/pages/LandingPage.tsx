import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/common/Layout';
import { Shield, Users, Sprout, TrendingUp, MapPin, BarChart } from 'lucide-react';
import cocoaFarmerBg from '@/assets/cocoa-farmer-bg.jpg';

export function LandingPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20 lg:py-32 overflow-hidden">
        {/* Background Video/Image */}
        <div className="absolute inset-0">
          {/* Placeholder for video - replace with actual video when available */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 animate-pulse"
            style={{ backgroundImage: `url(/videos/cocoa-farming-placeholder.jpg)` }}
          />
          {/* Video element for future implementation */}
          {/* <video 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            autoPlay 
            muted 
            loop 
            playsInline
          >
            <source src="/videos/cocoa-farmer.mp4" type="video/mp4" />
          </video> */}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Agricultural Data Monitoring
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Empowering Ghanaian farmers with data-driven insights and management tools.
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Our platform serves farmers, supervisors, and administrators by providing comprehensive 
              agricultural monitoring, field visit tracking, and data management capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Portal Cards Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Access Your Portal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your role to access the appropriate management dashboard
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Admin Portal Card */}
            <Card className="group hover:shadow-medium transition-all duration-300 border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Admin Portal</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Manage users, monitor farm operations, and analyze agricultural data across all regions.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="default" size="lg" className="w-full" asChild>
                  <Link to="/admin-signin">
                    Access Admin Dashboard →
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Supervisor Portal Card */}
            <Card className="group hover:shadow-medium transition-all duration-300 border-secondary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                  <CardTitle className="text-xl">Supervisor Portal</CardTitle>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  Coordinate field teams, manage regional operations, and track farm activities in your area.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link to="/supervisor-signin">
                    Access Supervisor Dashboard →
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools for agricultural data management and field operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Sprout className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Farm Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track farm visits, manage crop data, and monitor polygon coordinates with GPS integration.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Data Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate comprehensive reports and analyze agricultural trends across regions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Field Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor field officer activities and track visit progress with real-time updates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage field officers, supervisors, and assign regional responsibilities efficiently.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Progress Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track farm visit completion rates and monitor operational efficiency across regions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Issue Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Handle field issues, manage transfer requests, and maintain data quality standards.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of agricultural professionals using Farmetrics to improve farm management and data collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="xl" asChild>
              <Link to="/admin-signup">Create Admin Account</Link>
            </Button>
            <Button variant="secondary" size="xl" asChild>
              <Link to="/supervisor-signup">Join as Supervisor</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}