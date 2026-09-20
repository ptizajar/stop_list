import React from "react";
import type { Dish } from "../api/stopList.api";
import styles from "../styles/DishList.module.css";

interface DishListProps {
  dishes: Dish[];
  activeDishIds: Set<string>;
  isLoading: boolean;
}

export const DishList: React.FC<DishListProps> = ({
  dishes,
  activeDishIds,
  isLoading,
}) => {
  if (isLoading) return <div className="loading">Загрузка меню...</div>;

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Меню ресторана</h3>
      <div className={styles.grid}>
        {dishes.map((dish) => {
          const inStop = activeDishIds.has(dish.id);
          return (
            <div key={dish.id} className={`${styles.card} ${inStop ? styles.isStopped : ''}`}>
              <div className={styles.info}>
                <span className={styles.name}>{dish.name}</span>
                <span className={styles.category}>{dish.category}</span>
              </div>
              <div className={styles.priceStatus}>
                <span className={styles.price}>{dish.price} ₽</span>
                {inStop && <span className={styles.stopBadge}>В стопе</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
