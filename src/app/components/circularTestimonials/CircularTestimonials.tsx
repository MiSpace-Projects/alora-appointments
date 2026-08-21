'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './CircularTestimonials.module.css';

interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
}
interface Colors {
  name?: string;
  designation?: string;
  testimony?: string;
  arrowBackground?: string;
  arrowForeground?: string;
  arrowHoverBackground?: string;
}
interface FontSizes {
  name?: string;
  designation?: string;
  quote?: string;
}
interface CircularTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  colors?: Colors;
  fontSizes?: FontSizes;
}

function calculateGap(width: number) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export const CircularTestimonials = ({
  testimonials,
  autoplay = true,
  colors = {},
  fontSizes = {},
}: CircularTestimonialsProps) => {
  const colorName = colors.name ?? '#000';
  const colorDesignation = colors.designation ?? '#6b7280';
  const colorTestimony = colors.testimony ?? '#4b5563';
  const colorArrowBg = colors.arrowBackground ?? '#141414';
  const colorArrowFg = colors.arrowForeground ?? '#f1f1f7';
  const colorArrowHoverBg = colors.arrowHoverBackground ?? '#00a6fb';
  const fontSizeName = fontSizes.name ?? '1.5rem';
  const fontSizeDesignation = fontSizes.designation ?? '0.925rem';
  const fontSizeQuote = fontSizes.quote ?? '1.125rem';

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(400);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = useMemo(() => testimonials.length, [testimonials]);
  const active = useMemo(() => testimonials[activeIndex], [activeIndex, testimonials]);

  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startAutoplay = useCallback(() => {
    if (!autoplay) return;
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 5000);
  }, [autoplay, count]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [startAutoplay]);

  const handleNext = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrev, handleNext]);

  function getImageStyle(index: number): React.CSSProperties {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.8;
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + count) % count === index;
    const isRight = (activeIndex + 1) % count === index;

    if (isActive) {
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: 'auto',
        WebkitTransform: 'translateX(0px) translateY(0px) scale(1)',
        transform: 'translateX(0px) translateY(0px) scale(1)',
        WebkitTransition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
        transition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
      };
    }
    if (isLeft) {
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: 'auto',
        WebkitTransform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85)`,
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85)`,
        WebkitTransition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
        transition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
      };
    }
    if (isRight) {
      return {
        zIndex: 2,
        opacity: 1,
        pointerEvents: 'auto',
        WebkitTransform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85)`,
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85)`,
        WebkitTransition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
        transition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
      };
    }
    return {
      zIndex: 1,
      opacity: 0,
      pointerEvents: 'none',
      WebkitTransition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
      transition: 'all 0.8s cubic-bezier(.4,2,.3,1)',
    };
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.imageWrap} ref={imageContainerRef}>
          {testimonials.map((t, index) => (
            <Image
              key={t.src}
              src={t.src}
              alt={t.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.image}
              style={{
                objectFit: 'cover',
                ...getImageStyle(index),
              }}
            />
          ))}
        </div>

        <div className={styles.content}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={quoteVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <p className={styles.name} style={{ color: colorName, fontSize: fontSizeName }}>
                {active.name}
              </p>
              <p
                className={styles.designation}
                style={{ color: colorDesignation, fontSize: fontSizeDesignation }}
              >
                {active.designation}
              </p>
              <p
                className={styles.quote}
                style={{ color: colorTestimony, fontSize: fontSizeQuote }}
              >
                {active.quote.split(' ').map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ filter: 'blur(8px)', opacity: 0, y: 4 }}
                    animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut', delay: 0.02 * i }}
                    style={{ display: 'inline-block' }}
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className={styles.arrows}>
            <button
              className={styles.arrow}
              onClick={handlePrev}
              aria-label="Previous testimonial"
              style={{ backgroundColor: hoverPrev ? colorArrowHoverBg : colorArrowBg }}
              onMouseEnter={() => setHoverPrev(true)}
              onMouseLeave={() => setHoverPrev(false)}
            >
              <FaArrowLeft size={20} color={colorArrowFg} />
            </button>
            <button
              className={styles.arrow}
              onClick={handleNext}
              aria-label="Next testimonial"
              style={{ backgroundColor: hoverNext ? colorArrowHoverBg : colorArrowBg }}
              onMouseEnter={() => setHoverNext(true)}
              onMouseLeave={() => setHoverNext(false)}
            >
              <FaArrowRight size={20} color={colorArrowFg} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularTestimonials;
