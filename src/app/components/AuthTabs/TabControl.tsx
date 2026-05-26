'use client';

import { useState, ReactNode } from 'react';
import styles from './TabControl.module.css';

interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabControlProps {
  tabs: TabItem[];
  defaultTab?: string;
}

export function TabControl({ tabs, defaultTab }: TabControlProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  if (!tabs.length) return null;

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabList} role="tablist" aria-label="Authentication options">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
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
