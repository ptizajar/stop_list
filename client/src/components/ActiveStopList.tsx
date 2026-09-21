import React, { useEffect, useState} from "react";

import { ApiError, type StopListEntryView } from "../api/stopList.api";

import { Countdown } from "./Countdown";

import styles from "../styles/ActiveStopList.module.css";

interface ActiveStopListProps {
  entries: StopListEntryView[];
  onReturn: (id: string) => void;
  isReturning: boolean;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onEntryExpired: (id: string) => void;
  isLoading?: boolean;
}

export const ActiveStopList: React.FC<ActiveStopListProps> = ({
  entries,
  onReturn,
  isReturning,
  selectedCategory,
  onSelectCategory,
  onEntryExpired,
}) => {
  const [returnError, setReturnError] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
  const timers = entries.map((entry) => {
    const remainingMs =
      new Date(entry.expiresAt).getTime() - Date.now();

    if (remainingMs <= 0) {
      setHiddenIds((current) => {
        const next = new Set(current);
        next.add(entry.id);
        return next;
      });

      onEntryExpired(entry.id);

      return null;
    }

    return window.setTimeout(() => {
      setHiddenIds((current) => {
        const next = new Set(current);
        next.add(entry.id);
        return next;
      });

      onEntryExpired(entry.id);
    }, remainingMs);
  });

  return () => {
    timers.forEach((timer) => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    });
  };
}, [entries, onEntryExpired]);

  const handleReturn = async (id: string) => {
    setReturnError(null);

    try {
      await onReturn(id);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404 || err.code === "NOT_FOUND") {
          setReturnError(
            "Запись не найдена. Обновите список и попробуйте снова.",
          );
          return;
        }

        if (err.status === 409 || err.code === "CONFLICT") {
          setReturnError("Блюдо уже было возвращено в продажу или изменено.");
          return;
        }

        if (err.status === 422 || err.code === "VALIDATION_ERROR") {
          setReturnError(err.message || "Не удалось вернуть блюдо в продажу.");
          return;
        }

        setReturnError(err.message || "Ошибка при возврате блюда в продажу.");
        return;
      }

      if (err instanceof Error) {
        setReturnError(err.message);
      } else {
        setReturnError("Произошла неизвестная ошибка.");
      }
    }
  };

  const activeEntries = entries.filter((entry) => !hiddenIds.has(entry.id));

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Активный стоп-лист</h3>

        <div className={styles.filters}>
          {["Все", "Кухня", "Бар", "Десерты"].map((cat) => {
            const categoryValue = cat === "Все" ? "" : cat;
            const isActive = selectedCategory === categoryValue;

            return (
              <button
                key={cat}
                type="button"
                className={`${styles.filterBtn} ${
                  isActive ? styles.active : ""
                }`}
                onClick={() => {
                  setReturnError(null);
                  onSelectCategory(categoryValue);
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {returnError && <div className={styles.error}>{returnError}</div>}

      {activeEntries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            padding: "20px",
          }}
        >
          Все блюда в продаже
        </div>
      ) : (
        <div className={styles.grid}>
          {activeEntries.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.card} ${styles.cardEnter}`}
            >
              <div>
                <div className={styles.cardTop}>
                  <h4 className={styles.cardName}>{entry.dish.name}</h4>

                  <span className={styles.timeBadge}>
                    <Countdown expiresAt={entry.expiresAt} />
                  </span>
                </div>

                <p className={styles.reason}>Причина: {entry.reason}</p>
              </div>

              <button
                type="button"
                disabled={isReturning}
                onClick={() => handleReturn(entry.id)}
                className={styles.returnBtn}
              >
                {isReturning ? "Возврат..." : "Вернуть в продажу"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
