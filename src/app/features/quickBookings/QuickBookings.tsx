import DynamicBanner from '@/app/components/banner/DynamicBanner';
import styles from './QuickBookings.module.css';

export default function QuickBookingsSection() {
  return (
    <div className={styles.wrap}>
      <DynamicBanner
        kicker="Alora Studios"
        title="Ready to Glow Up?"
        subtitle="Book your appointment today and let me craft your perfect look."
        ctaLabel="Book Appointment"
        ctaHref="https://preview--alora-glow-studio.base44.app/book"
      />
    </div>
  );
}
