import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { routes } from '@/app/config/routes';
import { serviceFamilies } from '@/app/features/servicesSection/servicesData';
import styles from './services.module.css';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Wig care, hair styling, nail art, makeup and matric farewell looks at Alora. What each service includes, what it costs and how to prepare.',
  alternates: { canonical: routes.servicesIndex.path },
};

export default function ServicesIndexPage(): React.JSX.Element {
  return (
    <main className={styles.page}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>Services</p>
        <h1 className={styles.title}>What we do</h1>
        <p className={styles.intro}>
          Five service families, each with its own page: what is included, the styles and prices
          behind it, and how to prepare for your appointment.
        </p>
      </div>
      <div className={styles.indexGrid}>
        {serviceFamilies.map((family) => (
          <Link
            key={family.slug}
            href={`${routes.servicesIndex.path}/${family.slug}`}
            className={styles.indexItem}
          >
            <Image src={family.img} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
            <div className={styles.indexCopy}>
              <h2 className={styles.indexTitle}>{family.title}</h2>
              <p className={styles.indexDesc}>{family.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
