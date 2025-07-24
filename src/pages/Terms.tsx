import { Layout } from '@/components/common/Layout';

export function Terms() {
  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              <strong>Last updated:</strong> January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By accessing and using Farmetrics, you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not 
                use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Service Description</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Farmetrics is an agricultural data monitoring platform that enables administrators and 
                supervisors to manage and monitor field data collected through our 
                mobile application. The platform provides tools for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Farm and farmer data management</li>
                <li>Field visit tracking and approval</li>
                <li>Team coordination and communication</li>
                <li>Agricultural data analytics and reporting</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Account Security</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Maintain the confidentiality of your login credentials</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Ensure accurate and up-to-date profile information</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Data Accuracy</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Provide accurate and truthful information</li>
                    <li>Verify data before submission and approval</li>
                    <li>Report any data discrepancies or errors promptly</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Acceptable Use</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Use the platform only for legitimate agricultural monitoring purposes</li>
                    <li>Respect the privacy and rights of farmers and other users</li>
                    <li>Do not attempt to access unauthorized areas of the platform</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Users are prohibited from:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Uploading false or misleading information</li>
                <li>Attempting to disrupt or compromise platform security</li>
                <li>Sharing login credentials with unauthorized persons</li>
                <li>Using the platform for any illegal or unauthorized purpose</li>
                <li>Reverse engineering or attempting to extract source code</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Ownership and Usage</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Agricultural data collected through the platform may be used for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Government agricultural planning and policy development</li>
                <li>Research and development in sustainable farming practices</li>
                <li>Improving food security and agricultural productivity</li>
                <li>Platform improvement and feature development</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Personal information will be handled in accordance with our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We strive to maintain high availability but do not guarantee uninterrupted service. 
                We reserve the right to modify, suspend, or discontinue any part of the service with 
                reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Farmetrics shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages, or any loss of profits or revenues, whether incurred directly 
                or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We reserve the right to modify these terms at any time. Users will be notified of 
                significant changes, and continued use of the platform constitutes acceptance of 
                the modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground"><strong>Email:</strong> info@farmetrics.org</p>
                <p className="text-foreground"><strong>Address:</strong> Accra, Ghana</p>
                <p className="text-foreground"><strong>Phone:</strong> +233249420040</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}