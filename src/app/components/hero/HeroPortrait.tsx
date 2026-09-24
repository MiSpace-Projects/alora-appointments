import { getImageProps } from 'next/image';
import styles from './Hero.module.css';

/** Breakpoint at which the hero switches to the mobile art direction. Keep in sync with Hero.module.css. */
const MOBILE_MEDIA = '(max-width: 760px)';

interface HeroPortraitProps {
  /** Cutout shown on desktop / tablet. */
  desktopSrc: string;
  /** Cutout shown on mobile (different crop, full-bleed treatment). */
  mobileSrc: string;
  alt: string;
  /** Extra class that scopes the portrait to a theme (`lightPortrait` / `darkPortrait`). */
  themeClassName: string;
}

/**
 * Art-directed hero portrait: one `<picture>` per theme so the browser only
 * fetches the source that matches the viewport, instead of loading both
 * crops on every device.
 */
export function HeroPortrait({
  desktopSrc,
  mobileSrc,
  alt,
  themeClassName,
}: HeroPortraitProps): React.JSX.Element {
  const common = { alt, fill: true, priority: true } as const;

  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, src: mobileSrc, sizes: '100vw' });

  const {
    props: { srcSet: desktopSrcSet, ...imgProps },
  } = getImageProps({ ...common, src: desktopSrc, sizes: '60vw' });

  return (
    <picture className={styles.portraitPicture}>
      <source media={MOBILE_MEDIA} srcSet={mobileSrcSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from imgProps */}
      <img
        {...imgProps}
        srcSet={desktopSrcSet}
        className={`${styles.portraitImage} ${themeClassName}`}
      />
    </picture>
  );
}
