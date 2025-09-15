export default function DisclaimerPage() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent">
        Disclaimer
      </h1>

      <div className="space-y-6 text-gray-300">
        {/* Important Warning Box */}
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2">
            ⚠️ IMPORTANT FINANCIAL DISCLAIMER
          </h2>
          <p className="text-white font-semibold">
            CRYPTOCURRENCY INVESTMENTS CARRY EXTREME RISK. YOU MAY LOSE ALL OF YOUR INVESTMENT.
            THIS IS NOT FINANCIAL ADVICE. ALWAYS DO YOUR OWN RESEARCH.
          </p>
        </div>

        <section>
          <p className="text-sm text-gray-400 mb-4">Effective Date: January 1, 2025</p>
          <p>
            Please read this disclaimer carefully before using BizarreBeasts or engaging in any
            token trading activities.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Not Financial Advice</h2>
          <p className="mb-3">
            Nothing on BizarreBeasts constitutes financial, investment, legal, or tax advice.
            The information provided is for entertainment and informational purposes only.
          </p>
          <p className="font-semibold text-gem-gold">
            NEVER make financial decisions based solely on information from this app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Investment Risks</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li className="text-red-300">Cryptocurrency prices are extremely volatile</li>
            <li className="text-red-300">You can lose 100% of your investment</li>
            <li className="text-red-300">Past performance does not indicate future results</li>
            <li className="text-red-300">Market manipulation and scams are common</li>
            <li className="text-red-300">Regulatory changes may affect token value</li>
            <li className="text-red-300">Technical issues may result in loss of funds</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. $BB Token Disclaimer</h2>
          <p className="mb-3">
            BizarreBeasts ($BB) is a community token with no intrinsic value. It is:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>NOT an investment vehicle</li>
            <li>NOT a security or financial instrument</li>
            <li>NOT backed by any assets or guarantees</li>
            <li>Created for community engagement and entertainment</li>
            <li>Subject to extreme price volatility</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. No Warranties</h2>
          <p>
            BizarreBeasts is provided "AS IS" without any warranties, express or implied.
            We do not guarantee:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Accuracy of information</li>
            <li>Continuous service availability</li>
            <li>Security from hacks or exploits</li>
            <li>Profitability of any trades</li>
            <li>Future token value or liquidity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. User Responsibility</h2>
          <p className="mb-3">By using this app, you acknowledge that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are solely responsible for your investment decisions</li>
            <li>You understand and accept all risks involved</li>
            <li>You will not hold BizarreBeasts liable for any losses</li>
            <li>You have conducted your own research</li>
            <li>You are legally allowed to trade cryptocurrencies in your jurisdiction</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Third-Party Services</h2>
          <p>
            We integrate with third-party services (DEXs, wallets, blockchains). We are not
            responsible for their operation, security, or any losses resulting from their use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Leaderboards and Rankings</h2>
          <p>
            Leaderboard positions and rankings are for entertainment purposes only. They do not
            constitute endorsements or investment recommendations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Memes and Content</h2>
          <p>
            User-generated memes and content are for entertainment only. They should not be
            interpreted as financial advice or endorsements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
          <p className="font-semibold uppercase">
            Under no circumstances shall BizarreBeasts, its creators, contributors, or affiliates
            be liable for any direct, indirect, incidental, special, or consequential damages
            resulting from the use or inability to use this service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">10. Seek Professional Advice</h2>
          <p className="text-gem-gold font-semibold">
            Always consult with qualified financial, legal, and tax professionals before making
            any investment decisions.
          </p>
        </section>

        {/* Final Warning Box */}
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-6 mt-8">
          <p className="text-yellow-300 font-bold text-center">
            INVEST ONLY WHAT YOU CAN AFFORD TO LOSE
          </p>
          <p className="text-yellow-200 text-center mt-2">
            Cryptocurrency trading is not suitable for everyone.
            Consider your financial situation carefully.
          </p>
        </div>

        <section className="pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            By using BizarreBeasts, you acknowledge that you have read, understood, and agree
            to this disclaimer in its entirety.
          </p>
        </section>
      </div>
    </div>
  );
}