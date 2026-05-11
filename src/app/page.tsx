import styles from './page.module.css';
import Hero from './components/hero/Hero';
import Services from './features/servicesSection/ServiceSection';
import LoyaltyPage from './features/loyalty/Loyalty';
import QuickBookingsSection from './features/quickBookings/QuickBookings';
import Testimonials from './features/testimonials/Testimonials';

export default function Home() {
  return (
    <>
      <Hero />
      <div className={styles.home}>
        <Services />
        <LoyaltyPage />
        <QuickBookingsSection />
        <Testimonials />
      </div>
    </>
  );
}
