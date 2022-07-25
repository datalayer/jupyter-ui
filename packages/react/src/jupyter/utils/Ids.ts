import { v4 as uuid_v4 } from 'uuid';

// const MAX = Number.MAX_SAFE_INTEGER;
// const MAX = 999999;

export const newSourceId = (base: string) => {
//  return base + Math.floor(Math.random() * MAX).toString();
  return base;
};

export const newUuid = () => {
  return uuid_v4();
}
