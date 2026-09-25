import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatZar } from '@/lib/format';
import { listActiveServices } from '@/lib/data/services';
import { routes } from '@/app/config/routes';
import { cancellationPolicy } from '@/app/config/business';
import ProtectedLink from '@/app/components/protected/ProtectedLink';
import { getServiceFamily, serviceFamilies } from '@/app/features/servicesSection/servicesData';
import styles from '../services.module.css';

// The menu strip reads the live catalog per request.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return serviceFamilies.map((family) => ({ slug: family.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const family = getServiceFamily(slug);
  if (!family) return { title: 'Service' };
  return {
    title: family.title,
    description: family.description,
    alternates: { canonical: `${routes.servicesIndex.path}/${family.slug}` },
  };
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : `${hours} hr ${rest} min`;
}

/**
 * Service family detail: a descriptive piece (intro, numbered inclusions,
 * prep notes) plus the family's styles from the catalog as a compact menu
 * strip. Families without catalog entries yet show an honest empty state
 * that still leads to booking.
 */
export default async function ServiceFamilyPage({ params }: PageProps) {
  const { slug } = await params;
  const family = getServiceFamily(slug);
  if (!family) notFound();

  const catalog = await listActiveServices().catch(() => []);
  const menu = catalog.filter((item) => item.category && family.categories.includes(item.category));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Service</p>
          <h1 className={styles.title}>{family.title}</h1>
          <p className={styles.intro}>{family.intro}</p>
          <div className={styles.heroActions}>
            <ProtectedLink href={routes.bookNow.path} className={styles.primary}>
              Book now
            </ProtectedLink>
            <a href="#menu" className={styles.secondary}>
              See prices
            </a>
          </div>
        </div>
        <div className={styles.heroImage}>
          <Image src={family.img} alt="" fill priority sizes="(max-width: 760px) 100vw, 50vw" />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="includes-heading">
        <div className={styles.sectionHead}>
          <h2 id="includes-heading" className={styles.heading}>
            What&rsquo;s included
          </h2>
        </div>
        <ol className={styles.includes}>
          {family.includes.map((step) => (
            <li key={step.title} className={styles.include}>
              <div>
                <h3 className={styles.includeTitle}>{step.title}</h3>
                <p className={styles.includeBody}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="menu" className={styles.section} aria-labelledby="menu-heading">
        <div className={styles.sectionHead}>
          <h2 id="menu-heading" className={styles.heading}>
            {family.title} menu
          </h2>
          <Link href={routes.styles.path} className={styles.secondary}>
            All styles
          </Link>
        </div>
        {menu.length === 0 ? (
          <p className={styles.stripEmpty}>
            Prices for {family.title.toLowerCase()} are quoted at your consultation while we finish
            loading this menu. Book and tell us what you have in mind.
          </p>
        ) : (
          <ul className={styles.strip}>
            {menu.map((item) => (
              <li key={item.slug} className={styles.stripRow}>
                <div className={styles.thumb}>
                  {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="56px" />}
                </div>
                <div>
                  <p className={styles.stripName}>{item.name}</p>
                  {item.description && <p className={styles.stripDesc}>{item.description}</p>}
                </div>
                <span className={styles.stripMeta}>{formatDuration(item.durationMinutes)}</span>
                <span className={styles.stripPrice}>{formatZar(item.priceCents)}</span>
                <ProtectedLink
                  href={`${routes.bookNow.path}?service=${item.slug}`}
                  className={styles.stripBook}
                >
                  Book
                </ProtectedLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="prep-heading">
        <div className={styles.sectionHead}>
          <h2 id="prep-heading" className={styles.heading}>
            Before you come
          </h2>
        </div>
        <ul className={styles.prep}>
          {family.prep.map((note) => (
            <li key={note} className={styles.prepItem}>
              {note}
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.cta}>
        <div>
          <p className={styles.ctaTitle}>Ready when you are.</p>
          <p className={styles.ctaBody}>
            Pay online or at the salon. Full refund if you cancel{' '}
            {cancellationPolicy.fullRefundHours} hours or more before.
          </p>
        </div>
        <ProtectedLink href={routes.bookNow.path} className={styles.primary}>
          Book {family.title.toLowerCase()}
        </ProtectedLink>
      </div>
    </main>
  );
}
