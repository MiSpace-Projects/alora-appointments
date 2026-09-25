'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { routes } from '@/app/config/routes';
import { featuredCategory, serviceCategories } from './servicesData';
import styles from './ServiceSection.module.css';

const PRICING_ANCHOR = routes.pricing.path;

/**
 * Service families with a line of copy each; every tile links to the price
 * list, which holds the concrete menu and prices from the database.
 */
export default function Services() {
  return (
    <div id="services" className={styles.services}>
      <motion.div
        className={styles.header}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
      >
        <div className={styles.headerLeft}>
          <span className={styles.headerDesc}>WHAT WE OFFER</span>
          <h2 className={styles.headerText}>Our Services</h2>
        </div>

        <div className={styles.headerRight}>
          <Link href={PRICING_ANCHOR} className={styles.viewAll}>
            See prices →
          </Link>
        </div>
      </motion.div>

      <div className={styles.content}>
        <motion.div
          className={styles.featured}
          style={{ backgroundImage: `url('${featuredCategory.img}')` }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
        >
          <div className={styles.overlay} />
          <div className={styles.featuredContent}>
            <span className={styles.badge}>Featured</span>
            <h3 className={styles.cardTitle}>{featuredCategory.title}</h3>
            <p>{featuredCategory.description}</p>
            <Link href={PRICING_ANCHOR} className={styles.cardLink}>
              View prices →
            </Link>
          </div>
        </motion.div>

        <div className={styles.grid}>
          {serviceCategories.map((item) => (
            <motion.div
              key={item.title}
              className={styles.card}
              style={{ backgroundImage: `url('${item.img}')` }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              whileHover={{
                scale: 1.03,
                transition: { type: 'spring', stiffness: 120, damping: 16 },
              }}
            >
              <div className={styles.overlay} />
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.description}</p>
                <Link href={PRICING_ANCHOR} className={styles.cardLink}>
                  View prices →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
