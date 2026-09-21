import { Router } from 'express';

import { createStopListService } from '../services/stopList.service';
import { dishRepo, stopListRepo } from '../repositories/stopList.repository';
import { ValidationError } from '../domain/errors';

import {
  validate,
  createStopListSchema,
  stopListQuerySchema,
  stopListIdSchema,
} from '../middleware/validate';

import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

const service = createStopListService({
  stopList: stopListRepo,
  dishes: dishRepo,
  now: () => new Date(),
});

// GET /dishes
router.get(
  '/dishes',
  asyncHandler(async (_req, res) => {
    const dishes = await dishRepo.findAll();
    res.json(dishes);
  }),
);

// GET /stop-list
router.get(
  '/stop-list',
  validate(stopListQuerySchema),
  asyncHandler(async (req, res) => {
    const category = req.query.category as string | undefined;

    const list = await service.listActive(category);

    res.json(list);
  }),
);

// POST /stop-list
router.post(
  '/stop-list',
  validate(createStopListSchema),
  asyncHandler(async (req, res) => {
    const result = await service.stopDish(req.body);

    res.status(201).json(result);
  }),
);

// PATCH /stop-list/:id/return
router.patch(
  '/stop-list/:id/return',
  validate(stopListIdSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (Array.isArray(id)) {
      throw new ValidationError('Некорректный ID записи');
    }

    const result = await service.returnDish(id);

    res.json(result);
  }),
);

// GET /stop-list/history
router.get(
  '/stop-list/history',
  validate(stopListQuerySchema),
  asyncHandler(async (req, res) => {
    const limit =
      req.query.limit !== undefined
        ? Number(req.query.limit)
        : 20;

    const offset =
      req.query.offset !== undefined
        ? Number(req.query.offset)
        : 0;

    const history = await service.getHistory(limit, offset);

    res.json(history);
  }),
);

export default router;