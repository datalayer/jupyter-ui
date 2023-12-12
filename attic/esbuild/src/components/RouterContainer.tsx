/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import React, { PropsWithChildren } from "react";
// import { createBrowserHistory } from "history";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Editor from "../Editor";

// const customHistory = createBrowserHistory();

const RouterContainer = ({
  children
}: PropsWithChildren<Record<string, unknown>>) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/:templateId" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterContainer;
