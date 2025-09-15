export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent">
        Terms of Service
      </h1>

      <div className="space-y-6 text-gray-300">
        <section>
          <p className="text-sm text-gray-400 mb-4">Effective Date: January 1, 2025</p>
          <p>
            By accessing or using BizarreBeasts ("the App"), you agree to be bound by these
            Terms of Service ("Terms"). If you do not agree, do not use the App.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>
            By using BizarreBeasts, you confirm that you are at least 18 years old and have
            the legal capacity to enter into these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
          <p>
            BizarreBeasts provides a decentralized application for:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Creating and sharing memes</li>
            <li>Token swapping and trading</li>
            <li>Community leaderboards and rankings</li>
            <li>Gaming and entertainment features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining the security of your wallet</li>
            <li>You must not use the App for illegal activities</li>
            <li>You must not attempt to exploit or hack the App</li>
            <li>You are responsible for all transactions made through your wallet</li>
            <li>You must comply with all applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
          <p>
            BizarreBeasts logos, designs, and content are protected by intellectual property laws.
            User-generated content remains the property of the users, but you grant us a license
            to display it within the App.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Token Trading</h2>
          <div className="space-y-2">
            <p className="font-semibold text-gem-gold">Important:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Token trading involves significant risk</li>
              <li>You may lose all invested funds</li>
              <li>We are not responsible for any financial losses</li>
              <li>Always do your own research (DYOR)</li>
              <li>We do not provide financial advice</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, BIZARREBEASTS SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS
            OF PROFITS, DATA, OR FUNDS.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless BizarreBeasts from any claims, damages,
            or expenses arising from your use of the App or violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the App
            after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
          <p>
            We may terminate or suspend access to the App at any time, without notice,
            for any reason, including breach of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in which you reside,
            without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
          <p>
            For questions about these Terms, contact us via Farcaster (@bizarrebeast)
            or Twitter/X (@bizarrebeasts_).
          </p>
        </section>

        <section className="pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Last updated: January 2025
          </p>
        </section>
      </div>
    </div>
  );
}