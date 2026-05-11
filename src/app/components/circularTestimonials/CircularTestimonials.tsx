'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
    <div className="ct-container">
      <div className="ct-grid">
        <div className="ct-image-wrap" ref={imageContainerRef}>
          {testimonials.map((t, index) => (
            <Image
              key={t.src}
              src={t.src}
              alt={t.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="ct-image"
              style={{
                objectFit: 'cover',
                ...getImageStyle(index),
              }}
            />
          ))}
        </div>

        <div className="ct-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={quoteVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <p className="ct-name" style={{ color: colorName, fontSize: fontSizeName }}>
                {active.name}
              </p>
              <p
                className="ct-designation"
                style={{ color: colorDesignation, fontSize: fontSizeDesignation }}
              >
                {active.designation}
              </p>
              <p className="ct-quote" style={{ color: colorTestimony, fontSize: fontSizeQuote }}>
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

          <div className="ct-arrows">
            <button
              className="ct-arrow"
              onClick={handlePrev}
              aria-label="Previous testimonial"
              style={{ backgroundColor: hoverPrev ? colorArrowHoverBg : colorArrowBg }}
              onMouseEnter={() => setHoverPrev(true)}
              onMouseLeave={() => setHoverPrev(false)}
            >
              <FaArrowLeft size={20} color={colorArrowFg} />
            </button>
            <button
              className="ct-arrow"
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

      <style>{`
        .ct-container {
          width: 100%;
          max-width: 56rem;
          box-sizing: border-box;
          padding: 1rem 0;
        }
        .ct-grid {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -ms-flex-direction: column;
          flex-direction: column;
          gap: 3rem;
        }
        .ct-image-wrap {
          position: relative;
          width: 100%;
          height: 20rem;
          -webkit-perspective: 1000px;
          perspective: 1000px;
        }
        .ct-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          -o-object-fit: cover;
          object-fit: cover;
          border-radius: 1.25rem;
          -webkit-box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .ct-content {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -ms-flex-direction: column;
          flex-direction: column;
          gap: 0.5rem;
        }
        .ct-name {
          font-weight: 700;
          margin: 0 0 0.1rem;
          line-height: 1.3;
        }
        .ct-designation {
          margin: 0 0 1.25rem;
          line-height: 1.4;
        }
        .ct-quote {
          line-height: 1.75;
          margin: 0;
          word-break: break-word;
        }
        .ct-arrows {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          gap: 1rem;
          padding-top: 2rem;
        }
        .ct-arrow {
          width: 2.6rem;
          height: 2.6rem;
          border-radius: 50%;
          display: -webkit-inline-box;
          display: -ms-inline-flexbox;
          display: inline-flex;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
          -webkit-box-pack: center;
          -ms-flex-pack: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          -webkit-appearance: none;
          appearance: none;
          -webkit-transition: background-color 0.25s ease;
          transition: background-color 0.25s ease;
          -ms-flex-negative: 0;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .ct-grid {
            -webkit-box-orient: horizontal;
            -webkit-box-direction: normal;
            -ms-flex-direction: row;
            flex-direction: row;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            gap: 4rem;
          }
          .ct-image-wrap {
            height: 24rem;
            -ms-flex: 1 1 0;
            -webkit-box-flex: 1;
            flex: 1 1 0;
            min-width: 0;
          }
          .ct-content {
            -ms-flex: 1 1 0;
            -webkit-box-flex: 1;
            flex: 1 1 0;
            min-width: 0;
          }
          .ct-arrows {
            padding-top: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CircularTestimonials;
