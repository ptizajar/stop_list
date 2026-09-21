// server/src/domain/stopList.ts



export interface Dish {
  id: string;
  name: string;
  category: string;
  price: number; // целое, рубли
}

export interface StopListEntry {
  id: string;
  dishId: string;
  reason: string;
  stoppedAt: Date; // В Prisma это Date, при отдаче будет ISO
  expiresAt: Date; 
  returnedAt: Date | null;
}

export type StopListEntryView = Omit<StopListEntry, 'stoppedAt' | 'expiresAt' | 'returnedAt'> & {
  stoppedAt: string;
  expiresAt: string;
  returnedAt: string | null;
  dish: Dish;
  status: 'active' | 'returned' | 'expired';
  minutesLeft: number;
};

export interface CreateStopEntryInput {
  dishId: string;
  reason: string;
  durationMinutes: number;
}

// Чистая функция проверки активности
export function isActive(entry: StopListEntry, now: Date): boolean {
  if (entry.returnedAt !== null) return false;
  return entry.expiresAt.getTime() > now.getTime();
}

// Чистая функция статуса
export function getStatus(entry: StopListEntry, now: Date): StopListEntryView['status'] {
  if (entry.returnedAt !== null) return 'returned';
  return isActive(entry, now) ? 'active' : 'expired';
}

// Преобразование во View для клиента
export function toView(entry: StopListEntry & { dish: Dish }, now: Date): StopListEntryView {
  const status = getStatus(entry, now);
  const minutesLeft = status === 'active' 
    ? Math.floor((entry.expiresAt.getTime() - now.getTime()) / 60000) 
    : 0;

  return {
    ...entry,
    stoppedAt: entry.stoppedAt.toISOString(),
    expiresAt: entry.expiresAt.toISOString(),
    returnedAt: entry.returnedAt ? entry.returnedAt.toISOString() : null,
    status,
    minutesLeft,
  };
}