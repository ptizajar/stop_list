import React, { useState } from "react";
import { useStopList } from "./hooks/useStopList";
import { DishList } from "./components/DishList";
import { StopDishForm } from "./components/StopDishForm";
import { ActiveStopList } from "./components/ActiveStopList";
import { HistoryList } from "./components/HistoryList";

export const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const {
    dishes,
    activeList,
    historyData,
    activeDishIds,
    isLoading,
    isHistoryLoading,
    historyPage,
    setHistoryPage,
    historyLimit,
    stopDish,
    isStopping,
    returnDish,
    isReturning,
  } = useStopList(selectedCategory || undefined);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Управление Стоп-Листом</h1>
      </header>

      <main className="main-content">
        {/* Блок 1: Форма постановки + Активный стоп-лист */}
        <div className="top-section">
          <StopDishForm
            dishes={dishes}
            activeDishIds={activeDishIds}
            onSubmit={async (input) => {
              await stopDish(input);
            }}
            isLoading={isStopping}
          />

          <ActiveStopList
            entries={activeList}
            onReturn={returnDish}
            isReturning={isReturning}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            isLoading={isLoading}
          />
        </div>

        <hr className="divider" />

        {/* Блок 2: Меню блюд со статусами */}
        <DishList
          dishes={dishes}
          activeDishIds={activeDishIds}
          isLoading={isLoading}
        />

        <hr className="divider" />

        {/* Блок 3: История с пагинацией */}
        <HistoryList
          data={historyData}
          isLoading={isHistoryLoading}
          page={historyPage}
          onPageChange={setHistoryPage}
          limit={historyLimit}
        />
      </main>
    </div>
  );
};

export default App;
