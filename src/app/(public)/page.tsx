import styles from './page.module.css';
import Hero from '../components/hero/Hero';
import Services from '../features/servicesSection/ServiceSection';
import LoyaltyPage from '../features/loyalty/Loyalty';
import QuickBookingsSection from '../features/quickBookings/QuickBookings';
import Testimonials from '../features/testimonials/Testimonials';
import FloatingThemeToggle from '../components/FloatingThemeToggle';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
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
