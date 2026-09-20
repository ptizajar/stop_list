// client/src/App.tsx
import React, { useState } from 'react';
import { useStopList } from './hooks/useStopList';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dishId, setDishId] = useState('');
  const [reason, setReason] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    dishes,
    activeList,
    isLoading,
    isError,
    stopDish,
    isStopping,
    returnDish,
  } = useStopList(selectedCategory || undefined);

 const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!dishId) {
      setFormError('Выберите блюдо из списка');
      return;
    }

    try {
      await stopDish({
        dishId,
        reason,
        durationMinutes: Number(durationMinutes),
      });
      setReason('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Произошла неизвестная ошибка');
      }
    }
  };

  if (isLoading) return <div className="container">Загрузка данных...</div>;
  if (isError) return <div className="container error-text">Ошибка при загрузке данных сервера</div>;

  return (
    <div className="container">
      <header className="header">
        <h1>Стоп-лист смены</h1>
      </header>

      <div className="grid">
        {/* Форма постановки в стоп */}
        <div className="card">
          <h2>Поставить блюдо в стоп</h2>
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Блюдо</label>
              <select
                className="form-control"
                value={dishId}
                onChange={(e) => setDishId(e.target.value)}
              >
                <option value="">-- Выберите блюдо --</option>
                {dishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.category}] {d.name} — {d.price} ₽
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Причина (от 5 до 200 символов)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Закончилась заготовка, сломался гриль..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Срок стопа (минут, от 15 до 720)</label>
              <input
                type="number"
                className="form-control"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={15}
                max={720}
              />
            </div>

            {formError && <div className="error-text" style={{ marginBottom: 12 }}>{formError}</div>}

            <button type="submit" className="btn-primary" disabled={isStopping}>
              {isStopping ? 'Сохранение...' : 'Поставить в стоп'}
            </button>
          </form>
        </div>

        {/* Активный стоп-лист */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2>Активные позиции ({activeList.length})</h2>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Все категории</option>
              <option value="Кухня">Кухня</option>
              <option value="Бар">Бар</option>
              <option value="Десерты">Десерты</option>
            </select>
          </div>

          {activeList.length === 0 ? (
            <p style={{ color: '#666', marginTop: 12 }}>Все блюда в продаже 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>{item.dish.name}</strong> <small>({item.dish.category})</small>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>Причина: {item.reason}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent-color)', fontWeight: 600, marginTop: 4 }}>
                      Осталось: ~{item.minutesLeft} мин.
                    </div>
                  </div>
                  <button className="btn-secondary" onClick={() => returnDish(item.id)}>
                    Вернуть
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}