/* =====================================================
   utils.js — ค่าคงที่และฟังก์ชันช่วยเหลือทั่วไป
   ===================================================== */
(function (global) {
  'use strict';

  const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const DAY_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // แสดงจันทร์ → อาทิตย์

  // สีประจำวิชา (ใช้ได้ทั้งโหมดสว่างและมืด)
  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e', '#14b8a6', '#f97316'];

  // ไอคอนประจำวิชา [ชื่อ Lucide, ป้ายกำกับ]
  const ICONS = [
    ['book-open', 'ทั่วไป'], ['calculator', 'คณิต'], ['flask-conical', 'เคมี'], ['atom', 'ฟิสิกส์'],
    ['microscope', 'ชีวะ'], ['languages', 'ภาษา'], ['globe', 'สังคม'], ['landmark', 'ประวัติ'],
    ['palette', 'ศิลปะ'], ['music', 'ดนตรี'], ['dumbbell', 'พละ'], ['laptop', 'คอมฯ']
  ];
  const ICON_NAMES = ICONS.map(function (i) { return i[0]; });

  const esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  /* ---------- วันที่และเวลา (ใช้เวลาท้องถิ่นเสมอ) ---------- */
  const pad = function (n) { return String(n).padStart(2, '0'); };
  const toDateStr = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const todayStr = function () { return toDateStr(new Date()); };
  const parseDate = function (s) {
    const p = s.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  };
  const addDays = function (n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return toDateStr(d);
  };
  const daysUntil = function (s) {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    return Math.round((parseDate(s) - start) / 86400000);
  };
  const fmtDate = function (s, long) {
    const opts = long
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
    return parseDate(s).toLocaleDateString('th-TH', opts);
  };
  const fmtToday = function () {
    return new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const timeToMin = function (t) {
    const p = t.split(':').map(Number);
    return p[0] * 60 + p[1];
  };

  /* ---------- รูปภาพ: ย่อขนาดก่อนเก็บลง LocalStorage ---------- */
  function resizeImage(file, max, mime) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพ'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        if (mime === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL(mime, 0.88));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('อ่านไฟล์รูปภาพนี้ไม่ได้'));
      };
      img.src = url;
    });
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type: type || 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  global.Utils = {
    DAY_NAMES, DAY_SHORT, DAY_ORDER, COLORS, ICONS, ICON_NAMES,
    esc, uid, todayStr, toDateStr, parseDate, addDays, daysUntil, fmtDate, fmtToday, timeToMin,
    resizeImage, download
  };
})(window);
