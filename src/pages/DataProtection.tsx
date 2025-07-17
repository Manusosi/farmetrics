import { Layout } from '@/components/common/Layout';

export function DataProtection() {
  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Data Protection Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">
              <strong>Last updated:</strong> January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Commitment</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Farmetrics is committed to protecting the privacy and security of all personal and 
                agricultural data processed through our platform. We adhere to international data 
                protection standards and Ghana's data protection laws to ensure responsible data handling.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Protection Principles</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Lawfulness and Transparency</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We process data lawfully, fairly, and transparently. Users are informed about 
                    how their data is collected, used, and shared.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Purpose Limitation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Data is collected for specific, explicit, and legitimate purposes related to 
                    agricultural monitoring and is not used for incompatible purposes.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Data Minimization</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect only data that is adequate, relevant, and necessary for our 
                    agricultural monitoring purposes.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Accuracy</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We maintain accurate and up-to-date data, with processes in place for 
                    correction and verification.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Technical Safeguards</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Encryption</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>All data transmitted over networks is encrypted using TLS 1.2+</li>
                    <li>Sensitive data at rest is encrypted using industry-standard algorithms</li>
                    <li>Database connections use encrypted channels</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Access Controls</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Role-based access control (RBAC) restricts data access</li>
                    <li>Multi-factor authentication for administrative accounts</li>
                    <li>Regular access reviews and permission audits</li>
                    <li>Principle of least privilege enforced</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Infrastructure Security</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Cloud infrastructure with enterprise-grade security</li>
                    <li>Regular security updates and patches</li>
                    <li>Network firewalls and intrusion detection</li>
                    <li>Automated backup and disaster recovery</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Organizational Measures</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Staff Training</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All staff receive regular training on data protection principles, security 
                    procedures, and privacy best practices.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Data Processing Agreements</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Third-party processors are bound by strict data processing agreements that 
                    ensure equivalent levels of protection.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Incident Response</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We maintain a comprehensive incident response plan to quickly identify, 
                    contain, and respond to any data breaches or security incidents.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Retention</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Retention Periods</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>User account data: Retained while account is active plus 2 years</li>
                    <li>Agricultural data: Retained for 7 years for research and policy purposes</li>
                    <li>Visit logs and images: Retained for 5 years for verification</li>
                    <li>System logs: Retained for 1 year for security monitoring</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">Secure Deletion</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Data is securely deleted at the end of retention periods using methods that 
                    prevent recovery.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">International Transfers</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When data is transferred internationally, we ensure adequate protection through:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Adequacy decisions by relevant authorities</li>
                <li>Standard contractual clauses approved by data protection authorities</li>
                <li>Certification schemes and codes of conduct</li>
                <li>Binding corporate rules for intra-group transfers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Under data protection law, you have the following rights:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Right of access:</strong> Request copies of your personal data</li>
                <li><strong>Right to rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to erasure:</strong> Request deletion of your data in certain circumstances</li>
                <li><strong>Right to restrict processing:</strong> Request limitation of how we use your data</li>
                <li><strong>Right to data portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Right to object:</strong> Object to processing in certain circumstances</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Breach Notification</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In the event of a data breach that poses a risk to your rights and freedoms, we will:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Notify relevant supervisory authorities within 72 hours</li>
                <li>Inform affected individuals without undue delay</li>
                <li>Provide clear information about the nature and impact of the breach</li>
                <li>Detail measures taken to address the breach and prevent recurrence</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Our Data Protection Officer</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For any data protection concerns, questions about your rights, or to make a complaint:
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground"><strong>Email:</strong> dpo@farmetrics.org</p>
                <p className="text-foreground"><strong>General Contact:</strong> info@farmetrics.org</p>
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