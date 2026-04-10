import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  // Paths relative to apps/frontend. App + shadcn under src/. (Avoid block comments with **/ inside globs.)
  // Monorepo shared UI: add e.g. "../../packages/ui/src/**/*.tsx" as another entry.
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        utility: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        chord: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        /** หัวหน้า H1 / ชื่อหน้า */
        "heading-xl": [
          "var(--font-size-heading-xl)",
          {
            lineHeight: "var(--line-height-heading)",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
          },
        ],
        "heading-lg": [
          "var(--font-size-heading-lg)",
          {
            lineHeight: "var(--line-height-heading)",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
          },
        ],
        "heading-md": [
          "var(--font-size-heading-md)",
          {
            lineHeight: "var(--line-height-heading)",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
          },
        ],
        "heading-sm": [
          "var(--font-size-heading-sm)",
          {
            lineHeight: "var(--line-height-heading-tight)",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
          },
        ],
        /** เนื้อหาหลัก (เทียบ Celestial default 0.875rem) */
        body: [
          "var(--font-size-body)",
          { lineHeight: "var(--line-height-body)" },
        ],
        "body-sm": [
          "var(--font-size-body-sm)",
          { lineHeight: "var(--line-height-body)" },
        ],
        /** ป้ายฟอร์ม / meta — ใช้คลาส `text-form-label` (แยกจาก utility `.text-label`) */
        "form-label": [
          "var(--font-size-label)",
          {
            lineHeight: "var(--line-height-label)",
            fontWeight: "var(--font-weight-label)",
            letterSpacing: "var(--letter-spacing-label)",
          },
        ],
        /** ตัวเลขสถิติบนการ์ด */
        "stat-sm": [
          "var(--font-size-stat-sm)",
          {
            lineHeight: "var(--line-height-stat)",
            fontWeight: "var(--font-weight-stat)",
            letterSpacing: "var(--letter-spacing-stat)",
          },
        ],
        stat: [
          "var(--font-size-stat)",
          {
            lineHeight: "var(--line-height-stat)",
            fontWeight: "var(--font-weight-stat)",
            letterSpacing: "var(--letter-spacing-stat)",
          },
        ],
        "stat-lg": [
          "var(--font-size-stat-lg)",
          {
            lineHeight: "var(--line-height-stat)",
            fontWeight: "var(--font-weight-stat)",
            letterSpacing: "var(--letter-spacing-stat)",
          },
        ],
      },
      spacing: {
        /** Celestial grid gutter ~30px */
        "7.5": "1.875rem",
        "4.5": "1.125rem",
        /** ระยะการ์ดจาก template (~1.875rem) */
        "card-y": "var(--spacing-card-y)",
        "card-x": "var(--spacing-card-x)",
      },
      maxWidth: {
        content: "var(--max-width-content)",
        layout: "var(--container-max-width)",
      },
      minHeight: {
        header: "var(--header-height)",
      },
      height: {
        header: "var(--header-height)",
      },
      width: {
        sidebar: "var(--sidebar-width)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
        sidebar: "var(--shadow-sidebar)",
        elevated: "var(--shadow-elevated)",
        inset: "var(--shadow-inset)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        navbar: {
          DEFAULT: "hsl(var(--navbar))",
          foreground: "hsl(var(--navbar-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          dim: "hsl(var(--primary-dim))",
          "fixed-dim": "hsl(var(--primary-fixed-dim))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          container: "hsl(var(--secondary-container))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--background))",
          low: "hsl(var(--muted))",
          lowest: "hsl(var(--card))",
          high: "hsl(var(--accent))",
          highest: "hsl(var(--surface-container-highest))",
        },
        outline: {
          variant: "hsl(var(--border))",
        },
      },
    },
  },
  plugins: [],
};

export default config;
