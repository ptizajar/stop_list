import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import type { Dish, StopListEntry } from '../domain/stopList';

const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
export const prisma = new PrismaClient({ adapter });

export const dishRepo = {
  async findById(id: string): Promise<Dish | null> {
    return prisma.dish.findUnique({ where: { id } }) as Promise<Dish | null>;
  },
};

export const stopListRepo = {
  async findByDishId(dishId: string): Promise<StopListEntry[]> {
    return prisma.stopListEntry.findMany({
      where: { dishId },
      orderBy: { stoppedAt: 'desc' },
    });
  },

  async findAllWithDish(): Promise<(StopListEntry & { dish: Dish })[]> {
    return prisma.stopListEntry.findMany({
      include: { dish: true },
      orderBy: { stoppedAt: 'desc' },
    }) as unknown as Promise<(StopListEntry & { dish: Dish })[]>;
  },

  async create(data: {
    dishId: string;
    reason: string;
    stoppedAt: Date;
    expiresAt: Date;
    returnedAt: null;
  }): Promise<StopListEntry> {
    return prisma.stopListEntry.create({ data });
  },

  async findById(id: string): Promise<StopListEntry | null> {
    return prisma.stopListEntry.findUnique({ where: { id } });
  },

  async updateReturnedAt(id: string, returnedAt: Date): Promise<StopListEntry> {
    return prisma.stopListEntry.update({
      where: { id },
      data: { returnedAt },
    });
  },

  // Для истории (с пагинацией) — передаем now снаружи
  async findHistory(
    limit: number,
    offset: number,
    now: Date
  ): Promise<{ items: (StopListEntry & { dish: Dish })[]; total: number }> {
    const where = {
      OR: [
        { returnedAt: { not: null } },
        { expiresAt: { lte: now } },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.stopListEntry.findMany({
        where,
        include: { dish: true },
        orderBy: { stoppedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.stopListEntry.count({ where }),
    ]);

    return {
      items: items as unknown as (StopListEntry & { dish: Dish })[],
      total,
    };
  },
};

export type DishRepo = typeof dishRepo;
export type StopListRepo = typeof stopListRepo;