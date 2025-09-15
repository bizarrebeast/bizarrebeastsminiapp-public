export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent">
        Privacy Policy
      </h1>

      <div className="space-y-6 text-gray-300">
        <section>
          <p className="text-sm text-gray-400 mb-4">Effective Date: January 1, 2025</p>
          <p>
            BizarreBeasts ("we," "our," or "us") respects your privacy and is committed to protecting your personal information.
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Wallet addresses and transaction data when you connect your wallet</li>
            <li>Farcaster profile information if you connect through Farcaster</li>
            <li>Usage data and analytics to improve our services</li>
            <li>Information stored locally in your browser (localStorage)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our services</li>
            <li>To display your rank on leaderboards</li>
            <li>To enable token swaps and transactions</li>
            <li>To improve user experience and app functionality</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Data Storage</h2>
          <p>
            Most data is stored locally in your browser. Wallet addresses and public blockchain data
            are inherently public. We do not store private keys or sensitive wallet information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
          <p>We integrate with:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Farcaster for social features</li>
            <li>Base blockchain for transactions</li>
            <li>DEX aggregators for token swaps</li>
            <li>IPFS for decentralized storage</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
          <p>
            You can clear your local data at any time through your browser settings.
            Blockchain transactions are immutable and cannot be deleted.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Security</h2>
          <p>
            We implement industry-standard security measures. However, no method of electronic
            transmission or storage is 100% secure. Always protect your wallet seed phrases.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
          <p>
            For privacy concerns, contact us through our official channels on Farcaster
            (@bizarrebeast) or Twitter/X (@bizarrebeasts_).
          </p>
        </section>

        <section className="pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            This Privacy Policy may be updated periodically. Continued use of the app
            constitutes acceptance of any changes.
          </p>
        </section>
      </div>
    </div>
  );
}