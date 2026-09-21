// server/src/seed/seed.ts
import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';


const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const initialDishes = [
  { name: 'Борщ с говядиной', category: 'Кухня', price: 450 },
  { name: 'Стейк Рибай', category: 'Кухня', price: 1800 },
  { name: 'Паста Карбонара', category: 'Кухня', price: 620 },
  { name: 'Салат Цезарь', category: 'Кухня', price: 540 },
  { name: 'Пицца Маргарита', category: 'Кухня', price: 690 },
  { name: 'Коктейль Мохито', category: 'Бар', price: 420 },
  { name: 'Лимонад Домашний', category: 'Бар', price: 300 },
  { name: 'Эспрессо', category: 'Бар', price: 180 },
  { name: 'Капучино', category: 'Бар', price: 250 },
  { name: 'Чизкейк Нью-Йорк', category: 'Десерты', price: 380 },
  { name: 'Тирамису', category: 'Десерты', price: 410 },
  { name: 'Мороженое Ванильное', category: 'Десерты', price: 220 },
];

async function main() {
  await prisma.stopListEntry.deleteMany().catch(() => {});
  await prisma.dish.deleteMany().catch(() => {});

  for (const dish of initialDishes) {
    await prisma.dish.create({ data: dish });
  }

  console.log('База данных SQLite успешно заполнена 12 блюдами!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });