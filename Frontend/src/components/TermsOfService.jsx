import React from 'react';

export default function TermsOfService() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      padding: '6rem 2rem 4rem'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--font-headlines)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Terms of Service
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="legal-content" style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '3rem',
          lineHeight: 1.8
        }}>
          
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              1. Agreement to Terms
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              These Terms of Service ("Terms") constitute a legally binding agreement between you and WorkPilot AI Inc. ("WorkPilot," 
              "we," "us," or "our") governing your access to and use of the WorkPilot AI platform, including our website, applications, 
              and services (collectively, the "Services").
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '1rem' }}>
              By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree 
              to these Terms, you must not access or use the Services.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              2. Eligibility
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              You must be at least 18 years old and have the legal capacity to enter into binding contracts to use our Services. 
              By using the Services, you represent and warrant that:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>You are at least 18 years of age</li>
              <li>You have the authority to bind your organization (if applicable)</li>
              <li>Your use of the Services complies with all applicable laws and regulations</li>
              <li>All registration information you provide is accurate and current</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              3. Account Registration and Security
            </h2>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              3.1 Account Creation
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              To use certain features, you must create an account. You agree to:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Provide accurate, complete, and current information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Immediately notify us of any unauthorized use</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              3.2 Account Termination
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We reserve the right to suspend or terminate your account if:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>You violate these Terms</li>
              <li>We suspect fraudulent, abusive, or illegal activity</li>
              <li>Required by law or legal process</li>
              <li>Your account has been inactive for more than 12 months</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              4. Acceptable Use Policy
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              You agree NOT to use the Services to:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights of others</li>
              <li>Transmit malware, viruses, or malicious code</li>
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Engage in data scraping or automated data collection</li>
              <li>Reverse engineer or decompile the Services</li>
              <li>Resell or redistribute the Services without authorization</li>
              <li>Use the Services for competitive analysis or benchmarking</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              5. Service Description and Availability
            </h2>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              5.1 Service Features
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              WorkPilot AI provides workplace automation, AI-powered task management, email triage, calendar scheduling, 
              and integrations with third-party services. Features vary by subscription tier.
            </p>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              5.2 Service Availability
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. The Services may be unavailable due to:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Scheduled maintenance (with advance notice)</li>
              <li>Emergency maintenance or security updates</li>
              <li>Third-party service disruptions</li>
              <li>Force majeure events beyond our control</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              5.3 Service Modifications
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We reserve the right to modify, suspend, or discontinue any part of the Services at any time with reasonable notice.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              6. Subscription and Payment Terms
            </h2>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              6.1 Subscription Plans
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              WorkPilot AI offers various subscription tiers with different features and usage limits. Current pricing is available 
              on our website and subject to change with 30 days' notice.
            </p>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              6.2 Payment
            </h3>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>You authorize automatic recurring charges to your payment method</li>
              <li>Failure to pay may result in service suspension or termination</li>
              <li>You are responsible for all taxes associated with your subscription</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              6.3 Free Trial
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We may offer a free trial period. Unless you cancel before the trial ends, you will be automatically charged 
              for the subscription. We reserve the right to limit free trials.
            </p>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              6.4 Cancellation and Refunds
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. 
              No refunds are provided for partial months or unused services, except:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Within 14 days of initial purchase (pro-rated refund)</li>
              <li>As required by applicable consumer protection laws</li>
              <li>At our sole discretion in cases of service failure</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              7. Intellectual Property Rights
            </h2>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              7.1 WorkPilot's Intellectual Property
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              The Services, including all content, features, functionality, software, and technology, are owned by WorkPilot AI 
              and protected by copyright, trademark, patent, and other intellectual property laws. You may not:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Copy, modify, or create derivative works</li>
              <li>Reverse engineer or decompile the Services</li>
              <li>Remove or alter proprietary notices</li>
              <li>Use our trademarks without written permission</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              7.2 Your Content
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              You retain ownership of content you upload or create using the Services ("Your Content"). By using the Services, 
              you grant us a worldwide, non-exclusive, royalty-free license to use, store, process, and display Your Content 
              solely to provide and improve the Services.
            </p>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              7.3 Feedback
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              Any feedback, suggestions, or ideas you provide become our property and may be used without compensation or attribution.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              8. Third-Party Integrations
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              The Services integrate with third-party platforms (Gmail, Slack, GitHub, etc.). By connecting these services:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>You authorize us to access your data from those platforms</li>
              <li>You agree to their respective terms of service and privacy policies</li>
              <li>We are not responsible for third-party service availability or data practices</li>
              <li>You can disconnect integrations at any time through your account settings</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              9. Disclaimers and Limitation of Liability
            </h2>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              9.1 "As-Is" Basis
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, 
              INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              9.2 Limitation of Liability
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WORKPILOT AI SHALL NOT BE LIABLE FOR:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Indirect, incidental, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions or data loss</li>
              <li>Third-party actions or content</li>
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '1rem' }}>
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim, 
              or $100, whichever is greater.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              10. Indemnification
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              You agree to indemnify and hold harmless WorkPilot AI, its affiliates, and personnel from any claims, damages, 
              losses, or expenses (including legal fees) arising from:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Your use or misuse of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of third-party rights</li>
              <li>Your Content or data</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              11. Dispute Resolution
            </h2>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              11.1 Informal Resolution
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              Before filing a claim, you agree to contact us at legal@workpilot.ai to seek informal resolution.
            </p>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              11.2 Binding Arbitration
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              If informal resolution fails, disputes shall be resolved through binding arbitration under the rules of the 
              American Arbitration Association, except where prohibited by law. The arbitration will be conducted in 
              San Francisco, California.
            </p>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              11.3 Class Action Waiver
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              You agree to resolve disputes on an individual basis and waive the right to participate in class actions, 
              except where prohibited by law.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              12. Governing Law
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              These Terms are governed by the laws of the State of California and the United States, without regard to 
              conflict of law principles. Any litigation shall be conducted in the courts of San Francisco County, California.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              13. Changes to Terms
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We may modify these Terms at any time. Material changes will be notified via email or in-app notification 
              at least 30 days before taking effect. Continued use of the Services after changes constitutes acceptance. 
              If you disagree with changes, you must stop using the Services and cancel your account.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple)' }}>
              14. Contact Information
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              For questions about these Terms, please contact:
            </p>
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'rgba(139,92,246,0.05)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '8px'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.5rem' }}>
                <strong>Legal Team:</strong> <a href="mailto:legal@workpilot.ai" style={{ color: 'var(--purple)', textDecoration: 'none' }}>legal@workpilot.ai</a>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.5rem' }}>
                <strong>Support:</strong> <a href="mailto:support@workpilot.ai" style={{ color: 'var(--purple)', textDecoration: 'none' }}>support@workpilot.ai</a>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.85)' }}>
                <strong>Address:</strong> WorkPilot AI Inc., 123 Innovation Street, San Francisco, CA 94105, USA
              </p>
            </div>
          </section>

        </div>

        {/* Back to Home */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <a 
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.85rem 2rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
