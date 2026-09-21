import React, { useState } from "react";

import {
  ApiError,
  type Dish,
} from "../api/stopList.api";

import styles from "../styles/StopDishForm.module.css";

interface StopDishFormProps {
  dishes: Dish[];
  activeDishIds: Set<string>;

  onSubmit: (input: {
    dishId: string;
    reason: string;
    durationMinutes: number;
  }) => Promise<void>;

  isLoading: boolean;
}

interface FieldErrors {
  dishId?: string;
  reason?: string;
  durationMinutes?: string;
}

export const StopDishForm: React.FC<StopDishFormProps> = ({
  dishes,
  activeDishIds,
  onSubmit,
  isLoading,
}) => {
  const [dishId, setDishId] = useState("");
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validateDishId = (value: string): string | undefined => {
    if (!value) {
      return "Выберите блюдо из списка";
    }

    return undefined;
  };

  const validateReason = (value: string): string | undefined => {
    const trimmedReason = value.trim();

    if (trimmedReason.length < 5) {
      return "Причина должна быть минимум 5 символов";
    }

    if (trimmedReason.length > 200) {
      return "Причина должна быть максимум 200 символов";
    }

    return undefined;
  };

  const validateDuration = (
    value: number
  ): string | undefined => {
    if (
      !Number.isInteger(value) ||
      value < 15 ||
      value > 720
    ) {
      return "Длительность должна быть от 15 до 720 минут";
    }

    return undefined;
  };

  const validateForm = (): FieldErrors => {
    return {
      dishId: validateDishId(dishId),
      reason: validateReason(reason),
      durationMinutes: validateDuration(durationMinutes),
    };
  };

  const handleSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setFormError(null);

    const errors = validateForm();

    setFieldErrors(errors);

    if (
      errors.dishId ||
      errors.reason ||
      errors.durationMinutes
    ) {
      return;
    }

    try {
      await onSubmit({
        dishId,
        reason: reason.trim(),
        durationMinutes,
      });

      setReason("");
      setDishId("");
      setDurationMinutes(60);
      setFieldErrors({});
      setFormError(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (
          err.status === 409 ||
          err.code === "CONFLICT"
        ) {
          setFieldErrors({
            dishId: "Это блюдо уже находится в стоп-листе",
          });
          return;
        }

        if (
          err.status === 404 ||
          err.code === "NOT_FOUND"
        ) {
          setFieldErrors({
            dishId:
              "Блюдо не найдено. Обновите страницу и попробуйте снова.",
          });
          return;
        }

        if (
          err.status === 422 ||
          err.code === "VALIDATION_ERROR"
        ) {
          setFormError(
            err.message ||
              "Проверьте правильность заполнения формы"
          );
          return;
        }

        setFormError(
          err.message ||
            "Ошибка при постановке блюда в стоп"
        );
        return;
      }

      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Произошла неизвестная ошибка");
      }
    }
  };

  const handleDishBlur = () => {
    const error = validateDishId(dishId);

    setFieldErrors((prev) => ({
      ...prev,
      dishId: error,
    }));
  };

  const handleReasonBlur = () => {
    const error = validateReason(reason);

    setFieldErrors((prev) => ({
      ...prev,
      reason: error,
    }));
  };

  const handleDurationBlur = () => {
    const error = validateDuration(durationMinutes);

    setFieldErrors((prev) => ({
      ...prev,
      durationMinutes: error,
    }));
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <h3 className={styles.title}>
        Поставить блюдо в стоп
      </h3>

      {formError && (
        <div className={styles.error}>
          {formError}
        </div>
      )}

      <div className={styles.group}>
        <label
          htmlFor="dish-select"
          className={styles.label}
        >
          Блюдо
        </label>

        <select
          id="dish-select"
          value={dishId}
          onChange={(e) => {
            setDishId(e.target.value);

            setFieldErrors((prev) => ({
              ...prev,
              dishId: undefined,
            }));

            setFormError(null);
          }}
          onBlur={handleDishBlur}
          className={`${styles.select} ${
            fieldErrors.dishId
              ? styles.inputError
              : ""
          }`}
        >
          <option value="">
            -- Выберите блюдо --
          </option>

          {dishes.map((dish) => (
            <option
              key={dish.id}
              value={dish.id}
              disabled={activeDishIds.has(dish.id)}
            >
              {dish.name} ({dish.category}){" "}
              {activeDishIds.has(dish.id)
                ? "— В стопе"
                : ""}
            </option>
          ))}
        </select>

        {fieldErrors.dishId && (
          <div className={styles.error}>
            {fieldErrors.dishId}
          </div>
        )}
      </div>

      <div className={styles.group}>
        <label
          htmlFor="reason"
          className={styles.label}
        >
          Причина
        </label>

        <input
          id="reason"
          type="text"
          placeholder="Например: Закончился ингредиент"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);

            setFieldErrors((prev) => ({
              ...prev,
              reason: undefined,
            }));

            setFormError(null);
          }}
          onBlur={handleReasonBlur}
          className={`${styles.input} ${
            fieldErrors.reason
              ? styles.inputError
              : ""
          }`}
        />

        {fieldErrors.reason && (
          <div className={styles.error}>
            {fieldErrors.reason}
          </div>
        )}
      </div>

      <div className={styles.group}>
        <label
          htmlFor="duration"
          className={styles.label}
        >
          Длительность (минут)
        </label>

        <input
          id="duration"
          type="number"
          min={15}
          max={720}
          value={durationMinutes}
          onChange={(e) => {
            setDurationMinutes(
              Number(e.target.value)
            );

            setFieldErrors((prev) => ({
              ...prev,
              durationMinutes: undefined,
            }));

            setFormError(null);
          }}
          onBlur={handleDurationBlur}
          className={`${styles.input} ${
            fieldErrors.durationMinutes
              ? styles.inputError
              : ""
          }`}
        />

        {fieldErrors.durationMinutes && (
          <div className={styles.error}>
            {fieldErrors.durationMinutes}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={styles.submitBtn}
      >
        {isLoading
          ? "Отправка..."
          : "Поставить в стоп"}
      </button>
    </form>
  );
};