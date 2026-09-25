'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/contexts/ThemeContext';
import { lookbookImages } from './lookbookData';
import styles from './Lookbook.module.css';

/**
 * Editorial gallery. Renders only the photos whose own background matches the
 * active theme, so a dark photo never lands on a white page and vice versa —
 * each shot blends seamlessly into the canvas. Client component because the
 * selection depends on the (client-side) theme; before hydration it renders
 * nothing to avoid a flash of the wrong set.
 */
export function Lookbook() {
  const { theme } = useTheme();
  const images = lookbookImages.filter((image) => image.theme === theme);

  if (images.length === 0) return null;

  return (
    <section id="lookbook" className={styles.section} aria-labelledby="lookbook-heading">
      <div className={styles.head}>
        <span className={styles.kicker}>The Alora edit</span>
        <h2 id="lookbook-heading" className={styles.heading}>
          Looks from the chair
        </h2>
        <p className={styles.sub}>
          A little inspiration for your next visit — real texture, real range.
        </p>
      </div>

      <div className={styles.grid} data-count={images.length}>
        {images.map((image, index) => (
          <motion.figure
            key={image.src}
            className={styles.tile}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 24vw"
              className={styles.image}
            />
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
