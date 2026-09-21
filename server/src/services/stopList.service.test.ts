import { describe, expect, it, vi } from 'vitest';
import { ConflictError, NotFoundError } from '../domain/errors';
import { createStopListService } from './stopList.service';
import type { Dish, StopListEntry } from '../domain/stopList';

const dish: Dish = {
  id: 'dish-1',
  name: 'Борщ с говядиной',
  category: 'Кухня',
  price: 450,
};

function makeEntry(overrides: Partial<StopListEntry> = {}): StopListEntry {
  return {
    id: 'entry-1',
    dishId: dish.id,
    reason: 'Закончился продукт',
    stoppedAt: new Date('2026-09-21T10:00:00.000Z'),
    expiresAt: new Date('2026-09-21T11:00:00.000Z'),
    returnedAt: null,
    ...overrides,
  };
}

function createDeps() {
  const stopList = {
    findByDishId: vi.fn(),
    findAllWithDish: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    updateReturnedAt: vi.fn(),
    findHistory: vi.fn(),
  };

  const dishes = {
    findById: vi.fn(),
    findAll: vi.fn(),
  };

  const now = new Date('2026-09-21T10:30:00.000Z');

  return {
    stopList,
    dishes,
    now: () => now,
  };
}

describe('stopList service', () => {
  it('ставит блюдо в стоп-лист', async () => {
    const deps = createDeps();
    const service = createStopListService(deps);

    const entry = makeEntry();

    deps.dishes.findById.mockResolvedValue(dish);
    deps.stopList.findByDishId.mockResolvedValue([]);
    deps.stopList.create.mockResolvedValue(entry);

    const result = await service.stopDish({
      dishId: dish.id,
      reason: '  Закончился продукт  ',
      durationMinutes: 30,
    });

    expect(deps.stopList.create).toHaveBeenCalledWith({
      dishId: dish.id,
      reason: 'Закончился продукт',
      stoppedAt: deps.now(),
      expiresAt: new Date('2026-09-21T11:00:00.000Z'),
      returnedAt: null,
    });

    expect(result.status).toBe('active');
    expect(result.minutesLeft).toBe(30);
    expect(result.dish).toEqual(dish);
  });

  it('не позволяет поставить блюдо в стоп повторно', async () => {
    const deps = createDeps();
    const service = createStopListService(deps);

    deps.dishes.findById.mockResolvedValue(dish);
    deps.stopList.findByDishId.mockResolvedValue([
      makeEntry(),
    ]);

    await expect(
      service.stopDish({
        dishId: dish.id,
        reason: 'Закончился продукт',
        durationMinutes: 30,
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(deps.stopList.create).not.toHaveBeenCalled();
  });

  it('позволяет поставить блюдо снова после истечения предыдущего стопа', async () => {
    const deps = createDeps();
    const service = createStopListService(deps);

    deps.dishes.findById.mockResolvedValue(dish);

    deps.stopList.findByDishId.mockResolvedValue([
      makeEntry({
        expiresAt: new Date('2026-09-21T10:00:00.000Z'),
      }),
    ]);

    const newEntry = makeEntry({
      id: 'entry-2',
      expiresAt: new Date('2026-09-21T11:00:00.000Z'),
    });

    deps.stopList.create.mockResolvedValue(newEntry);

    const result = await service.stopDish({
      dishId: dish.id,
      reason: 'Закончился продукт',
      durationMinutes: 30,
    });

    expect(deps.stopList.create).toHaveBeenCalled();
    expect(result.id).toBe('entry-2');
  });

  it('возвращает блюдо в продажу', async () => {
    const deps = createDeps();
    const service = createStopListService(deps);

    const entry = makeEntry();

    const returnedEntry = makeEntry({
      returnedAt: deps.now(),
    });

    deps.stopList.findById.mockResolvedValue(entry);
    deps.stopList.updateReturnedAt.mockResolvedValue(returnedEntry);
    deps.dishes.findById.mockResolvedValue(dish);

    const result = await service.returnDish(entry.id);

    expect(deps.stopList.updateReturnedAt).toHaveBeenCalledWith(
      entry.id,
      deps.now(),
    );

    expect(result.status).toBe('returned');
    expect(result.minutesLeft).toBe(0);
    expect(result.returnedAt).toBe(deps.now().toISOString());
  });

  it('не позволяет вернуть уже истёкшую запись', async () => {
    const deps = createDeps();
    const service = createStopListService(deps);

    const expiredEntry = makeEntry({
      expiresAt: new Date('2026-09-21T10:00:00.000Z'),
    });

    deps.stopList.findById.mockResolvedValue(expiredEntry);

    await expect(
      service.returnDish(expiredEntry.id),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(deps.stopList.updateReturnedAt).not.toHaveBeenCalled();
  });

  it('возвращает 404, если блюдо не существует', async () => {
    const deps = createDeps();
    const service = createStopListService(deps);

    deps.dishes.findById.mockResolvedValue(null);

    await expect(
      service.stopDish({
        dishId: 'unknown-dish',
        reason: 'Закончился продукт',
        durationMinutes: 30,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(deps.stopList.findByDishId).not.toHaveBeenCalled();
    expect(deps.stopList.create).not.toHaveBeenCalled();
  });
});