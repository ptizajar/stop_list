import React from 'react';
import type { StopListEntryView } from '../api/stopList.api';
import styles from '../styles/ActiveStopList.module.css';

interface ActiveStopListProps {
  entries: StopListEntryView[];
  onReturn: (id: string) => void;
  isReturning: boolean;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isLoading?: boolean; // <-- добавь эту строчку
}

export const ActiveStopList: React.FC<ActiveStopListProps> = ({
  entries,
  onReturn,
  isReturning,
  selectedCategory,
  onSelectCategory,
}) => {
return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Активный стоп-лист</h3>
        <div className={styles.filters}>
          {['Все', 'Кухня', 'Бар', 'Десерты'].map((cat) => {
            const categoryValue = cat === 'Все' ? '' : cat;
            const isActive = selectedCategory === categoryValue;
            return (
              <button
                key={cat}
                className={`${styles.filterBtn} ${isActive ? styles.active : ''}`}
                onClick={() => onSelectCategory(categoryValue)}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
          Все блюда в продаже
        </div>
      ) : (
        <div className={styles.grid}>
          {entries.map((entry) => (
            <div key={entry.id} className={styles.card}>
              <div>
                <div className={styles.cardTop}>
                  <h4 className={styles.cardName}>{entry.dish.name}</h4>
                  <span className={styles.timeBadge}>{entry.minutesLeft} мин.</span>
                </div>
                <p className={styles.reason}>Причина: {entry.reason}</p>
              </div>
              <button
                disabled={isReturning}
                onClick={() => onReturn(entry.id)}
                className={styles.returnBtn}
              >
                Вернуть в продажу
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};