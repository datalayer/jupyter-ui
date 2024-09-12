/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect, useRef } from 'react';

export const Countdown = (props: { count: number }) => {
  const [count, setCount] = useState(props.count);
  const intervalRef = useRef<number>();
  const decreaseNum = () => setCount(prev => prev - 1);
  useEffect(() => {
    setCount(props.count);
  }, [props.count]);
  useEffect(() => {
    intervalRef.current = setInterval(decreaseNum, 1000) as any;
    return () => clearInterval(intervalRef.current);
  }, []);
  return <>[{count}]</>;
}
