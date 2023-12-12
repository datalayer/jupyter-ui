/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

var cache_require = window.require;

window.addEventListener('load', function() {
  window.require = cache_require;
});
