// Setup Prism globally BEFORE language components are imported
import Prism from 'prismjs';

// Set Prism to global scope so language components can extend it
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}

// Now import language components
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';

// Import Prism theme
import 'prismjs/themes/prism.css';

export default Prism;
