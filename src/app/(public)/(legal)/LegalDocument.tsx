import type { ReactNode } from 'react';
import styles from './legal.module.css';

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalDocumentProps {
  kicker: string;
  title: string;
  /** ISO date the document took effect; shown to readers and used in consent records. */
  effectiveDate: string;
  lede: ReactNode;
  sections: LegalSection[];
}

/**
 * Long-form legal document layout with an anchored section index. Server
 * component: all content is static per version so it renders once and caches.
 */
export function LegalDocument({
  kicker,
  title,
  effectiveDate,
  lede,
  sections,
}: LegalDocumentProps): React.JSX.Element {
  return (
    <main className={styles.page}>
      <article className={styles.shell}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.meta}>
          <span>Effective {effectiveDate}</span>
          <span>Version {effectiveDate}</span>
        </p>
        <p className={styles.lede}>{lede}</p>

        <nav className={styles.toc} aria-label="Sections">
          <p className={styles.tocTitle}>Contents</p>
          <ol className={styles.tocList}>
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.body}>
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>
                {index + 1}. {section.title}
              </h2>
              {section.content}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

/** Renders a confirmed value, or a visible "to be confirmed" marker when the owner has not supplied it yet. */
export function Fact({
  value,
  label,
}: {
  value: string | null;
  label?: string;
}): React.JSX.Element {
  if (value) return <>{value}</>;
  return <span className={styles.tbc}>{label ?? 'To be confirmed by the owner'}</span>;
}
