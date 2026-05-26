'use client';

import styles from './ServiceSection.module.css';
import { motion } from 'framer-motion';

// const reveal = {
//   hidden: { opacity: 0, y: 30 },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       type: 'spring',
//       stiffness: 90,
//       damping: 18,
//       mass: 0.9,
//     },
//   },
// };

export default function Services() {
  return (
    <div className={styles.services}>
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
          <span className={styles.viewAll}>View All →</span>
        </div>
      </motion.div>

      <div className={styles.content}>
        <motion.div
          className={styles.featured}
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/14730865/pexels-photo-14730865.jpeg')",
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
        >
          <div className={styles.overlay} />
          <div className={styles.featuredContent}>
            <span className={styles.badge}>Featured</span>
            <h3 className={styles.cardTitle}>Wig Care</h3>
            <p>Professional washing, styling, and maintenance to keep your crown flawless.</p>
          </div>
        </motion.div>

        <div className={styles.grid}>
          {[
            {
              title: 'Nail Art',
              img: 'https://images.pexels.com/photos/14016180/pexels-photo-14016180.jpeg',
            },
            {
              title: 'Matric Farewell',
              img: 'https://images.pexels.com/photos/30482416/pexels-photo-30482416.jpeg',
            },
            {
              title: 'Hair Styling',
              img: 'https://images.pexels.com/photos/7446913/pexels-photo-7446913.jpeg',
            },
            {
              title: 'Makeup',
              img: 'https://images.pexels.com/photos/10698022/pexels-photo-10698022.jpeg',
            },
          ].map((item) => (
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
              <span className={styles.cardTitle}>{item.title}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
