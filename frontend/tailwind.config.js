/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Hỗ trợ Dark Mode bằng class 'dark' ở thẻ html/body
  theme: {
    extend: {
      colors: {
        // Đồng bộ các biến CSS độc quyền của bạn vào hệ thống class của Tailwind
        brand: {
          bg: 'var(--bg)',         // Sử dụng biến --bg gốc của bạn
          h: 'var(--text-h)',      // Sử dụng biến --text-h gốc của bạn
          text: 'var(--text)',     // Sử dụng biến --text gốc của bạn
          border: 'var(--border)', // Sử dụng biến --border gốc của bạn
        },
        accent: {
          DEFAULT: 'var(--accent)', // Sử dụng biến --accent (Màu tím thương hiệu)
          bg: 'var(--accent-bg)',
          border: 'var(--accent-border)',
        },
        code: {
          bg: 'var(--code-bg)',
        },
        social: {
          bg: 'var(--social-bg)',
        }
      },
      // Đồng bộ luôn font chữ của bạn nếu muốn dùng qua class Tailwind (Ví dụ: font-mono)
      fontFamily: {
        sans: 'var(--sans)',
        heading: 'var(--heading)',
        mono: 'var(--mono)',
      }
    },
  },
  plugins: [],
}