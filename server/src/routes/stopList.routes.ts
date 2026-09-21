// server/src/routes/stopList.routes.ts
import { Router } from 'express';
import { createStopListService } from '../services/stopList.service';
import { dishRepo, stopListRepo } from '../repositories/stopList.repository';
import {
  validate,
  createStopListSchema,
  stopListQuerySchema,
} from '../middleware/validate';

const router = Router();
const service = createStopListService({
	stopList: stopListRepo,
	dishes: dishRepo,
	now: () => new Date(),
});

// Получить список всех блюд из БД
router.get('/dishes', async (_req, res, next) => {
  try {
    const dishes = await dishRepo.findAll();
    res.json(dishes);
  } catch (err) {
    next(err);
  }
});

// Получить активный стоп-лист
router.get(
  '/stop-list',
  validate(stopListQuerySchema),
  async (req, res, next) => {
    try {
      const category = req.query.category as string | undefined;
      const list = await service.listActive(category);
      res.json(list);
    } catch (err) {
      next(err);
    }
  }
);

// Поставить блюдо в стоп-лист
router.post('/stop-list', validate(createStopListSchema), async (req, res, next) => {
	try {
		const result = await service.stopDish(req.body);
		res.status(201).json(result);
	} catch (err) {
		next(err);
	}
});

// Досрочный возврат в продажу
router.patch('/stop-list/:id/return', async (req, res, next) => {
	try {
		const result = await service.returnDish(req.params.id);
		res.json(result);
	} catch (err) {
		next(err);
	}
});

router.get(
  '/stop-list/history',
  validate(stopListQuerySchema),
  async (req, res, next) => {
    try {
      const limit = req.query.limit !== undefined
        ? Number(req.query.limit)
        : 20;

      const offset = req.query.offset !== undefined
        ? Number(req.query.offset)
        : 0;

      const history = await service.getHistory(limit, offset);

      res.json(history);
    } catch (err) {
      next(err);
    }
  }
);

export default router;