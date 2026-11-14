'use client';

import { useMemo, useState } from 'react';
import {
  marketingCsv,
  type CustomerSegment,
  type CustomerSummary,
  type DirectoryOverview,
} from '@/lib/customer-insights';
import { formatBookingDate, formatZar } from '@/lib/format';
import styles from './customers.module.css';

type SegmentFilter = 'all' | CustomerSegment;
type SortKey = 'recent' | 'spend' | 'visits' | 'next';

const SEGMENTS: { key: SegmentFilter; label: string; hint: string }[] = [
  { key: 'all', label: 'All', hint: 'Every account' },
  { key: 'upcoming', label: 'Upcoming', hint: 'Has a visit booked' },
  { key: 'returning', label: 'Returning', hint: 'Two or more completed visits' },
  { key: 'lapsed', label: 'Lapsed', hint: 'No visit in 90 days and nothing booked' },
  { key: 'never-booked', label: 'Never booked', hint: 'Signed up but never booked' },
  { key: 'marketing', label: 'Can market to', hint: 'Opted in to marketing' },
  { key: 'unverified', label: 'Unverified', hint: 'Email not confirmed yet' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Newest first' },
  { key: 'spend', label: 'Highest spend' },
  { key: 'visits', label: 'Most visits' },
  { key: 'next', label: 'Next visit' },
];

const STATUS_LABEL: Record<CustomerSummary['history'][number]['status'], string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function sortCustomers(list: CustomerSummary[], sort: SortKey): CustomerSummary[] {
  const sorted = [...list];
  if (sort === 'spend') sorted.sort((a, b) => b.spendCents - a.spendCents);
  if (sort === 'visits') sorted.sort((a, b) => b.completedVisits - a.completedVisits);
  if (sort === 'next') {
    sorted.sort((a, b) => {
      if (!a.nextVisit) return 1;
      if (!b.nextVisit) return -1;
      return Date.parse(a.nextVisit) - Date.parse(b.nextVisit);
    });
  }
  if (sort === 'recent') sorted.sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt));
  return sorted;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

interface CustomerDirectoryProps {
  customers: CustomerSummary[];
  overview: DirectoryOverview;
  now: string;
}

export function CustomerDirectory({ customers, overview, now }: CustomerDirectoryProps) {
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<SegmentFilter>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [open, setOpen] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<SegmentFilter, number> = {
      all: customers.length,
      upcoming: 0,
      returning: 0,
      lapsed: 0,
      'never-booked': 0,
      marketing: 0,
      unverified: 0,
    };
    for (const customer of customers) {
      for (const key of customer.segments) result[key] += 1;
    }
    return result;
  }, [customers]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = customers.filter(
      (customer) =>
        (segment === 'all' || customer.segments.includes(segment)) &&
        (!needle ||
          customer.name.toLowerCase().includes(needle) ||
          customer.email.toLowerCase().includes(needle)),
    );
    return sortCustomers(filtered, sort);
  }, [customers, query, segment, sort]);

  const exportMarketingList = () => {
    const blob = new Blob([marketingCsv(customers)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alora-marketing-list-${now.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeHint = SEGMENTS.find((item) => item.key === segment)?.hint;

  return (
    <div className={styles.directory}>
      <dl className={styles.strip}>
        <div className={styles.figure}>
          <dt>Customers</dt>
          <dd>{overview.customers}</dd>
          <p>{overview.newLast30Days} new in the last 30 days</p>
        </div>
        <div className={styles.figure}>
          <dt>Returning</dt>
          <dd>{percent(overview.returningShare)}</dd>
          <p>{overview.returning} of the customers who visited came back</p>
        </div>
        <div className={styles.figure}>
          <dt>Spend from visits</dt>
          <dd>{formatZar(overview.spendCents)}</dd>
          <p>Completed visits only</p>
        </div>
        <div className={styles.figure}>
          <dt>Next 7 days</dt>
          <dd>{overview.visitsNext7Days}</dd>
          <p>Visits booked this week</p>
        </div>
        <div className={styles.figure}>
          <dt>Can market to</dt>
          <dd>{overview.marketable}</dd>
          <p>Opted in under POPIA</p>
        </div>
      </dl>

      <div className={styles.controls}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search customers</span>
          <input
            type="search"
            placeholder="Search by name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className={styles.sort}>
          <span className={styles.srOnly}>Sort customers</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            {SORTS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.export}
          onClick={exportMarketingList}
          disabled={overview.marketable === 0}
        >
          Export marketing list
        </button>
      </div>

      <div className={styles.segments} role="tablist" aria-label="Customer segments">
        {SEGMENTS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={segment === item.key}
            className={styles.segment}
            onClick={() => setSegment(item.key)}
          >
            {item.label}
            <span className={styles.count}>{counts[item.key]}</span>
          </button>
        ))}
      </div>
      {segment !== 'all' && <p className={styles.segmentHint}>{activeHint}</p>}

      <section className={styles.panel} aria-label="Customer list">
        <div className={styles.columns} aria-hidden="true">
          <span>Customer</span>
          <span>Visits</span>
          <span>Spend</span>
          <span>Next visit</span>
          <span>Last visit</span>
          <span>Usually books</span>
        </div>

        {customers.length === 0 ? (
          <p className={styles.empty}>Customers appear here as people create accounts.</p>
        ) : visible.length === 0 ? (
          <p className={styles.empty}>No customers match this view.</p>
        ) : (
          <ul className={styles.rows}>
            {visible.map((customer) => {
              const expanded = open === customer.id;
              return (
                <li key={customer.id} className={styles.row} data-open={expanded || undefined}>
                  <button
                    type="button"
                    className={styles.summary}
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : customer.id)}
                  >
                    <span className={styles.who}>
                      <span className={styles.name}>
                        {customer.name}
                        {!customer.emailVerified && (
                          <span className={styles.tagMuted}>Unverified</span>
                        )}
                      </span>
                      <span className={styles.email}>{customer.email}</span>
                    </span>
                    <span className={styles.cell} data-label="Visits">
                      {customer.completedVisits}
                      {customer.cancelled > 0 && (
                        <span className={styles.sub}>{customer.cancelled} cancelled</span>
                      )}
                    </span>
                    <span className={styles.cell} data-label="Spend">
                      {customer.spendCents > 0 ? formatZar(customer.spendCents) : 'R0'}
                    </span>
                    <span className={styles.cell} data-label="Next visit">
                      {customer.nextVisit ? (
                        formatBookingDate(customer.nextVisit)
                      ) : (
                        <span className={styles.none}>Nothing booked</span>
                      )}
                    </span>
                    <span className={styles.cell} data-label="Last visit">
                      {customer.lastVisit ? (
                        formatBookingDate(customer.lastVisit)
                      ) : (
                        <span className={styles.none}>No visits yet</span>
                      )}
                    </span>
                    <span className={styles.cell} data-label="Usually books">
                      {customer.favouriteFamily ?? <span className={styles.none}>Unknown</span>}
                    </span>
                  </button>

                  {expanded && (
                    <div className={styles.detail}>
                      <dl className={styles.facts}>
                        <div>
                          <dt>Joined</dt>
                          <dd>{formatBookingDate(customer.joinedAt)}</dd>
                        </div>
                        <div>
                          <dt>Loyalty points</dt>
                          <dd>{customer.points}</dd>
                        </div>
                        <div>
                          <dt>Cancellation rate</dt>
                          <dd>
                            {customer.totalBookings ? percent(customer.cancellationRate) : 'None'}
                          </dd>
                        </div>
                        <div>
                          <dt>Marketing</dt>
                          <dd>{customer.marketingOptIn ? 'Opted in' : 'Not opted in'}</dd>
                        </div>
                      </dl>

                      {customer.history.length === 0 ? (
                        <p className={styles.none}>No bookings yet.</p>
                      ) : (
                        <ol className={styles.history}>
                          {customer.history.map((entry) => (
                            <li key={entry.id}>
                              <span>{formatBookingDate(entry.startsAt)}</span>
                              <span className={styles.historyService}>{entry.serviceName}</span>
                              <span className={styles[`status_${entry.status}`]}>
                                {STATUS_LABEL[entry.status]}
                              </span>
                              <span className={styles.historyPrice}>
                                {formatZar(entry.priceCents)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}

                      <a className={styles.mail} href={`mailto:${customer.email}`}>
                        Email {customer.name.split(' ')[0]}
                      </a>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
