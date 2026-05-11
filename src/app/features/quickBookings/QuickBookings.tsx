import DynamicBanner from '@/app/components/banner/DynamicBanner';
import styles from './QuickBookings.module.css';

export default function QuickBookingsSection() {
  return (
    <div className={styles.wrap}>
      <DynamicBanner
        kicker="Alora Beauty Studio"
        title="Ready to Glow Up?"
        subtitle="Book your appointment today and let our team craft your perfect look."
        ctaLabel="Book Appointment"
        ctaHref="https://preview--alora-glow-studio.base44.app/book"
      />
    </div>
  );
}
