/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useLayoutEffect } from 'react';
import { CAN_USE_DOM } from './../utils';

export const useLayoutEffectImpl: typeof useLayoutEffect = CAN_USE_DOM
  ? useLayoutEffect
  : useEffect;

export default useLayoutEffectImpl;
