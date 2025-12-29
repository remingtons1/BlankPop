export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold">
            <span className="text-white">Blank</span>
            <span className="text-emerald-400">Pop</span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-zinc-400 mb-8">Last updated: December 29, 2025</p>

          <div className="prose prose-invert prose-zinc max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-zinc-300 leading-relaxed">
                By accessing or using BlankPop&apos;s services through ChatGPT or our website at blankpop.online, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Services</h2>
              <p className="text-zinc-300 leading-relaxed">
                BlankPop provides custom merchandise creation services. Users can describe designs through ChatGPT, which are then generated using AI and printed on various products including t-shirts, hoodies, mugs, and posters. Products are manufactured on-demand and shipped directly to customers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Orders and Payment</h2>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>All prices are listed in USD and include applicable taxes where required</li>
                <li>Payment is processed securely through Stripe at the time of order</li>
                <li>Orders are confirmed once payment is successfully processed</li>
                <li>We reserve the right to refuse or cancel orders at our discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Custom Designs and Intellectual Property</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                By using our services, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>You have the right to use any content or concepts you submit for design creation</li>
                <li>Your designs do not infringe on any third-party intellectual property rights</li>
                <li>Your designs do not contain illegal, harmful, threatening, abusive, or otherwise objectionable content</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed mt-4">
                AI-generated designs created through our service are provided for your personal use on our products. You retain rights to the creative concepts you provide.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Prohibited Content</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                We reserve the right to refuse to produce products containing:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>Copyrighted material you do not have rights to use</li>
                <li>Trademarked logos or brand names without authorization</li>
                <li>Hate speech, discriminatory content, or offensive material</li>
                <li>Adult or explicit content</li>
                <li>Content promoting illegal activities</li>
                <li>Content that violates any applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Shipping and Delivery</h2>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>Products are made-to-order and typically ship within 3-7 business days</li>
                <li>Delivery times vary based on shipping destination and method selected</li>
                <li>We are not responsible for delays caused by shipping carriers or customs</li>
                <li>Risk of loss transfers to you upon delivery to the carrier</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Returns and Refunds</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                Due to the custom nature of our products:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>We do not accept returns for custom-designed items unless they are defective or damaged</li>
                <li>If you receive a defective or damaged product, contact us within 14 days of delivery</li>
                <li>We will provide a replacement or refund for verified defects at our discretion</li>
                <li>Refunds are processed to the original payment method within 5-10 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-zinc-300 leading-relaxed">
                To the maximum extent permitted by law, BlankPop shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
              <p className="text-zinc-300 leading-relaxed">
                You agree to indemnify and hold harmless BlankPop and its affiliates from any claims, damages, losses, or expenses arising from your use of our services or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-zinc-300 leading-relaxed">
                We may modify these terms at any time. Continued use of our services after changes constitutes acceptance of the modified terms. We encourage you to review these terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
              <p className="text-zinc-300 leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p className="text-zinc-300 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-zinc-300 mt-4">
                <strong>Email:</strong> support@formpop.online
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-bold">
            <span className="text-white">Blank</span>
            <span className="text-emerald-400">Pop</span>
          </div>
          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} BlankPop. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-zinc-400">
            <a href="/privacy" className="hover:text-white transition">Privacy</a>
            <a href="/terms" className="hover:text-white transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
