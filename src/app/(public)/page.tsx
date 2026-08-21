import styles from './page.module.css';
import Hero from '../components/hero/Hero';
import Services from '../features/servicesSection/ServiceSection';
import LoyaltyPage from '../features/loyalty/Loyalty';
import QuickBookingsSection from '../features/quickBookings/QuickBookings';
import Testimonials from '../features/testimonials/Testimonials';
import FloatingThemeToggle from '../components/FloatingThemeToggle';
import Footer from '../components/footer/Footer';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// JSON-LD structured data — lets search engines render Alora as a rich
// LocalBusiness result (the single highest-ROI SEO artifact for a booking
// business). Address/geo are intentionally omitted until confirmed rather than
// guessed; extend this object as those details are finalised.
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'HairSalon',
  name: 'Alora',
  description: 'Premium hair and beauty appointments with loyalty rewards on every visit.',
  url: siteUrl,
  priceRange: '$$',
  currenciesAccepted: 'ZAR',
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Hero />
      <div className={styles.home}>
        <Services />
        <LoyaltyPage />
        <QuickBookingsSection />
        <Testimonials />
      </div>
      <FloatingThemeToggle />
      <Footer />
    </>
  );
}
