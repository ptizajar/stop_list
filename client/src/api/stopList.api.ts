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

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function handleResponse<T>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  let body: T | ApiErrorResponse | null = null;

  try {
    body = await res.json();
  } catch {
    // Ответ может быть пустым или не JSON.
  }

  if (!res.ok) {
    const errorBody = body as ApiErrorResponse | null;

    throw new ApiError(
      errorBody?.error?.message || fallbackMessage,
      res.status,
      errorBody?.error?.code
    );
  }

  return body as T;
}

export const api = {
  getDishes: async (): Promise<Dish[]> => {
    const res = await fetch('/api/dishes');

    return handleResponse<Dish[]>(
      res,
      'Не удалось загрузить список блюд'
    );
  },

  getActiveStopList: async (
    category?: string
  ): Promise<StopListEntryView[]> => {
    const url = category
      ? `/api/stop-list?category=${encodeURIComponent(category)}`
      : '/api/stop-list';

    const res = await fetch(url);

    return handleResponse<StopListEntryView[]>(
      res,
      'Не удалось загрузить стоп-лист'
    );
  },

  stopDish: async (
    data: CreateStopEntryInput
  ): Promise<StopListEntryView> => {
    const res = await fetch('/api/stop-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return handleResponse<StopListEntryView>(
      res,
      'Ошибка при постановке в стоп'
    );
  },

  returnDish: async (
    id: string
  ): Promise<StopListEntryView> => {
    const res = await fetch(`/api/stop-list/${id}/return`, {
      method: 'PATCH',
    });

    return handleResponse<StopListEntryView>(
      res,
      'Ошибка при возврате в продажу'
    );
  },

  getHistory: async (
    limit = 10,
    offset = 0
  ): Promise<HistoryResponse> => {
    const res = await fetch(
      `/api/stop-list/history?limit=${limit}&offset=${offset}`
    );

    return handleResponse<HistoryResponse>(
      res,
      'Не удалось загрузить историю'
    );
  },
};