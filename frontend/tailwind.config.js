module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './theme/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neonBlue: '#00eaff',
        neonViolet: '#7c3aed',
        neonCyan: '#22d3ee',
        neonGreen: '#00ff99',
        glassBg: 'rgba(20, 20, 40, 0.7)',
      },
      boxShadow: {
        neon: '0 0 20px #00eaff, 0 0 40px #7c3aed',
      },
      fontFamily: {
        cyber: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        grid: 'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
