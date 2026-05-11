import styles from './page.module.css';
import Hero from './components/hero/Hero';
import Services from './features/servicesSection/ServiceSection';
import LoyaltyPage from './features/loyalty/Loyalty';

export default function Home() {
  return (
    <>
      <Hero />
      <div className={styles.home}>
        <Services />
        <LoyaltyPage />
      </div>
    </>
  );
}
