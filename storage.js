/* LocalStorage helpers: ข้อมูลจะอยู่ในเบราว์เซอร์เครื่องนี้ */
const Store = {
  keys: { classes: "studyflow_classes_v1", assignments: "studyflow_assignments_v1", exams: "studyflow_exams_v1", theme: "studyflow_theme_v1" },
  get(key, fallback = []) {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch (error) { console.warn("อ่านข้อมูลไม่สำเร็จ", error); return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { alert("บันทึกข้อมูลไม่ได้ อาจมีพื้นที่จัดเก็บไม่เพียงพอ"); return false; }
  },
  id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};
const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const SUBJECT_ICONS = ["book-open", "calculator", "flask-conical", "languages", "laptop", "palette", "atom", "graduation-cap"];
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function formatDate(dateString, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!dateString) return "ไม่ระบุ";
  const date = new Date(dateString + (dateString.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(date.getTime())) return "ไม่ระบุ";
  return new Intl.DateTimeFormat("th-TH", options).format(date);
}
function dateDistance(dateString) {
  if (!dateString) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateString + "T00:00:00");
  return Math.ceil((target - now) / 86400000);
}
