import { useState, useEffect, useRef } from 'react';

export const Countdown = (props: {count: number}) => {
  const [count, setCount] = useState(props.count);
  let intervalRef = useRef<number>();
  const decreaseNum = () => setCount((prev) => prev - 1);
  useEffect( () => {
      setCount(props.count);
  }, [props.count])
  useEffect(() => {
    intervalRef.current = setInterval(decreaseNum, 1000) as any;
    return () => clearInterval(intervalRef.current);
  }, []);
    return (
      <>
        [{count}]
      </>
    );
}
