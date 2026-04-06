/**
 * ต้องเป็น CommonJS (module.exports) เมื่อไฟล์เป็น .js และ package.json ไม่มี "type": "module"
 * ถ้าใช้ export default ใน .js โหลด config ไม่ได้ → Tailwind ไม่รัน → CSS ออกมามี @tailwind / @apply ดิบ
 *
 * @type {import('postcss-load-config').Config}
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
