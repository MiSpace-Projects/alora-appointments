'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedLink from '../protected/ProtectedLink';
import styles from './Hero.module.css';
import { HeroPortrait } from './HeroPortrait';
import { heroVariants, textBlockVariants, visualVariants } from './heroAnimations';
import { heroActions, heroCopy } from './heroData';

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
        <HeroPortrait
          desktopSrc="/hero/alora-afro-cutout-v2.png"
          mobileSrc="/hero/alora-afro-mobile-light-cutout.png"
          alt="Monochrome side-profile portrait of a woman with natural hair"
          themeClassName={styles.lightPortrait}
        />
        <HeroPortrait
          desktopSrc="/hero/alora-dark-desktop-cutout.webp"
          mobileSrc="/hero/alora-dark-mobile-cutout.webp"
          alt="Portrait of a woman with a natural afro, hand resting at her temple"
          themeClassName={styles.darkPortrait}
        />
      </motion.div>
    </motion.section>
  );
}
