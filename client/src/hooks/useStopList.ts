// client/src/hooks/useStopList.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/stopList.api';
import type { CreateStopEntryInput } from '../api/stopList.api';
export function useStopList(categoryFilter?: string) {
  const queryClient = useQueryClient();

  // Загрузка блюд
  const dishesQuery = useQuery({
    queryKey: ['dishes'],
    queryFn: api.getDishes,
  });

  // Загрузка активного стоп-листа с авто-обновлением раз в 10 секунд
  const activeStopListQuery = useQuery({
    queryKey: ['stopList', 'active', categoryFilter],
    queryFn: () => api.getActiveStopList(categoryFilter),
    refetchInterval: 10000,
  });

  // Постановка в стоп
  const stopDishMutation = useMutation({
    mutationFn: (data: CreateStopEntryInput) => api.stopDish(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stopList'] });
    },
  });

  // Возврат в продажу
  const returnDishMutation = useMutation({
    mutationFn: (id: string) => api.returnDish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stopList'] });
    },
  });

  return {
    dishes: dishesQuery.data ?? [],
    activeList: activeStopListQuery.data ?? [],
    isLoading: dishesQuery.isLoading || activeStopListQuery.isLoading,
    isError: dishesQuery.isError || activeStopListQuery.isError,
    error: dishesQuery.error || activeStopListQuery.error,
    stopDish: stopDishMutation.mutateAsync,
    isStopping: stopDishMutation.isPending,
    stopError: stopDishMutation.error,
    returnDish: returnDishMutation.mutateAsync,
    isReturning: returnDishMutation.isPending,
  };
}