import React from "react";
import type { HistoryResponse } from "../api/stopList.api";
import styles from "../styles/HistoryList.module.css";

interface HistoryListProps {
  data?: HistoryResponse;
  isLoading: boolean;
  page: number;
  onPageChange: (newPage: number) => void;
  limit: number;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  data,
  isLoading,
  page,
  onPageChange,
  limit,
}) => {
  if (isLoading) return <div className="loading">Загрузка истории...</div>;

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>История стоп-листа</h3>

      {!data || data.items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            padding: "20px",
          }}
        >
          История пока пуста
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {data.items.map((entry) => (
              <div key={entry.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>{entry.dish.name}</h4>
                  <span
                    className={`${styles.statusBadge} ${entry.status === "returned" ? styles.statusReturned : styles.statusExpired}`}
                  >
                    {entry.status === "returned" ? "Возвращено" : "Истекло"}
                  </span>
                </div>
                <p className={styles.reason}>Причина: {entry.reason}</p>
                <div className={styles.dates}>
                  <span>
                    Снято: {new Date(entry.stoppedAt).toLocaleString()}
                  </span>
                  {entry.returnedAt && (
                    <span>
                      Вернулось: {new Date(entry.returnedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationBtn}
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
              >
                Назад
              </button>
              <span>
                Страница {page + 1} из {totalPages}
              </span>
              <button
                className={styles.paginationBtn}
                disabled={page >= totalPages - 1}
                onClick={() => onPageChange(page + 1)}
              >
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
