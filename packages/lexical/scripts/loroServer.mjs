/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The Loro collaboration server the examples talk to.
 *
 * `LexicalCollaborative` puts two panes on one room. A room needs a server,
 * and asking the reader to start one in another package before the example
 * works is a step they should not have to know about — so `make start` brings
 * this up beside Vite.
 *
 * The server is `lexical-loro`, a Python package. If it is not importable this
 * installs it first (the repository's own checkout when running in the
 * monorepo, the published wheel otherwise).
 *
 * It never fails the dev server: no Python, or an install that will not
 * complete, leaves a warning and the examples that need no room keep working.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
/** Where the package lives in this monorepo, when it is one. */
const LOCAL_CHECKOUT = resolve(HERE, '../../../../lexical/loro');

const HOST = process.env.LORO_HOST ?? 'localhost';
const PORT = process.env.LORO_PORT ?? '3002';

const python = process.env.PYTHON ?? 'python3';

/** Whether `import lexical_loro` works in the interpreter we would use. */
function isInstalled() {
  const probe = spawnSync(python, ['-c', 'import lexical_loro'], {
    stdio: 'ignore',
  });
  return probe.status === 0;
}

function warn(message) {
  // eslint-disable-next-line no-console
  console.warn(`[loro] ${message}`);
}

if (spawnSync(python, ['--version'], { stdio: 'ignore' }).status !== 0) {
  warn(
    `no ${python} on PATH — the collaborative example will have no room to join.`,
  );
  process.exit(0);
}

if (!isInstalled()) {
  const target = existsSync(resolve(LOCAL_CHECKOUT, 'pyproject.toml'))
    ? ['-e', LOCAL_CHECKOUT]
    : ['lexical-loro'];
  warn(`installing lexical-loro (${target.join(' ')})…`);
  const install = spawnSync(python, ['-m', 'pip', 'install', ...target], {
    stdio: 'inherit',
  });
  if (install.status !== 0 || !isInstalled()) {
    warn(
      'could not install lexical-loro — the collaborative example will have no room to join.',
    );
    process.exit(0);
  }
}

warn(`serving ws://${HOST}:${PORT}`);
const server = spawn(
  python,
  [
    '-m',
    'lexical_loro.cli',
    '--host',
    HOST,
    '--port',
    PORT,
    '--autosave-interval',
    '5',
  ],
  { stdio: 'inherit' },
);

// Go when the dev server goes, rather than holding the port for the next run.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.kill(signal);
    process.exit(0);
  });
}
server.on('exit', code => process.exit(code ?? 0));
