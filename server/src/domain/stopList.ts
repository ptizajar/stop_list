import { z } from 'zod';

export type DishCategory = 'Кухня' | 'Бар' | 'Десерты';

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  price: number;
}

export interface StopListEntry {
  id: string;
  dishId: string;
  reason: string;
  stoppedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  returnedAt: string | null;
}

export type StopListEntryView = StopListEntry & {
  dish: Dish;
  status: 'active' | 'returned' | 'expired';
  minutesLeft: number;
};

// Схема валидации создания записи (ТЗ: duration 15-720, reason 5-200 после trim)
export const createStopEntrySchema = z.object({
  dishId: z.string().uuid({ message: 'Некорректный ID блюда' }),
  reason: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 5 && val.length <= 200, {
      message: 'Причина должна быть от 5 до 200 символов',
    }),
  durationMinutes: z
    .number()
    .int({ message: 'Длительность должна быть целым числом' })
    .min(15, { message: 'Минимальный срок — 15 минут' })
    .max(720, { message: 'Максимальный срок — 720 минут (12 часов)' }),
});

export type CreateStopEntryInput = z.infer<typeof createStopEntrySchema>;

// Чистые доменные функции-помощники
export function isActive(entry: StopListEntry, now: Date): boolean {
  if (entry.returnedAt !== null) return false;
  return new Date(entry.expiresAt).getTime() > now.getTime();
}

export function getStatus(entry: StopListEntry, now: Date): StopListEntryView['status'] {
  if (entry.returnedAt !== null) return 'returned';
  return isActive(entry, now) ? 'active' : 'expired';
}

export function calculateMinutesLeft(expiresAt: string, now: Date): number {
  const diffMs = new Date(expiresAt).getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 60_000);
}