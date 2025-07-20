import { Layout } from '@/components/common/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Globe, TrendingUp } from 'lucide-react';

export function About() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              About Farmetrics
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
              Transforming agriculture in Ghana through technology and data-driven insights.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Farmetrics is dedicated to empowering Ghanaian farmers, supervisors, and agricultural 
                administrators with cutting-edge technology for farm management, data collection, and 
                operational oversight. We bridge the gap between traditional farming practices and 
                modern agricultural technology.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    To become Ghana's leading agricultural technology platform, enabling sustainable 
                    farming practices and improved food security through comprehensive data management 
                    and field monitoring systems.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>Our Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    Supporting thousands of farmers across all 16 regions of Ghana, facilitating 
                    better decision-making through real-time data collection, farm monitoring, and 
                    streamlined communication between field teams and management.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How Farmetrics Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive ecosystem connecting field officers, supervisors, and administrators
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Field Data Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Field officers use our mobile app to visit farms, collect GPS coordinates, 
                  capture geotagged photos, and record detailed farm information including 
                  crop types and polygon boundaries.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Supervision & Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Regional supervisors review and approve field data, manage team assignments, 
                  track visit progress, and handle issues or transfer requests within their 
                  designated areas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Data Analysis & Reporting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Administrators access comprehensive dashboards with analytics, generate reports, 
                  manage system-wide operations, and make data-driven decisions to improve 
                  agricultural outcomes.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Built for Ghana's Agricultural Future
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Farmetrics combines modern web technologies with mobile data collection to create 
              a robust platform that works reliably in Ghana's diverse geographical and 
              technological landscape.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Our platform supports offline data collection, real-time synchronization, 
              comprehensive mapping capabilities, and seamless integration with existing 
              agricultural workflows across all 16 regions of Ghana.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}