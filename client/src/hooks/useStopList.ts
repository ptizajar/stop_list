import { useState, useCallback } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '../api/stopList.api';

import type {
	CreateStopEntryInput,
	StopListEntryView,
} from '../api/stopList.api';



export function useStopList(categoryFilter?: string) {
	const queryClient = useQueryClient();

	const [historyPage, setHistoryPage] = useState(0);

	const historyLimit = 20;
	const historyOffset = historyPage * historyLimit;

	// 1. Загрузка справочника блюд
	const dishesQuery = useQuery({
		queryKey: ['dishes'],
		queryFn: api.getDishes,
		retry: 2,
	});

	// 2. Загрузка активного стоп-листа
	const activeStopListQuery = useQuery({
		queryKey: ['stopList', 'active', categoryFilter],
		queryFn: () => api.getActiveStopList(categoryFilter),
		retry: 2,
	});

	// 3. Загрузка истории завершенных записей с пагинацией
	const historyQuery = useQuery({
		queryKey: ['stopList', 'history', historyLimit, historyOffset],
		queryFn: () => api.getHistory(historyLimit, historyOffset),
		retry: 2,
	});

	// Мутация: Постановка в стоп
	const stopDishMutation = useMutation({
		mutationFn: (data: CreateStopEntryInput) => api.stopDish(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['stopList'] });
		},
	});

	// Мутация: Возврат в продажу
	const returnDishMutation = useMutation({
		mutationFn: (id: string) => api.returnDish(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['stopList'] });
		},
	});

	const handleEntryExpired = useCallback((entryId: string) => {
		queryClient.setQueriesData<StopListEntryView[]>(
			{ queryKey: ['stopList', 'active'] },
			(current) => {
				if (!current) {
					return current;
				}

				return current.filter((entry) => entry.id !== entryId);
			},
		);
	}, [queryClient]);

	// Множество ID блюд в стопе для моментального поиска
	const activeDishIds = new Set(
		(activeStopListQuery.data ?? []).map((e) => e.dishId)
	);

	return {
		// Данные
		dishes: dishesQuery.data ?? [],
		activeList: activeStopListQuery.data ?? [],
		historyData: historyQuery.data,
		activeDishIds,

		// Состояния загрузки и ошибок
		isLoading:
			dishesQuery.isLoading || activeStopListQuery.isLoading,

		isHistoryLoading: historyQuery.isLoading,

		isError:
			dishesQuery.isError ||
			activeStopListQuery.isError ||
			historyQuery.isError,

		error:
			dishesQuery.error ||
			activeStopListQuery.error ||
			historyQuery.error,

		refetch: async () => {
			await Promise.all([
				dishesQuery.refetch(),
				activeStopListQuery.refetch(),
				historyQuery.refetch(),
			]);
		},

		// Пагинация истории
		historyPage,
		setHistoryPage,
		historyLimit,

		// Действия (мутации)
		stopDish: stopDishMutation.mutateAsync,
		isStopping: stopDishMutation.isPending,
		stopError: stopDishMutation.error,

		returnDish: returnDishMutation.mutateAsync,
		isReturning: returnDishMutation.isPending,
		returnError: returnDishMutation.error,

		onEntryExpired: handleEntryExpired,



	};
}