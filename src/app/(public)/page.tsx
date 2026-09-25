import styles from './page.module.css';
import Hero from '../components/hero/Hero';
import Services from '../features/servicesSection/ServiceSection';
import { PriceList } from '../features/priceList/PriceList';
import { listActiveServices } from '@/lib/data/services';
import LoyaltyPage from '../features/loyalty/Loyalty';
import QuickBookingsSection from '../features/quickBookings/QuickBookings';
import Testimonials from '../features/testimonials/Testimonials';

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

export default async function Home() {
  // Public menu straight from the catalog; a DB hiccup renders the empty state
  // rather than taking the homepage down.
  const services = await listActiveServices().catch((error: unknown) => {
    console.error('[home] failed to load the service catalog', error);
    return [];
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Hero />
      <div className={styles.home}>
        <Services />
        <PriceList services={services} />
        <LoyaltyPage />
        <QuickBookingsSection />
        <Testimonials />
      </div>
    </>
  );
}
