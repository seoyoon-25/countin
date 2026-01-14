import { Navbar, Hero, Features, Customers, Pricing, CTA, Footer } from './components';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <Customers />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
