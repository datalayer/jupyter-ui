/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
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
