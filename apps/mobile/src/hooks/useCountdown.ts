import { useCallback, useEffect, useState } from 'react';

/** Seconds remaining until a deadline, ticking once per second. */
export function useCountdown(initialSeconds: number) {
  const [deadline, setDeadline] = useState(() => Date.now() + initialSeconds * 1000);
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const restart = useCallback((seconds: number) => setDeadline(Date.now() + seconds * 1000), []);

  return { remaining, restart };
}

export const formatSeconds = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
