/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * AutoIndent Engine Tests
 *
 * Comprehensive test suite for language-aware code indentation.
 *
 * @module autoindent/__tests__
 */

import { AutoIndentEngine } from '../AutoIndentEngine';
import { LanguageIndentRegistry } from '../LanguageIndentRegistry';
import type { IndentContext } from '../types';

describe('AutoIndentEngine', () => {
  let registry: LanguageIndentRegistry;
  let engine: AutoIndentEngine;

  beforeEach(() => {
    registry = new LanguageIndentRegistry();
    engine = new AutoIndentEngine(registry, false);
  });

  describe('Python Indentation', () => {
    describe('Colon-triggered indent', () => {
      it('should indent after if statement with colon', () => {
        const context: IndentContext = {
          currentLine: 'if x > 0:',
          language: 'python',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(true);
        expect(result.triggeredRule).toBe('colon-indent');
      });

      it('should indent after for loop with colon', () => {
        const context: IndentContext = {
          currentLine: 'for i in range(10):',
          language: 'python',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(true);
      });

      it('should indent after function definition with colon', () => {
        const context: IndentContext = {
          currentLine: 'def my_function():',
          language: 'python',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(true);
      });

      it('should indent after class definition with colon', () => {
        const context: IndentContext = {
          currentLine: 'class MyClass:',
          language: 'python',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(true);
      });

      it('should indent after try statement with colon', () => {
        const context: IndentContext = {
          currentLine: 'try:',
          language: 'python',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(true);
      });

      it('should indent after with statement with colon', () => {
        const context: IndentContext = {
          currentLine: 'with open("file.txt") as f:',
          language: 'python',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(true);
      });

      it('should indent after colon with trailing comment', () => {
        const context: IndentContext = {
          currentLine: 'if condition:  # This is a comment',
          language: 'python',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(true);
      });

      it('should indent after colon with trailing whitespace', () => {
        const context: IndentContext = {
          currentLine: 'if condition:   ',
          language: 'python',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(true);
      });
    });

    describe('Nested indentation', () => {
      it('should handle nested if statements', () => {
        const context: IndentContext = {
          currentLine: '    if nested:',
          language: 'python',
          currentIndent: 4,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(8);
        expect(result.shouldIndent).toBe(true);
      });

      it('should handle deeply nested blocks', () => {
        const context: IndentContext = {
          currentLine: '        if deeply_nested:',
          language: 'python',
          currentIndent: 8,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(12);
        expect(result.shouldIndent).toBe(true);
      });
    });

    describe('Dedent keywords', () => {
      it('should detect return statement for dedent', () => {
        const context: IndentContext = {
          currentLine: '    return value',
          language: 'python',
          currentIndent: 4,
        };

        const result = engine.calculateIndent(context);

        expect(result.shouldDedent).toBe(true);
        expect(result.triggeredRule).toBe('flow-control-keywords');
      });

      it('should detect break statement for dedent', () => {
        const context: IndentContext = {
          currentLine: '    break',
          language: 'python',
          currentIndent: 4,
        };

        const result = engine.calculateIndent(context);

        expect(result.shouldDedent).toBe(true);
      });

      it('should detect continue statement for dedent', () => {
        const context: IndentContext = {
          currentLine: '    continue',
          language: 'python',
          currentIndent: 4,
        };

        const result = engine.calculateIndent(context);

        expect(result.shouldDedent).toBe(true);
      });

      it('should detect pass statement for dedent', () => {
        const context: IndentContext = {
          currentLine: '    pass',
          language: 'python',
          currentIndent: 4,
        };

        const result = engine.calculateIndent(context);

        expect(result.shouldDedent).toBe(true);
      });

      it('should detect raise statement for dedent', () => {
        const context: IndentContext = {
          currentLine: '    raise ValueError("error")',
          language: 'python',
          currentIndent: 4,
        };

        const result = engine.calculateIndent(context);

        expect(result.shouldDedent).toBe(true);
        expect(result.triggeredRule).toBe('raise-keyword');
      });
    });

    describe('Regular lines (preserve indentation)', () => {
      it('should preserve indentation for regular statements', () => {
        const context: IndentContext = {
          currentLine: '    print("hello")',
          language: 'python',
          currentIndent: 4,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(false);
        expect(result.shouldDedent).toBe(false);
      });

      it('should preserve indentation for assignments', () => {
        const context: IndentContext = {
          currentLine: '    x = 42',
          language: 'python',
          currentIndent: 4,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(4);
        expect(result.shouldIndent).toBe(false);
      });
    });
  });

  describe('JavaScript Indentation', () => {
    describe('Brace-triggered indent', () => {
      it('should indent after opening brace', () => {
        const context: IndentContext = {
          currentLine: 'function test() {',
          language: 'javascript',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(2);
        expect(result.shouldIndent).toBe(true);
        expect(result.triggeredRule).toBe('open-brace');
      });

      it('should indent after if statement with brace', () => {
        const context: IndentContext = {
          currentLine: 'if (condition) {',
          language: 'javascript',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(2);
        expect(result.shouldIndent).toBe(true);
      });

      it('should indent after object literal opening', () => {
        const context: IndentContext = {
          currentLine: 'const obj = {',
          language: 'javascript',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(2);
        expect(result.shouldIndent).toBe(true);
      });
    });

    describe('Bracket and paren indent', () => {
      it('should indent after opening bracket', () => {
        const context: IndentContext = {
          currentLine: 'const arr = [',
          language: 'javascript',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(2);
        expect(result.shouldIndent).toBe(true);
        expect(result.triggeredRule).toBe('open-bracket');
      });

      it('should indent after opening paren', () => {
        const context: IndentContext = {
          currentLine: 'someFunction(',
          language: 'javascript',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(2);
        expect(result.shouldIndent).toBe(true);
        expect(result.triggeredRule).toBe('open-paren');
      });
    });

    describe('Arrow function indent', () => {
      it('should indent after arrow function', () => {
        const context: IndentContext = {
          currentLine: 'const func = () =>',
          language: 'javascript',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(2);
        expect(result.shouldIndent).toBe(true);
        expect(result.triggeredRule).toBe('arrow-function');
      });
    });

    describe('Dedent keywords', () => {
      it('should detect return statement for dedent', () => {
        const context: IndentContext = {
          currentLine: '  return value;',
          language: 'javascript',
          currentIndent: 2,
        };

        const result = engine.calculateIndent(context);

        expect(result.shouldDedent).toBe(true);
        expect(result.triggeredRule).toBe('return-statement');
      });

      it('should detect break statement for dedent', () => {
        const context: IndentContext = {
          currentLine: '  break;',
          language: 'javascript',
          currentIndent: 2,
        };

        const result = engine.calculateIndent(context);

        expect(result.shouldDedent).toBe(true);
      });
    });

    describe('TypeScript uses same rules', () => {
      it('should indent TypeScript with 2 spaces', () => {
        const context: IndentContext = {
          currentLine: 'function test(): void {',
          language: 'typescript',
          currentIndent: 0,
        };

        const result = engine.calculateIndent(context);

        expect(result.spaces).toBe(2);
        expect(result.shouldIndent).toBe(true);
      });
    });
  });

  describe('Tab String Generation', () => {
    it('should return 4 spaces for Python', () => {
      const tabString = engine.getTabString('python');
      expect(tabString).toBe('    ');
    });

    it('should return 2 spaces for JavaScript', () => {
      const tabString = engine.getTabString('javascript');
      expect(tabString).toBe('  ');
    });

    it('should return 2 spaces for TypeScript', () => {
      const tabString = engine.getTabString('typescript');
      expect(tabString).toBe('  ');
    });

    it('should handle null language with fallback', () => {
      const tabString = engine.getTabString(null);
      expect(tabString).toBe('    '); // Defaults to Python (4 spaces)
    });

    it('should handle unknown language with fallback', () => {
      const tabString = engine.getTabString('unknown-language');
      expect(tabString).toBe('    '); // Defaults to fallback (4 spaces)
    });
  });

  describe('Tab Size Retrieval', () => {
    it('should return 4 for Python tab size', () => {
      const tabSize = engine.getTabSize('python');
      expect(tabSize).toBe(4);
    });

    it('should return 2 for JavaScript tab size', () => {
      const tabSize = engine.getTabSize('javascript');
      expect(tabSize).toBe(2);
    });
  });

  describe('Outdent Calculation', () => {
    it('should outdent Python by 4 spaces', () => {
      const newIndent = engine.calculateOutdent(8, 'python');
      expect(newIndent).toBe(4);
    });

    it('should outdent JavaScript by 2 spaces', () => {
      const newIndent = engine.calculateOutdent(6, 'javascript');
      expect(newIndent).toBe(4);
    });

    it('should not go below zero', () => {
      const newIndent = engine.calculateOutdent(2, 'python');
      expect(newIndent).toBe(0); // Can't go negative
    });
  });

  describe('Leading Whitespace Handling', () => {
    it('should get leading whitespace from indented line', () => {
      const whitespace = engine.getLeadingWhitespace('    print("test")');
      expect(whitespace).toBe('    ');
    });

    it('should return empty string for non-indented line', () => {
      const whitespace = engine.getLeadingWhitespace('print("test")');
      expect(whitespace).toBe('');
    });

    it('should handle mixed tabs and spaces', () => {
      const whitespace = engine.getLeadingWhitespace('\t  code');
      expect(whitespace).toBe('\t  ');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty lines', () => {
      const context: IndentContext = {
        currentLine: '',
        language: 'python',
        currentIndent: 0,
      };

      const result = engine.calculateIndent(context);

      expect(result.spaces).toBe(0);
      expect(result.shouldIndent).toBe(false);
    });

    it('should handle lines with only whitespace', () => {
      const context: IndentContext = {
        currentLine: '    ',
        language: 'python',
        currentIndent: 4,
      };

      const result = engine.calculateIndent(context);

      expect(result.spaces).toBe(4);
      expect(result.shouldIndent).toBe(false);
    });

    it('should not indent on colon inside string (Python)', () => {
      const context: IndentContext = {
        currentLine: '    print("Hello: World")',
        language: 'python',
        currentIndent: 4,
      };

      const result = engine.calculateIndent(context);

      // Should NOT trigger indent because colon is inside string
      expect(result.shouldIndent).toBe(false);
      expect(result.spaces).toBe(4);
    });

    it('should handle language aliases (py -> python)', () => {
      const tabString = engine.getTabString('py');
      expect(tabString).toBe('    ');
    });

    it('should handle language aliases (js -> javascript)', () => {
      const tabString = engine.getTabString('js');
      expect(tabString).toBe('  ');
    });
  });

  describe('Indentation Normalization', () => {
    it('should normalize tabs to spaces for Python', () => {
      const normalized = engine.normalizeIndentation('\tcode', 'python');
      expect(normalized).toBe('    code');
    });

    it('should keep spaces as-is for Python', () => {
      const normalized = engine.normalizeIndentation('    code', 'python');
      expect(normalized).toBe('    code');
    });

    it('should normalize mixed indentation', () => {
      const normalized = engine.normalizeIndentation('\t  code', 'python');
      expect(normalized).toBe('      code'); // Tab=4 + 2 spaces = 6 spaces
    });
  });
});
