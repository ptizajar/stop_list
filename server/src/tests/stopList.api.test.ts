import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app';
import { prisma } from '../repositories/stopList.repository';

describe('Stop-list API', () => {
  let dishId: string;
  let entryId: string;

  beforeAll(async () => {
    const dish = await prisma.dish.findFirst();

    if (!dish) {
      throw new Error('Для integration-тестов нужны seed-данные');
    }

    dishId = dish.id;

    await prisma.stopListEntry.deleteMany({
      where: {
        reason: {
          startsWith: '[TEST]',
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.stopListEntry.deleteMany({
      where: {
        reason: {
          startsWith: '[TEST]',
        },
      },
    });

    await prisma.$disconnect();
  });

  it('GET /api/dishes возвращает список блюд', async () => {
    const response = await request(app)
      .get('/api/dishes')
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('category');
    expect(response.body[0]).toHaveProperty('price');
  });

  it('POST /api/stop-list создаёт запись', async () => {
    const response = await request(app)
      .post('/api/stop-list')
      .send({
        dishId,
        reason: '[TEST] Закончился продукт',
        durationMinutes: 30,
      })
      .expect(201);

    entryId = response.body.id;

    expect(response.body.dishId).toBe(dishId);
    expect(response.body.reason).toBe('[TEST] Закончился продукт');
    expect(response.body.status).toBe('active');
    expect(response.body.minutesLeft).toBe(30);
    expect(response.body.dish).toBeDefined();
  });

  it('POST /api/stop-list не позволяет повторно остановить активное блюдо', async () => {
    const response = await request(app)
      .post('/api/stop-list')
      .send({
        dishId,
        reason: '[TEST] Повторная попытка',
        durationMinutes: 30,
      })
      .expect(409);

    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('GET /api/stop-list возвращает активное блюдо', async () => {
    const response = await request(app)
      .get('/api/stop-list')
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);

    const entry = response.body.find(
      (item: { id: string }) => item.id === entryId,
    );

    expect(entry).toBeDefined();
    expect(entry.status).toBe('active');
  });

  it('GET /api/stop-list фильтрует по категории', async () => {
    const response = await request(app)
      .get('/api/stop-list?category=Кухня')
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);

    for (const item of response.body) {
      expect(item.dish.category).toBe('Кухня');
      expect(item.status).toBe('active');
    }
  });

  it('GET /api/stop-list возвращает 422 для неизвестной категории', async () => {
    const response = await request(app)
      .get('/api/stop-list?category=Неизвестная')
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /api/stop-list/:id/return возвращает блюдо', async () => {
    const response = await request(app)
      .patch(`/api/stop-list/${entryId}/return`)
      .expect(200);

    expect(response.body.id).toBe(entryId);
    expect(response.body.status).toBe('returned');
    expect(response.body.returnedAt).not.toBeNull();
    expect(response.body.minutesLeft).toBe(0);
  });

  it('PATCH /api/stop-list/:id/return не позволяет вернуть запись повторно', async () => {
    const response = await request(app)
      .patch(`/api/stop-list/${entryId}/return`)
      .expect(409);

    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('GET /api/stop-list/history возвращает историю с pagination', async () => {
    const response = await request(app)
      .get('/api/stop-list/history?limit=1&offset=0')
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('limit', 1);
    expect(response.body).toHaveProperty('offset', 0);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].status).toBe('returned');
  });

  it('GET /api/stop-list/history использует limit=20 и offset=0 по умолчанию', async () => {
    const response = await request(app)
      .get('/api/stop-list/history')
      .expect(200);

    expect(response.body.limit).toBe(20);
    expect(response.body.offset).toBe(0);
  });

  it('POST /api/stop-list возвращает 422 при неправильных данных', async () => {
    const response = await request(app)
      .post('/api/stop-list')
      .send({
        dishId,
        reason: 'bad',
        durationMinutes: 5,
      })
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBeDefined();
  });

  it('POST /api/stop-list возвращает 404 для неизвестного блюда', async () => {
    const response = await request(app)
      .post('/api/stop-list')
      .send({
        dishId: 'non-existent-dish',
        reason: '[TEST] Несуществующее блюдо',
        durationMinutes: 30,
      })
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/stop-list/:id/return возвращает 404 для неизвестной записи', async () => {
    const response = await request(app)
      .patch('/api/stop-list/non-existent-id/return')
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('возвращает 400 для некорректного JSON', async () => {
    const response = await request(app)
      .post('/api/stop-list')
      .set('Content-Type', 'application/json')
      .send('{"dishId":')
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'INVALID_JSON',
        message: 'Некорректный JSON в теле запроса',
      },
    });
  });
});