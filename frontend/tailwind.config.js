/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bauhaus-bg': 'var(--bg-color)',
        'bauhaus-fg': 'var(--fg-color)',
        'bauhaus-text': 'var(--fg-color)',
        'bauhaus-card': 'var(--card-color)',
        'bauhaus-border': 'var(--border-color)',
        'bauhaus-primary': 'var(--primary-color)',
        'bauhaus-secondary': 'var(--secondary-color)',
        'bauhaus-accent': 'var(--accent-color)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
