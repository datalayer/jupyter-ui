/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import RouterContainer from "./components/RouterContainer";
import { store } from "./state";

import "bulmaswatch/superhero/bulmaswatch.min.css";

const App = () => {
  return (
    <Provider store={store}>
      <RouterContainer />
    </Provider>
  );
};

render(
  <App />,
  document.getElementById("root")
);
