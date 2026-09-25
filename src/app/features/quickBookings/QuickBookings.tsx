import Image from 'next/image';
import DynamicBanner from '@/app/components/banner/DynamicBanner';
import styles from './QuickBookings.module.css';

export default function QuickBookingsSection() {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <DynamicBanner
          kicker="Alora Studios"
          title="Ready to Glow Up?"
          subtitle="Book your appointment today and let me craft your perfect look."
          ctaLabel="Book Appointment"
          ctaHref="/book"
        />
        {/* Dark-mode-only accent: the photo's black backdrop dissolves into the
            band, so it only appears in dark mode. */}
        <div className={styles.portrait} aria-hidden="true">
          <Image
            src="/features/gold-skirt.webp"
            alt=""
            fill
            sizes="(max-width: 900px) 0px, 24vw"
            className={styles.portraitImg}
          />
        </div>
      </div>
    </div>
  );
}
