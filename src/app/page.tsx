import styles from './page.module.css';
import Hero from './components/hero/Hero';
import Services from './servicesView/page';

export default function Home() {
  return (
    <>
      <Hero />
      <div className={styles.landing}>
        <Services />
      </div>
    </>
  );
}
