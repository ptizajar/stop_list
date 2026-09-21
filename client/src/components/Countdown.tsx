import React, { useEffect, useState } from "react";

interface CountdownProps {
  expiresAt: string;
}

const getMinutesLeft = (expiresAt: string): number => {
  const remainingMs =
    new Date(expiresAt).getTime() - Date.now();

  return Math.max(0, Math.ceil(remainingMs / 60000));
};

export const Countdown: React.FC<CountdownProps> = ({
  expiresAt,
}) => {
  const [minutesLeft, setMinutesLeft] = useState(() =>
    getMinutesLeft(expiresAt),
  );

  useEffect(() => {
    let timeoutId: number | undefined;

    const update = () => {
      const nextMinutesLeft = getMinutesLeft(expiresAt);

      setMinutesLeft(nextMinutesLeft);

      if (nextMinutesLeft <= 0) {
        return;
      }

      const remainingMs =
        new Date(expiresAt).getTime() - Date.now();

      const millisecondsToNextMinute =
        remainingMs % 60000 || 60000;

      timeoutId = window.setTimeout(update, millisecondsToNextMinute);
    };

    update();

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [expiresAt]);

  return <>{minutesLeft} мин.</>;
};