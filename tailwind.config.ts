import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        // DevForge brand palette — dark premium dashboard
                        ink: {
                                50:  '#f6f7fb',
                                100: '#eceef6',
                                200: '#d4d8e8',
                                300: '#aab1cd',
                                400: '#7882ad',
                                500: '#525e8c',
                                600: '#3d466d',
                                700: '#2c3354',
                                800: '#1d2240',
                                900: '#0f1226',
                                950: '#070815',
                        },
                        // Deep navy backgrounds (matching screenshots)
                        navy: {
                                900: '#0a192f',
                                800: '#112240',
                                700: '#1a2747',
                                600: '#243560',
                        },
                        // Mint accent (primary cyan/teal)
                        mint: {
                                100: '#a7ffe9',
                                200: '#7ff5da',
                                300: '#64ffda', // primary accent
                                400: '#4de6c2',
                                500: '#26d0a8',
                                600: '#0fb892',
                        },
                        // Purple/violet gradient endpoints
                        violet: {
                                300: '#9d8df1',
                                400: '#8b7fe8',
                                500: '#764ba2', // gradient endpoint
                                600: '#667eea', // gradient start
                                700: '#5568d4',
                        },
                        // Brand blue (secondary accent)
                        brand: {
                                200: '#b9d6ff',
                                300: '#88b8ff',
                                400: '#5490ff',
                                500: '#2f6bff',
                                600: '#1a4ff0',
                        },
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                fontFamily: {
                        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
                        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
                },
                animation: {
                        'float': 'float 6s ease-in-out infinite',
                        'float-slow': 'float-slow 9s ease-in-out infinite',
                        'gradient-shift': 'gradient-shift 8s ease infinite',
                        'fade-up': 'fade-up 0.7s ease-out both',
                        'fade-in': 'fade-in 0.8s ease-out both',
                        'scale-in': 'scale-in 0.5s ease-out both',
                        'shimmer': 'shimmer 2.5s linear infinite',
                        'spin-slow': 'spin-slow 18s linear infinite',
                        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
                        'marquee': 'marquee 30s linear infinite',
                        'spin-fast': 'spin 0.6s linear infinite',
                },
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
