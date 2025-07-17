import { Link } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, MapPin, BarChart, MessageSquare, Settings } from 'lucide-react';

export function Supervisors() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-hero py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Supervisor Portal
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Coordinate field teams, manage regional operations, and ensure agricultural data quality.
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              As a regional supervisor, you play a crucial role in Ghana's agricultural data collection system, 
              overseeing field officers and maintaining data integrity across your assigned region.
            </p>
          </div>
        </div>
      </section>

      {/* Responsibilities Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Your Responsibilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              As a supervisor, you manage field operations and ensure quality data collection in your region
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Oversee field officers in your region, assign farms, monitor performance, 
                  and coordinate team activities to ensure efficient data collection operations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Data Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Review and approve farm visit data, validate GPS coordinates, verify images, 
                  and ensure all collected information meets quality standards before final submission.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Regional Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Manage farm assignments within your region, track visit progress, 
                  identify unvisited farms, and ensure comprehensive coverage of all agricultural areas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6 text-warning" />
                </div>
                <CardTitle>Progress Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Monitor visit completion rates, track field officer performance metrics, 
                  and generate regional reports to ensure targets are met efficiently.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-info" />
                </div>
                <CardTitle>Issue Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Handle reported issues, resolve conflicts, manage transfer requests, 
                  and communicate with administrators when escalation is needed.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle>Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Maintain data quality standards, conduct field verification when necessary, 
                  and ensure compliance with agricultural data collection protocols.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Why Become a Supervisor?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join Ghana's agricultural transformation by leading regional teams and contributing 
                to improved food security and sustainable farming practices. As a supervisor, you'll 
                have access to advanced tools for team management, data oversight, and regional 
                analytics that enable effective decision-making and operational excellence.
              </p>
            </div>

            <div className="bg-gradient-subtle p-8 rounded-lg shadow-soft">
              <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                Regional Coverage Requirements
              </h3>
              <p className="text-muted-foreground text-center leading-relaxed mb-6">
                Supervisors are assigned to specific regions across Ghana's 16 administrative regions. 
                Each supervisor manages field officers and oversees data collection within their designated 
                area, ensuring comprehensive agricultural monitoring nationwide.
              </p>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Currently seeking supervisors for all regions including Greater Accra, Ashanti, 
                  Northern, Upper East, Upper West, Central, Eastern, Western, Volta, Brong-Ahafo, 
                  Western North, Ahafo, Bono East, Oti, North East, and Savannah regions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Lead Your Region?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join our team of regional supervisors and help transform Ghana's agricultural sector through 
            effective team management and quality data oversight.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="xl" asChild>
              <Link to="/supervisor-signup">Sign Up as Supervisor</Link>
            </Button>
            <Button variant="outline" size="xl" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent" asChild>
              <Link to="/supervisor-signin">Already Have an Account?</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}