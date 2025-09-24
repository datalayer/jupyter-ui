/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/components/ThemedLoader
 * Loading component that uses VS Code theme colors
 */

import React, { useEffect, useState } from 'react';

/**
 * @hidden
 */
interface ThemedLoaderProps {
  message?: string;
}

/**
 * A loading component that matches VS Code's current theme
 */
export function ThemedLoader({ message = 'Loading...' }: ThemedLoaderProps) {
  const [colors, setColors] = useState({
    background: '',
    foreground: '',
    border: '',
  });

  useEffect(() => {
    // Extract VS Code theme colors
    const getVSCodeColor = (varName: string, fallback: string) => {
      return (
        document.documentElement.style.getPropertyValue(varName) ||
        getComputedStyle(document.documentElement).getPropertyValue(varName) ||
        fallback
      );
    };

    const isDark = (() => {
      const bg = getVSCodeColor('--vscode-editor-background', '#1e1e1e');
      // Parse RGB from background color to determine if dark
      const rgbMatch = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
      }
      // Check hex colors
      if (bg.startsWith('#')) {
        const hex = bg.slice(1);
        let r = 0,
          g = 0,
          b = 0;
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
          r = parseInt(hex.slice(0, 2), 16);
          g = parseInt(hex.slice(2, 4), 16);
          b = parseInt(hex.slice(4, 6), 16);
        }
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
      }
      return true; // Default to dark
    })();

    setColors({
      background: getVSCodeColor(
        '--vscode-editor-background',
        isDark ? '#1e1e1e' : '#ffffff',
      ),
      foreground: getVSCodeColor(
        '--vscode-editor-foreground',
        isDark ? '#cccccc' : '#333333',
      ),
      border: getVSCodeColor(
        '--vscode-focusBorder',
        isDark ? '#007acc' : '#0078d4',
      ),
    });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '200px',
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily:
          'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif)',
        fontSize: '14px',
      }}
    >
      <div
        style={{
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${colors.border}`,
            borderRadius: '50%',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
      <div>{message}</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ThemedLoader;
