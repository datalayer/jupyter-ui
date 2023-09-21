import { useState, useEffect } from "react";
import AppAdapter from "./AppAdapter";

export type Props = {
  hostId: string;
}

export const App = (props: Props) => {
  const { hostId } = props;
  const [_, setAdapter] = useState<AppAdapter>();
  useEffect(() => {
    const adapter = new AppAdapter({
      hostId,
    });
    setAdapter(adapter);
  }, [hostId])
  return <></>
}

export default App;
