import React, { useState } from 'react';
import type { Dish } from '../api/stopList.api';
import styles from '../styles/StopDishForm.module.css';

interface StopDishFormProps {
  dishes: Dish[];
  activeDishIds: Set<string>;
  onSubmit: (input: { dishId: string; reason: string; durationMinutes: number }) => Promise<void>;
  isLoading: boolean;
}

export const StopDishForm: React.FC<StopDishFormProps> = ({
  dishes,
  activeDishIds,
  onSubmit,
  isLoading,
}) => {
  const [dishId, setDishId] = useState('');
  const [reason, setReason] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!dishId) {
      setFormError('Выберите блюдо из списка');
      return;
    }

    if (reason.trim().length < 5 || reason.trim().length > 200) {
      setFormError('Причина должна быть от 5 до 200 символов');
      return;
    }

    try {
      await onSubmit({ dishId, reason, durationMinutes });
      setReason('');
      setDishId('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Произошла неизвестная ошибка');
      }
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Поставить блюдо в стоп</h3>

      {formError && <div className={styles.error}>{formError}</div>}

      <div className={styles.group}>
        <label className={styles.label}>Блюдо</label>
        <select
          id="dish-select"
          value={dishId}
          onChange={(e) => {
            setDishId(e.target.value);
            setFormError(null);
          }}
          className={`${styles.select} ${formError && !dishId ? styles.inputError : ''}`}
        >
          <option value="">-- Выберите блюдо --</option>
          {dishes.map((dish) => (
            <option 
              key={dish.id} 
              value={dish.id} 
              disabled={activeDishIds.has(dish.id)}
            >
              {dish.name} ({dish.category}) {activeDishIds.has(dish.id) ? '— В стопе' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label htmlFor="reason" className={styles.label}>Причина</label>
        <input
          id="reason"
          type="text"
          placeholder="Например: Закончился ингредиент"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`${styles.input} ${formError && (reason.trim().length < 5 || reason.trim().length > 200) ? styles.inputError : ''}`}
        />
      </div>

      <div className={styles.group}>
        <label htmlFor="duration" className={styles.label}>Длительность (минут)</label>
        <input
          id="duration"
          type="number"
          min={15}
          max={720}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className={styles.input}
        />
      </div>

      <button type="submit" disabled={isLoading} className={styles.submitBtn}>
        {isLoading ? 'Отправка...' : 'Поставить в стоп'}
      </button>
    </form>
  );
};