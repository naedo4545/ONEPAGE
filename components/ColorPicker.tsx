import React from 'react';
import type { ThemeColors } from '../types';

interface ColorPickerProps {
  themes: { [key: string]: ThemeColors };
  selectedTheme: ThemeColors;
  onThemeChange: (theme: ThemeColors) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ themes, selectedTheme, onThemeChange }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(themes).map(([name, theme]) => {
        const isSelected = theme.background === selectedTheme.background;
        return (
          <div key={name} className="flex flex-col items-center">
            <button
              onClick={() => onThemeChange(theme)}
              className={`w-10 h-10 rounded-full border-2 transition-transform transform hover:scale-110 ${isSelected ? 'ring-2 ring-offset-2 ring-black dark:ring-offset-neutral-900 dark:ring-white' : 'border-neutral-300 dark:border-neutral-700'}`}
              style={{ backgroundColor: theme.background }}
              aria-label={`Select ${name} theme`}
            >
            </button>
            <span className="text-xs mt-1 text-neutral-500 dark:text-neutral-400 capitalize">{name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ColorPicker;