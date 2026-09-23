'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedLink from '../protected/ProtectedLink';
import styles from './Hero.module.css';
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
      </motion.div>
    </motion.section>
  );
}
