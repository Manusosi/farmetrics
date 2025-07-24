import { Layout } from '@/components/common/Layout';

export function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              <strong>Last updated:</strong> January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Farmetrics ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our 
                agricultural data monitoring platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Name, email address, and phone number</li>
                    <li>Regional and district assignments</li>
                    <li>Authentication credentials</li>
                    <li>Profile information and role assignments</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Agricultural Data</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Farm location data and GPS coordinates</li>
                    <li>Crop types and farming information</li>
                    <li>Visit records and timestamps</li>
                    <li>Images with EXIF data for verification</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>To provide and maintain our agricultural monitoring services</li>
                <li>To authenticate users and manage access controls</li>
                <li>To facilitate communication between administrators and regional supervisors</li>
                <li>To generate reports and analytics for agricultural planning</li>
                <li>To improve our platform and develop new features</li>
                <li>To comply with legal obligations and regulatory requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Encrypted data transmission and storage</li>
                <li>Role-based access controls</li>
                <li>Regular security audits and updates</li>
                <li>Secure authentication systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Object to processing in certain circumstances</li>
                <li>Data portability where applicable</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
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