# Stop List

Тестовое задание Junior Fullstack Developer.

**Demo:** https://stop-list.onrender.com/

## Stack

* Node.js 20+
* Express 5
* TypeScript
* React + Vite
* Prisma + SQLite
* Zod
* TanStack Query

## Запуск

### Требования

* Node.js 20+
* npm

### Development

```bash
npm install
npm run dev
```

`npm install` автоматически устанавливает зависимости frontend/backend, генерирует Prisma Client, применяет migrations и заполняет базу тестовыми данными.

`npm run dev` запускает frontend и backend в development-режиме.

### Production

```bash
npm run build
npm run start
```

`npm run build` собирает backend и frontend.

`npm run start` запускает production backend из `server/dist`.

### Environment

Backend использует `server/.env`.

Пример:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
```

Пример переменных окружения:

```text
server/.env.example
```

# API

Base URL:

```text
/api
```

## POST `/api/stop-list`

Добавить блюдо в стоп-лист.

### Request

```json
{
  "dishId": 1,
  "reason": "Закончился основной ингредиент",
  "durationMinutes": 60
}
```

### Response `201`

```json
{
  "id": 1,
  "dishId": 1,
  "reason": "Закончился основной ингредиент",
  "durationMinutes": 60,
  "expiresAt": "2026-09-21T15:00:00.000Z"
}
```

### Errors

`404` — блюдо не найдено:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Dish not found"
  }
}
```

`409` — блюдо уже находится в активном стоп-листе:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Dish is already in stop list"
  }
}
```

`422` — ошибка валидации:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed"
  }
}
```

---

## GET `/api/stop-list`

Получить активные стопы.

```http
GET /api/stop-list
```

Фильтр по категории:

```http
GET /api/stop-list?category=Кухня
```

### Response `200`

```json
[
  {
    "id": 1,
    "dishId": 1,
    "reason": "Закончился основной ингредиент",
    "expiresAt": "2026-09-21T15:00:00.000Z",
    "minutesLeft": 42
  }
]
```

Возвращаются только активные записи.

---

## PATCH `/api/stop-list/:id/return`

Досрочно вернуть блюдо из стоп-листа.

```http
PATCH /api/stop-list/1/return
```

При возврате запись сохраняется в истории с `returnedAt`.

### Errors

`404` — запись не найдена.

`409` — запись уже завершена или возвращена.

Пример:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Stop list entry is not active"
  }
}
```

---

## GET `/api/stop-list/history`

Получить историю завершённых стопов.

```http
GET /api/stop-list/history
```

Поддерживаются `limit` и `offset`:

```http
GET /api/stop-list/history?limit=10&offset=20
```

По умолчанию:

```text
limit = 20
offset = 0
```

### Response `200`

```json
[
  {
    "id": 1,
    "dishId": 1,
    "reason": "Закончился основной ингредиент",
    "durationMinutes": 60,
    "expiresAt": "2026-09-21T15:00:00.000Z",
    "returnedAt": "2026-09-21T14:30:00.000Z"
  }
]
```

Записи возвращаются от новых к старым.

---

# Валидация и ошибки

Для валидации используется Zod.

* `reason`: 5–200 символов;
* `durationMinutes`: integer, 15–720;
* `category`: `Кухня`, `Бар`, `Десерты`.

Основные HTTP-коды:

* `200` — успешный запрос;
* `201` — создание записи;
* `400` — некорректный request/JSON;
* `404` — ресурс не найден;
* `409` — конфликт состояния;
* `422` — ошибка валидации;
* `500` — внутренняя ошибка сервера.

---

# Архитектурные решения

В качестве хранилища выбран **SQLite + Prisma**: для небольшого тестового приложения отдельный database server избыточен, а Prisma даёт типизированный доступ к данным и миграции. Бизнес-логика вынесена в **service layer** и не зависит от Express, поэтому её можно тестировать отдельно от HTTP. Доступ к базе изолирован через **repository layer**, а validation выполняется отдельно от бизнес-логики. Текущее время передаётся в service через `now()`, что позволяет детерминированно тестировать истечение стоп-листа и граничные случаи.

---

# Что бы я доделала при наличии времени

* добавить exit-анимацию при автоматическом исчезновении истёкшего стопа;
* добавить E2E-тесты frontend;
* база данных на PostgreSQL и сборка через Docker compose;
* деплой frontend и backend отдельно

---

# Tests

```bash
npm test
```

Проект содержит unit- и API-тесты для основной бизнес-логики, временных границ, конфликтов, возврата из стоп-листа, валидации и pagination.
