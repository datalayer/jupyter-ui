# Tailwind CSS Integration

This document outlines the Tailwind CSS integration in the Jupyter Lexical package.

## What Was Done

1. **Dependencies Added:**
   - `tailwindcss` - Core Tailwind CSS framework
   - `postcss` - CSS post-processor
   - `autoprefixer` - CSS vendor prefixing
   - `@tailwindcss/forms` - Better form styling
   - `@tailwindcss/typography` - Typography utilities
   - `@tailwindcss/postcss` - PostCSS plugin for Tailwind
   - `postcss-loader` - Webpack loader for PostCSS

2. **Configuration Files:**
   - `tailwind.config.js` - Tailwind configuration with content paths and custom colors
   - `postcss.config.js` - PostCSS configuration for webpack processing
   - Updated `webpack.config.js` to include postcss-loader

3. **CSS Migration:**
   - Created `style/tailwind.css` with all existing styles converted to Tailwind classes
   - Removed individual CSS imports from TypeScript components
   - Maintained exact visual appearance using Tailwind utilities

## Files Changed

### Configuration
- `package.json` - Added Tailwind dependencies
- `webpack.config.js` - Added postcss-loader
- `tailwind.config.js` - New Tailwind configuration
- `postcss.config.js` - New PostCSS configuration

### CSS
- `style/tailwind.css` - New consolidated CSS file with Tailwind
- `style/index.css` - Updated to import tailwind.css

### TypeScript Components
Removed CSS imports from all component files:
- `src/components/*.tsx`
- `src/plugins/*.tsx` 
- `src/nodes/*.tsx`
- `src/themes/*.ts`

## Converted Styles

All existing styles have been converted to Tailwind classes while maintaining the same visual appearance:

- **Button styles** - Hover states, disabled states, sizing variants
- **Modal components** - Overlay, modal box, close button
- **Input components** - Wrapper, label, input field styling
- **Editor components** - Content editable areas, placeholders
- **Plugin components** - Toolbar, floating menus, draggable blocks
- **Specialized components** - Equation editor, image nodes, comments

## Benefits

1. **Consistency** - All styling now uses a unified design system
2. **Maintainability** - Easier to update and maintain styles
3. **Performance** - Tailwind purges unused CSS for smaller bundles
4. **Developer Experience** - Intellisense and utility-first approach
5. **Responsive Design** - Built-in responsive utilities available

## Usage

The styles are automatically included when you import the main CSS:

```typescript
import '@datalayer/jupyter-lexical/style/index.css';
```

All existing class names continue to work, but now they're powered by Tailwind CSS under the hood.

## Development

Run the development server as usual:
```bash
npm start
```

Build for production:
```bash
npm run build
```

The Tailwind CSS will be processed automatically through the webpack pipeline with PostCSS.
