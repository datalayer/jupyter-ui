/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

var cache_require = window.require;

window.addEventListener('load', function () {
  window.require = cache_require;
});
