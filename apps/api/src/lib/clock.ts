export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export const secondsBetween = (from: Date, to: Date) => Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 1000));

export const addSeconds = (date: Date, seconds: number) => new Date(date.getTime() + seconds * 1000);
