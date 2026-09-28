'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDuration, formatPrice, type PriceShape } from '@/lib/format';
import { routes } from '@/app/config/routes';
import ProtectedLink from '@/app/components/protected/ProtectedLink';
import { groupByFamily } from '@/app/features/servicesSection/servicesData';
import styles from './StyleShowcase.module.css';

export interface ShowcaseStyle {
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  priceCents: number;
  priceType: PriceShape;
  priceMaxCents: number | null;
  durationMinutes: number;
  pointsAwarded: number;
  imageUrl: string | null;
}

interface StyleShowcaseProps {
  items: ShowcaseStyle[];
}

const LONG_NAME = 16;

export function StyleShowcase({ items }: StyleShowcaseProps) {
  const groups = useMemo(() => groupByFamily(items), [items]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = groups.find((group) => group.family.slug === activeSlug) ?? groups[0];

  const trackRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const pageWidth = (track: HTMLDivElement): number => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return track.clientWidth + gap;
  };

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const width = pageWidth(track);
    const pages = Math.max(1, Math.ceil((track.scrollWidth + 1) / width));
    setPageCount(pages);
    setPage(Math.min(pages - 1, Math.round(track.scrollLeft / width)));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    track.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      track.removeEventListener('scroll', measure);
    };
  }, [measure]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: 0 });
    measure();
  }, [active?.family.slug, measure]);

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(pageCount - 1, target));
    track.scrollTo({ left: clamped * pageWidth(track), behavior: 'smooth' });
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + groups.length) % groups.length;
    setActiveSlug(groups[next].family.slug);
    tabRefs.current[next]?.focus();
  };

  if (!active) {
    return (
      <section id="styles" className={styles.section} aria-labelledby="styles-heading">
        <p className={styles.kicker} id="styles-heading">
          Services &amp; prices
        </p>
        <p className={styles.empty}>
          Our service menu is being updated. Please check back shortly.
        </p>
      </section>
    );
  }

  const panelId = `showcase-panel-${active.family.slug}`;

  return (
    <section id="styles" className={styles.section} aria-labelledby="styles-heading">
      <div className={styles.topBar}>
        <p className={styles.kicker} id="styles-heading">
          Services &amp; prices
        </p>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            aria-label={`Previous ${active.family.title} services`}
            disabled={page === 0}
            onClick={() => goTo(page - 1)}
          >
            <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.arrow}
            aria-label={`Next ${active.family.title} services`}
            disabled={page >= pageCount - 1}
            onClick={() => goTo(page + 1)}
          >
            <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Service families">
        {groups.map((group, index) => {
          const selected = group.family.slug === active.family.slug;
          return (
            <button
              key={group.family.slug}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`showcase-tab-${group.family.slug}`}
              aria-selected={selected}
              aria-controls={`showcase-panel-${group.family.slug}`}
              tabIndex={selected ? 0 : -1}
              className={`${styles.tab}${selected ? ` ${styles.tabActive}` : ''}`}
              onClick={() => setActiveSlug(group.family.slug)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              {group.family.title}
            </button>
          );
        })}
      </div>

      <div className={styles.viewport}>
        <div
          ref={trackRef}
          id={panelId}
          className={styles.track}
          role="tabpanel"
          aria-labelledby={`showcase-tab-${active.family.slug}`}
        >
          {active.items.map((item) => (
            <article key={item.slug} className={styles.slide}>
              <div className={`${styles.stage}${item.imageUrl ? '' : ` ${styles.stageNoArt}`}`}>
                <svg className={styles.ring} viewBox="0 0 400 180" aria-hidden="true">
                  <ellipse cx="200" cy="90" rx="196" ry="86" />
                </svg>
                <p className={styles.eyebrow}>{active.family.title.toLowerCase()}</p>
                <h3
                  className={`${styles.name}${item.name.length > LONG_NAME ? ` ${styles.nameLong}` : ''}`}
                >
                  {item.name}
                </h3>
                {item.imageUrl && (
                  <div className={styles.portrait}>
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                      className={styles.portraitImage}
                    />
                  </div>
                )}
              </div>

              <div className={styles.panel}>
                <div className={styles.panelText}>
                  {item.description && <p className={styles.description}>{item.description}</p>}
                  <p className={styles.meta}>
                    <span>{formatDuration(item.durationMinutes)}</span>
                    {item.pointsAwarded > 0 && <span>+{item.pointsAwarded} points</span>}
                  </p>
                </div>
                <div className={styles.buy}>
                  <span className={styles.price}>{formatPrice(item)}</span>
                  <ProtectedLink
                    href={`${routes.bookNow.path}?service=${item.slug}`}
                    className={styles.book}
                  >
                    Book
                  </ProtectedLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <div className={styles.dots} aria-label={`${active.family.title} pages`}>
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-current={index === page ? 'true' : undefined}
              aria-label={`Page ${index + 1} of ${pageCount}`}
              className={`${styles.dot}${index === page ? ` ${styles.dotActive}` : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
