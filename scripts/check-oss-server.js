/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

const OSS_SERVER_URL =
  'https://oss.datalayer.run/api/jupyter-server/api/kernels/';
// Public demo token for Datalayer OSS Jupyter Server - not a secret
const TOKEN =
  '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6';
const TIMEOUT_MS = 5000;
const OSS_SERVER_URL_WITH_TOKEN = `${OSS_SERVER_URL}?token=${TOKEN}`;

console.log('🔍 Checking Datalayer OSS Jupyter Server status...');

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

(async () => {
  try {
    const res = await fetch(OSS_SERVER_URL_WITH_TOKEN, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      console.log('✅ Datalayer OSS Jupyter Server is running at', OSS_SERVER_URL);
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        console.log(text.trim());
      }
      console.log('');
      process.exit(0);
    }

    console.warn('⚠️  Datalayer OSS Jupyter Server responded with status:', res.status);
    console.warn(
      '   Server may be unavailable. Examples will attempt to connect anyway.',
    );
    console.warn('');
    process.exit(0);
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.error('⏱️  Datalayer OSS Jupyter Server check timed out after', TIMEOUT_MS, 'ms');
    } else {
      console.error('❌ Datalayer OSS Jupyter Server is not accessible:', err.message);
    }
    console.error('   Make sure https://oss.datalayer.run is running');
    console.error('   Examples will attempt to connect anyway.');
    console.error('');
    process.exit(0);
  }
})();
