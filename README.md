# Stop List

Веб-приложение для управления стоп-листом блюд на смене.

## Стек

* React + TypeScript + Vite
* Node.js + Express + TypeScript
* Prisma
* SQLite
* Zod
* TanStack Query
* Vitest
* Supertest

## Запуск

Требования:

* Node.js 20+
* npm

Установить зависимости из корня:

```bash
npm install
```

Запустить клиент и сервер одновременно:

```bash
npm run dev
```

После запуска:

* frontend: http://localhost:5173
* backend: http://127.0.0.1:3000

Если порт 5173 занят, Vite автоматически выберет следующий свободный порт.

### Отдельный запуск

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

## Environment

Backend использует переменную:

```env
PORT=3000
```

Пример находится в:

```text
server/.env.example
```

При отсутствии `PORT` сервер использует порт `3000`.

SQLite database:

```text
server/prisma/dev.db
```

Файл базы данных не хранится в Git.

## Тесты

Запустить все серверные тесты:

```bash
npm test
```

Или непосредственно из `server`:

```bash
cd server
npm test
```

В проекте есть unit-тесты бизнес-логики и integration/API-тесты.

## Build

Собрать backend и frontend из корня:

```bash
npm run build
```

Backend:

```text
server/dist
```

Frontend:

```text
client/dist
```

## API

Base URL:

```text
/api
```

### Получить блюда

```http
GET /api/dishes
```

Пример ответа:

```json
[
  {
    "id": "dish-id",
    "name": "Паста Карбонара",
    "category": "Кухня",
    "price": 650
  }
]
```

Категории:

* `Кухня`
* `Бар`
* `Десерты`

В базе предварительно создаётся 12 блюд.

---

### Добавить блюдо в стоп-лист

```http
POST /api/stop-list
Content-Type: application/json
```

Request:

```json
{
  "dishId": "dish-id",
  "reason": "Закончился основной ингредиент",
  "durationMinutes": 60
}
```

Response `201`:

```json
{
  "id": "stop-entry-id",
  "dishId": "dish-id",
  "reason": "Закончился основной ингредиент",
  "stoppedAt": "2026-01-01T12:00:00.000Z",
  "expiresAt": "2026-01-01T13:00:00.000Z",
  "returnedAt": null,
  "dish": {
    "id": "dish-id",
    "name": "Паста Карбонара",
    "category": "Кухня",
    "price": 650
  },
  "status": "active",
  "minutesLeft": 60
}
```

Ограничения:

* `reason`: от 5 до 200 символов после trim;
* `durationMinutes`: целое число от 15 до 720;
* неизвестное блюдо → `404`;
* уже активное блюдо → `409`.

---

### Получить активный стоп-лист

```http
GET /api/stop-list
```

Фильтр по категории:

```http
GET /api/stop-list?category=Кухня
```

Response:

```json
[
  {
    "id": "stop-entry-id",
    "dishId": "dish-id",
    "reason": "Закончился основной ингредиент",
    "stoppedAt": "2026-01-01T12:00:00.000Z",
    "expiresAt": "2026-01-01T13:00:00.000Z",
    "returnedAt": null,
    "dish": {
      "id": "dish-id",
      "name": "Паста Карбонара",
      "category": "Кухня",
      "price": 650
    },
    "status": "active",
    "minutesLeft": 42
  }
]
```

Записи с `expiresAt <= now` автоматически считаются неактивными.

---

### Вернуть блюдо раньше срока

```http
PATCH /api/stop-list/:id/return
```

Response `200` содержит фактическое время возврата в `returnedAt`.

Повторный возврат уже возвращённой или истёкшей записи:

```http
409 Conflict
```

Неизвестная запись:

```http
404 Not Found
```

---

### История стоп-листа

```http
GET /api/stop-list/history
```

По умолчанию:

* `limit = 20`
* `offset = 0`

Пример:

```http
GET /api/stop-list/history?limit=10&offset=20
```

Response:

```json
{
  "items": [],
  "total": 0,
  "limit": 10,
  "offset": 20
}
```

История содержит возвращённые и автоматически истёкшие записи и сортируется от новых к старым.

Допустимые значения:

* `limit`: 1–100;
* `offset`: 0 или больше.

---

## Ошибки

API использует единый формат:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "body.reason: Причина от 5 символов"
  }
}
```

Основные HTTP-коды:

| Код   | Назначение                |
| ----- | ------------------------- |
| `201` | запись успешно создана    |
| `200` | успешный запрос           |
| `400` | некорректный запрос       |
| `404` | ресурс не найден          |
| `409` | конфликт состояния        |
| `422` | ошибка валидации          |
| `500` | внутренняя ошибка сервера |

Валидация выполняется на сервере с помощью Zod. Клиентская валидация используется только для мгновенной обратной связи.

## Архитектура

Бизнес-логика стоп-листа находится в `server/src/services` и не зависит от Express. Работа с текущим временем передаётся в сервис через `now`, что позволяет детерминированно тестировать границы срока действия. Репозитории отделены от бизнес-логики интерфейсами, поэтому сервис можно тестировать без привязки к HTTP. Express отвечает за маршрутизацию, валидацию входных данных и обработку ошибок, а React работает с API через TanStack Query.

## Структура проекта

```text
.
├── client/
│   └── src/
├── server/
│   ├── prisma/
│   └── src/
│       ├── domain/
│       ├── middleware/
│       ├── repositories/
│       ├── routes/
│       ├── seed/
│       ├── services/
│       └── tests/
├── .gitignore
├── package.json
└── README.md
```

## Что можно улучшить

Текущая реализация использует SQLite, что подходит для локального запуска и тестового задания. Для production можно заменить SQLite на PostgreSQL без изменения бизнес-логики благодаря слою репозиториев. Также можно добавить Docker Compose для воспроизводимого запуска окружения и настроить production deployment frontend/backend.
