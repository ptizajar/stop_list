import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedMessage = error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');

        return res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: formattedMessage,
          },
        });
      }

      next(error);
    }
  };
};

export const createStopListSchema = z.object({
  body: z.object({
    dishId: z.string().min(1, 'Укажите ID блюда'),
    reason: z
      .string()
      .trim()
      .min(5, 'Причина от 5 символов')
      .max(200, 'Причина до 200 символов'),
    durationMinutes: z
      .number()
      .int()
      .min(15, 'Минимум 15 минут')
      .max(720, 'Максимум 720 минут (12 часов)'),
  }),
});

export const categorySchema = z.enum(['Кухня', 'Бар', 'Десерты']);

export const stopListQuerySchema = z.object({
  query: z.object({
    category: categorySchema.optional(),

    limit: z.coerce
      .number()
      .int('limit должен быть целым числом')
      .min(1, 'limit должен быть от 1 до 100')
      .max(100, 'limit должен быть от 1 до 100')
      .optional(),

    offset: z.coerce
      .number()
      .int('offset должен быть целым числом')
      .min(0, 'offset не может быть отрицательным')
      .optional(),
  }),
});