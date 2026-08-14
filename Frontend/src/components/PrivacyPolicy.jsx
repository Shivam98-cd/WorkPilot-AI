import React from 'react';

export default function PrivacyPolicy() {
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
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Privacy Policy
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              1. Introduction
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              WorkPilot AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our workplace automation platform and services.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '1rem' }}>
              By using WorkPilot AI, you agree to the collection and use of information in accordance with this policy. 
              If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              2. Information We Collect
            </h2>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              2.1 Personal Information
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              When you register for WorkPilot AI, we collect:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Name and email address</li>
              <li>Company name and job title</li>
              <li>Account credentials (encrypted passwords)</li>
              <li>Payment information (processed securely via third-party providers)</li>
              <li>Profile information and preferences</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              2.2 Integration Data
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              When you connect third-party services, we access:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Email content and metadata (Gmail, Outlook)</li>
              <li>Calendar events and availability</li>
              <li>Task and project management data (Jira, Asana)</li>
              <li>Code repository information (GitHub)</li>
              <li>Communication data (Slack, Microsoft Teams)</li>
            </ul>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem' }}>
              2.3 Usage Data
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We automatically collect:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Pages visited and features used</li>
              <li>Time and date of access</li>
              <li>Performance and error logs</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              3. How We Use Your Information
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We use collected information to:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Provide, operate, and maintain our services</li>
              <li>Process automation workflows and AI-powered tasks</li>
              <li>Improve and personalize user experience</li>
              <li>Communicate with you about service updates and support</li>
              <li>Process payments and prevent fraud</li>
              <li>Analyze usage patterns and optimize performance</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              4. Data Storage and Security
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We implement industry-standard security measures:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li><strong>Access Controls:</strong> Role-based access control (RBAC) and multi-factor authentication</li>
              <li><strong>Data Centers:</strong> SOC2 Type II certified infrastructure</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and incident response</li>
              <li><strong>Regular Audits:</strong> Annual third-party security assessments</li>
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '1rem' }}>
              We retain your data for as long as your account is active or as needed to provide services. 
              You can request data deletion at any time.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              5. Data Sharing and Disclosure
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We do not sell your personal information. We may share data with:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li><strong>Service Providers:</strong> Third-party vendors who assist in operations (hosting, analytics, payment processing)</li>
              <li><strong>Connected Services:</strong> Integrated platforms you authorize (Gmail, Slack, etc.)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of merger, acquisition, or sale of assets</li>
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '1rem' }}>
              All third-party service providers are contractually bound to protect your data and use it only for specified purposes.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              6. Your Rights and Choices
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              You have the right to:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Revoke Consent:</strong> Disconnect integrated services at any time</li>
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '1rem' }}>
              To exercise these rights, contact us at <a href="mailto:privacy@workpilot.ai" style={{ color: 'var(--blue)', textDecoration: 'none' }}>privacy@workpilot.ai</a>
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              7. Cookies and Tracking Technologies
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We use cookies and similar technologies to:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Maintain user sessions and authentication</li>
              <li>Remember preferences and settings</li>
              <li>Analyze usage patterns and improve services</li>
              <li>Deliver personalized content</li>
            </ul>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '1rem' }}>
              You can control cookie preferences through your browser settings. Note that disabling cookies may limit functionality.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              8. International Data Transfers
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              WorkPilot AI operates globally. If you are located outside the United States, your data may be transferred to 
              and processed in the U.S. or other countries. We ensure appropriate safeguards are in place through:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>EU-U.S. Data Privacy Framework compliance</li>
              <li>GDPR-compliant data processing agreements</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              9. Children's Privacy
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              WorkPilot AI is not intended for individuals under 18 years of age. We do not knowingly collect personal 
              information from children. If you believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              10. Changes to This Policy
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last Updated" date. 
              We encourage you to review this policy regularly. Continued use of our services after changes constitutes acceptance 
              of the updated policy.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              11. Contact Us
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'rgba(59,130,246,0.05)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '8px'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.5rem' }}>
                <strong>Email:</strong> <a href="mailto:privacy@workpilot.ai" style={{ color: 'var(--blue)', textDecoration: 'none' }}>privacy@workpilot.ai</a>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.5rem' }}>
                <strong>Address:</strong> WorkPilot AI Inc., 123 Innovation Street, San Francisco, CA 94105, USA
              </p>
              <p style={{ color: 'rgba(255,255,255,0.85)' }}>
                <strong>Data Protection Officer:</strong> <a href="mailto:dpo@workpilot.ai" style={{ color: 'var(--blue)', textDecoration: 'none' }}>dpo@workpilot.ai</a>
              </p>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--blue)' }}>
              12. Compliance Certifications
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              WorkPilot AI is compliant with:
            </p>
            <ul style={{ color: 'rgba(255,255,255,0.75)', paddingLeft: '2rem', marginTop: '0.75rem' }}>
              <li>General Data Protection Regulation (GDPR) - EU</li>
              <li>California Consumer Privacy Act (CCPA) - USA</li>
              <li>SOC 2 Type II</li>
              <li>ISO 27001 Information Security Management</li>
              <li>HIPAA (for healthcare customers)</li>
            </ul>
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
              background: 'linear-gradient(135deg, var(--blue), var(--purple))',
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
