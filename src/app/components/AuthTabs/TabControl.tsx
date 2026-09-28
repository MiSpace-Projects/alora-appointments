'use client';

import { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import styles from './TabControl.module.css';

interface TabItem {
  id: string;
  label: string;
  content?: ReactNode;
  href?: string;
}

interface TabControlProps {
  tabs: TabItem[];
  defaultTab?: string;
}

export function TabControl({ tabs, defaultTab }: TabControlProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  if (!tabs.length) return null;

  const handleSelect = (tab: TabItem) => {
    if (tab.href) {
      router.push(tab.href);
      return;
    }
    setActiveTab(tab.id);
  };

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabList} role="tablist" aria-label="Authentication options">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={tab.content ? `panel-${tab.id}` : undefined}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
            onClick={() => handleSelect(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs
        .filter((tab) => tab.content)
        .map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            className={styles.tabPanel}
            hidden={activeTab !== tab.id}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
    </div>
  );
}
