/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

module.exports = {
  // TypeScript and TSX files
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],

  // JavaScript and JSX files (exclude config files)
  '*.{js,jsx}': filenames => {
    const filtered = filenames.filter(
      file =>
        !file.endsWith('.config.js') &&
        !file.includes('gulpfile') &&
        !file.includes('/scripts/'),
    );
    return filtered.length > 0
      ? [
          `eslint --fix ${filtered.join(' ')}`,
          `prettier --write ${filtered.join(' ')}`,
        ]
      : [];
  },

  // JSON files
  '*.json': ['prettier --write'],

  // Markdown and MDX files
  '*.{md,mdx}': ['prettier --write'],

  // YAML files
  '*.{yml,yaml}': ['prettier --write'],

  // CSS files
  '*.css': ['prettier --write'],

  // HTML files
  '*.html': ['prettier --write'],
};
