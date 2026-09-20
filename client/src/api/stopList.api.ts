

export type DishCategory = 'Кухня' | 'Бар' | 'Десерты';

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  price: number;
}

export interface StopListEntryView {
  id: string;
  dishId: string;
  reason: string;
  stoppedAt: string;
  expiresAt: string;
  returnedAt: string | null;
  dish: Dish;
  status: 'active' | 'returned' | 'expired';
  minutesLeft: number;
}

export interface CreateStopEntryInput {
  dishId: string;
  reason: string;
  durationMinutes: number;
}

export interface HistoryResponse {
  items: StopListEntryView[];
  total: number;
  limit: number;
  offset: number;
}

export const api = {
  getDishes: async (): Promise<Dish[]> => {
    const res = await fetch('/api/dishes');
    if (!res.ok) throw new Error('Не удалось загрузить список блюд');
    return res.json();
  },

  getActiveStopList: async (category?: string): Promise<StopListEntryView[]> => {
    const url = category ? `/api/stop-list?category=${encodeURIComponent(category)}` : '/api/stop-list';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Не удалось загрузить стоп-лист');
    return res.json();
  },

  stopDish: async (data: CreateStopEntryInput): Promise<StopListEntryView> => {
    const res = await fetch('/api/stop-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error?.message || 'Ошибка при постановке в стоп');
    }
    return body;
  },

  returnDish: async (id: string): Promise<StopListEntryView> => {
    const res = await fetch(`/api/stop-list/${id}/return`, {
      method: 'PATCH',
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error?.message || 'Ошибка при возврате в продажу');
    }
    return body;
  },

  async getHistory(limit = 10, offset = 0): Promise<HistoryResponse> {
    const res = await fetch(`/api/stop-list/history?limit=${limit}&offset=${offset}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || 'Не удалось загрузить историю');
    }
    return res.json();
  },
};

