// server/src/services/stopList.service.ts
import { ConflictError, NotFoundError } from '../domain/errors';
import type { CreateStopEntryInput, StopListEntry } from '../domain/stopList';
import type { DishRepo, StopListRepo } from '../repositories/stopList.repository';
import { isActive, toView } from '../domain/stopList';

export function createStopListService(deps: {
  stopList: StopListRepo;
  dishes: DishRepo;
  now: () => Date;
}) {
  return {
    async stopDish(input: CreateStopEntryInput): Promise<StopListEntry> {
      const dish = await deps.dishes.findById(input.dishId);
      if (!dish) throw new NotFoundError(`Блюдо с id ${input.dishId} не найдено`);

      const now = deps.now();
      const existing = await deps.stopList.findByDishId(input.dishId);
      
      // Если блюдо уже в активном стоп-листе - кидаем 409
      if (existing.some((entry) => isActive(entry, now))) {
        throw new ConflictError('Блюдо уже в стоп-листе');
      }

      const stoppedAt = now;
      const expiresAt = new Date(now.getTime() + input.durationMinutes * 60_000);

      return deps.stopList.create({
        dishId: dish.id,
        reason: input.reason.trim(),
        stoppedAt,
        expiresAt,
        returnedAt: null,
      });
    },

    async listActive(category?: string) {
      const now = deps.now();
      let entries = await deps.stopList.findAllWithDish();
      
      if (category) {
        entries = entries.filter(e => e.dish.category === category);
      }

      // Фильтруем только активные через доменную функцию (никаких фоновых задач)
      return entries
        .filter((e) => isActive(e, now))
        .map((e) => toView(e, now));
    },

    async returnDish(id: string) {
      const now = deps.now();
      const entry = await deps.stopList.findById(id);

      if (!entry) throw new NotFoundError('Запись стоп-листа не найдена');
      if (!isActive(entry, now)) {
        throw new ConflictError('Нельзя вернуть блюдо: запись уже возвращена или истекла');
      }

      return deps.stopList.updateReturnedAt(id, now);
    },

    async getHistory(limit: number = 20, offset: number = 0) {
      const now = deps.now();
      // Получаем все записи и фильтруем те, что НЕ активны
      const allEntries = await deps.stopList.findAllWithDish();
      const historyEntries = allEntries.filter(e => !isActive(e, now));
      
      // Применяем пагинацию вручную (так как статус вычисляется на лету)
      const paginated = historyEntries.slice(offset, offset + limit);
      
      return paginated.map(e => toView(e, now));
    }
  };
}