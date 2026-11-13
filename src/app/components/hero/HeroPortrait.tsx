import { getImageProps } from 'next/image';
import styles from './Hero.module.css';

const MOBILE_MEDIA = '(max-width: 760px)';

interface HeroPortraitProps {
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  themeClassName: string;
}

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
      <img
        {...imgProps}
        alt={alt}
        srcSet={desktopSrcSet}
        className={`${styles.portraitImage} ${themeClassName}`}
      />
    </picture>
  );
}
