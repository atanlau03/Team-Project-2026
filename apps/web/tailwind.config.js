import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "inverse-surface": "var(--color-inverse-surface)",
        "on-tertiary": "var(--color-on-tertiary)",
        "secondary-fixed-dim": "var(--color-secondary-fixed-dim)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "surface-container-low": "var(--color-surface-container-low)",
        "on-tertiary-fixed": "var(--color-on-tertiary-fixed)",
        "surface-variant": "var(--color-surface-variant)",
        "on-secondary-container": "var(--color-on-secondary-container)",
        "inverse-primary": "var(--color-inverse-primary)",
        "tertiary-fixed": "var(--color-tertiary-fixed)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "on-tertiary-container": "var(--color-on-tertiary-container)",
        "secondary": "var(--color-secondary)",
        "on-tertiary-fixed-variant": "var(--color-on-tertiary-fixed-variant)",
        "secondary-fixed": "var(--color-secondary-fixed)",
        "tertiary-container": "var(--color-tertiary-container)",
        "tertiary-fixed-dim": "var(--color-tertiary-fixed-dim)",
        "on-secondary-fixed-variant": "var(--color-on-secondary-fixed-variant)",
        "on-primary-fixed": "var(--color-on-primary-fixed)",
        "outline-variant": "var(--color-outline-variant)",
        "outline": "var(--color-outline)",
        "tertiary": "var(--color-tertiary)",
        "on-primary": "var(--color-on-primary)",
        "surface-bright": "var(--color-surface-bright)",
        "error-container": "var(--color-error-container)",
        "surface-tint": "var(--color-surface-tint)",
        "error": "var(--color-error)",
        "on-secondary-fixed": "var(--color-on-secondary-fixed)",
        "surface-dim": "var(--color-surface-dim)",
        "on-error-container": "var(--color-on-error-container)",
        "surface-container": "var(--color-surface-container)",
        "on-primary-fixed-variant": "var(--color-on-primary-fixed-variant)",
        "on-background": "var(--color-on-background)",
        "primary-container": "var(--color-primary-container)",
        "secondary-container": "var(--color-secondary-container)",
        "on-surface": "var(--color-on-surface)",
        "on-error": "var(--color-on-error)",
        "on-secondary": "var(--color-on-secondary)",
        "primary-fixed": "var(--color-primary-fixed)",
        "surface-container-high": "var(--color-surface-container-high)",
        "primary": "var(--color-primary)",
        "surface": "var(--color-surface)",
        "inverse-on-surface": "var(--color-inverse-on-surface)",
        "background": "var(--color-background)",
        "on-primary-container": "var(--color-on-primary-container)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "primary-fixed-dim": "var(--color-primary-fixed-dim)",
        "warning": "var(--color-warning)",
        "success": "var(--color-success)",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Public Sans", "sans-serif"],
        "label": ["Space Grotesk", "sans-serif"]
      }
    },
  },
  plugins: [
    forms,
    containerQueries
  ],
}
