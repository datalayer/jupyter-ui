/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

/**
 * A LuminoRedux interface to enforce the usage of
 * the injextRedux method.
 */
interface LuminoRedux {
  injectRedux: () => void;
}

export default LuminoRedux;
