import { getImageProps } from 'next/image';
import styles from './Hero.module.css';

const MOBILE_MEDIA = '(max-width: 760px)';

interface HeroPortraitProps {
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  themeClassName: string;
  priority?: boolean;
}

export function HeroPortrait({
  desktopSrc,
  mobileSrc,
  alt,
  themeClassName,
  priority = false,
}: HeroPortraitProps): React.JSX.Element {
  const common = { alt, fill: true, priority } as const;

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
