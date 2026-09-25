import Link from 'next/link';
import { formatZar } from '@/lib/format';
import { routes } from '@/app/config/routes';
import ProtectedLink from '@/app/components/protected/ProtectedLink';
import styles from './PriceList.module.css';

export interface PriceListItem {
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  priceCents: number;
  durationMinutes: number;
  pointsAwarded: number;
}

interface PriceListProps {
  services: PriceListItem[];
}

const UNCATEGORISED = 'Services';

function groupByCategory(services: PriceListItem[]): Map<string, PriceListItem[]> {
  const groups = new Map<string, PriceListItem[]>();
  for (const service of services) {
    const key = service.category?.trim() || UNCATEGORISED;
    const list = groups.get(key) ?? [];
    list.push(service);
    groups.set(key, list);
  }
  return groups;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : `${hours} hr ${rest} min`;
}

/**
 * Public price list. Server component fed by the live catalog: the menu the
 * salon edits in the database is the menu customers see, and it is the same
 * price snapshotted at booking time (ECTA s43(1)(i): full price up front).
 */
export function PriceList({ services }: PriceListProps): React.JSX.Element {
  const groups = groupByCategory(services);

  return (
    <section id="pricing" className={styles.section} aria-labelledby="pricing-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Price list</p>
          <h2 id="pricing-heading" className={styles.heading}>
            Our Menu
          </h2>
        </div>
        <p className={styles.note}>
          All prices in Rand, the full amount you pay. Pay online or at the salon.{' '}
          <Link href={`${routes.terms.path}#cancellations`}>Cancellation policy</Link>
        </p>
      </div>

      {services.length === 0 ? (
        <p className={styles.empty}>Our menu is being updated. Please check back shortly.</p>
      ) : (
        <div className={styles.groups}>
          {[...groups.entries()].map(([category, items]) => (
            <div key={category} className={styles.group}>
              <h3 className={styles.category}>{category}</h3>
              <ul className={styles.list}>
                {items.map((item) => (
                  <li key={item.slug} className={styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.name}>{item.name}</span>
                      <span className={styles.leader} aria-hidden="true" />
                      <span className={styles.price}>{formatZar(item.priceCents)}</span>
                    </div>
                    <div className={styles.rowMeta}>
                      {item.description && (
                        <span className={styles.description}>{item.description}</span>
                      )}
                      <span className={styles.facts}>
                        <span>{formatDuration(item.durationMinutes)}</span>
                        {item.pointsAwarded > 0 && <span>+{item.pointsAwarded} points</span>}
                        <ProtectedLink
                          href={`${routes.bookNow.path}?service=${item.slug}`}
                          className={styles.book}
                        >
                          Book →
                        </ProtectedLink>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
