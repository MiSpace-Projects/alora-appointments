'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedLink from '../protected/ProtectedLink';
import styles from './Hero.module.css';
import { heroVariants, textBlockVariants, visualVariants } from './heroAnimations';
import { heroActions, heroCopy } from './heroData';

const heroMarkers = [
  { label: 'Makeup', className: styles.makeupMarker },
  { label: 'Wig care', className: styles.wigCareMarker },
  { label: 'Wig installations', className: styles.wigInstallationsMarker },
] as const;

export default function Hero() {
  return (
    <motion.section
      className={styles.hero}
      initial="hidden"
      animate="visible"
      variants={heroVariants}
    >
      <motion.div className={styles.content} variants={textBlockVariants}>
        <p className={styles.label}>{heroCopy.label}</p>
        <h1 className={styles.title}>{heroCopy.title}</h1>
        <p className={styles.description}>{heroCopy.description}</p>

        <div className={styles.actions}>
          {heroActions.map((action) => {
            const className = styles[action.variant];
            const content = (
              <>
                {action.label}
                <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.7} />
              </>
            );

            return action.protected ? (
              <ProtectedLink key={action.href} href={action.href} className={className}>
                {content}
              </ProtectedLink>
            ) : (
              <Link key={action.href} href={action.href} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div className={styles.portrait} variants={visualVariants}>
        <Image
          src="/hero/alora-afro-profile-light-fitted.jpg"
          alt="Monochrome side-profile portrait of a woman with natural hair"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 60vw"
          className={`${styles.portraitImage} ${styles.lightPortrait}`}
        />
        <Image
          src="/hero/alora-braided-model-dark.jpg"
          alt="Monochrome portrait of a woman with long braids"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 60vw"
          className={`${styles.portraitImage} ${styles.darkPortrait}`}
        />

        <ul className={styles.markerLayer}>
          {heroMarkers.map((marker) => (
            <li key={marker.label} className={`${styles.marker} ${marker.className}`}>
              <span className={styles.markerPoint} aria-hidden="true" />
              <span className={styles.markerLine} aria-hidden="true" />
              <span className={styles.markerLabel}>{marker.label}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.section>
  );
}
