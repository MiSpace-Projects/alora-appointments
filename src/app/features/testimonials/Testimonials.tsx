'use client';

import CircularTestimonials from '@/app/components/circularTestimonials/CircularTestimonials';
import styles from './Testimonials.module.css';
import { motion } from 'framer-motion';

const easeOut = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

const testimonials = [
  {
    name: 'Mbali M.',
    designation: 'Matric Farewell',
    quote:
      'Alora made my matric farewell absolutely magical. My hair and makeup were flawless, I felt like a queen the entire night.',
    src: 'https://images.pexels.com/photos/22605186/pexels-photo-22605186.png',
  },
  {
    name: 'Dolly K.',
    designation: 'Wig Care',
    quote:
      'Best wig care service in Bethlehem. They brought my wig back to life. The attention to detail is truly unmatched.',
    src: 'https://images.pexels.com/photos/4654184/pexels-photo-4654184.jpeg',
  },
  {
    name: 'Mpumi D.',
    designation: 'Nail Art',
    quote:
      'The designs are so creative and long-lasting. I always get compliments! The loyalty rewards are a brilliant touch.',
    src: 'https://images.pexels.com/photos/2011414/pexels-photo-2011414.jpeg',
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section}>
      <motion.div
        className={styles.header}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={container}
      >
        <motion.span className={styles.kicker} variants={item}>
          FROM OUR CLIENTS
        </motion.span>
        <motion.h2 className={styles.title} variants={item}>
          Client Stories
        </motion.h2>
      </motion.div>

      <div className={styles.carouselWrap}>
        <CircularTestimonials
          testimonials={testimonials}
          autoplay
          colors={{
            name: 'var(--text)',
            designation: 'var(--text)',
            testimony: 'var(--text)',
            arrowBackground: 'rgba(46,46,46,0.6)',
            arrowForeground: 'var(--text)',
            arrowHoverBackground: '#c9a96e',
          }}
          fontSizes={{
            name: 'clamp(1.1rem, 3vw, 1.5rem)',
            designation: '0.875rem',
            quote: 'clamp(0.95rem, 2.5vw, 1.1rem)',
          }}
        />
      </div>
    </section>
  );
}
