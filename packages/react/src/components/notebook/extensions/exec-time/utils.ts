/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

export const getTimeString = (date: Date): string => {
  return date.toLocaleDateString(
    'en-us',
    { weekday:"long", year:"numeric", month:"short", day:"numeric"},  
  );
}

export const getTimeDiff = (end: Date, start: Date): string => {

  const MS_IN_SEC = 1000;
  const MS_IN_MIN = 60 * MS_IN_SEC;
  const MS_IN_HR = 60 * MS_IN_MIN;
  const MS_IN_DAY = 24 * MS_IN_HR;

  let ms = end.getTime() - start.getTime();
  if (ms < MS_IN_SEC) {
    return `${ms}ms`;
  }
  const days = Math.floor(ms / MS_IN_DAY);
  ms = ms % MS_IN_DAY;

  const hours = Math.floor(ms / MS_IN_HR);
  ms = ms % MS_IN_HR;

  const mins = Math.floor(ms / MS_IN_MIN);
  ms = ms % MS_IN_MIN;

  // We want to show this as fractional
  const secs = ms / MS_IN_SEC;

  let timeDiff = '';
  if (days) {
    timeDiff += `${days}d `;
  }
  if (days || hours) {
    timeDiff += `${hours}h `;
  }
  if (days || hours || mins) {
    timeDiff += `${mins}m `;
  }
  // Only show s if its < 1 day
  if (!days) {
    // Only show ms if is < 1 hr
    timeDiff += `${secs.toFixed(hours ? 0 : 2)}s`;
  }

  return timeDiff.trim();

}
