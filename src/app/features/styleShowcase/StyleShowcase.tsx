'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatZar, formatDuration } from '@/lib/format';
import { routes } from '@/app/config/routes';
import ProtectedLink from '@/app/components/protected/ProtectedLink';
import styles from './StyleShowcase.module.css';

export interface ShowcaseStyle {
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  pointsAwarded: number;
  /** Transparent cutout (public path). Null until artwork is supplied. */
  imageUrl: string | null;
}

interface StyleShowcaseProps {
  items: ShowcaseStyle[];
}

/**
 * Style showcase: one composition per style (script eyebrow, oversized name,
 * cutout portrait in front, price and Book). A scroll-snap track shows three
 * per screen on desktop, paged by arrows and dots; native swipe on touch.
 */
export function StyleShowcase({ items }: StyleShowcaseProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  // A page is the visible set of slides plus the gap that follows it, so the
  // next page lands exactly on a slide edge with nothing peeking.
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

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(pageCount - 1, target));
    track.scrollTo({ left: clamped * pageWidth(track), behavior: 'smooth' });
  };

  if (items.length === 0) {
    return (
      <section id="styles" className={styles.section} aria-labelledby="styles-heading">
        <p className={styles.kicker} id="styles-heading">
          Styles &amp; prices
        </p>
        <p className={styles.empty}>Our style menu is being updated. Please check back shortly.</p>
      </section>
    );
  }

  return (
    <section id="styles" className={styles.section} aria-labelledby="styles-heading">
      <div className={styles.topBar}>
        <p className={styles.kicker} id="styles-heading">
          Styles &amp; prices
        </p>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Previous styles"
            disabled={page === 0}
            onClick={() => goTo(page - 1)}
          >
            <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.arrow}
            aria-label="Next styles"
            disabled={page >= pageCount - 1}
            onClick={() => goTo(page + 1)}
          >
            <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={styles.viewport}>
        <div ref={trackRef} className={styles.track} role="list" aria-label="Hairstyles and prices">
          {items.map((item) => (
            <article key={item.slug} className={styles.slide} role="listitem">
              <div className={`${styles.stage}${item.imageUrl ? '' : ` ${styles.stageNoArt}`}`}>
                <svg className={styles.ring} viewBox="0 0 400 180" aria-hidden="true">
                  <ellipse cx="200" cy="90" rx="196" ry="86" />
                </svg>
                <p className={styles.eyebrow}>signature style</p>
                <h3 className={styles.name}>{item.name}</h3>
                {item.imageUrl && (
                  <div className={styles.portrait}>
                    <Image
                      src={item.imageUrl}
                      alt={`${item.name} on a client`}
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
                  <span className={styles.price}>{formatZar(item.priceCents)}</span>
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
        <div className={styles.dots} role="tablist" aria-label="Style pages">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === page}
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
