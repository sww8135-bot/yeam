/* =====================================================
   store.js — จัดเก็บข้อมูลลง LocalStorage
   - normalize(): ตรวจและทำความสะอาดข้อมูลทุกครั้งที่โหลด/นำเข้า
   ===================================================== */
(function (global) {
  'use strict';

  const U = global.Utils;
  const KEY = 'studyPlanner.v1';

  const HEX = /^#[0-9a-f]{6}$/i;
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
  const PRIORITIES = ['high', 'medium', 'low'];
  const THEMES = ['system', 'light', 'dark'];

  const str = function (v, max) { return (typeof v === 'string' ? v : '').trim().slice(0, max); };
  const img = function (v) {
    return typeof v === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(v) ? v : '';
  };
  const arr = function (v) { return Array.isArray(v) ? v : []; };
  const safeId = function (v) {
    const s = (typeof v === 'string' || typeof v === 'number') ? String(v).replace(/[^\w-]/g, '').slice(0, 40) : '';
    return s || U.uid();
  };

  function normalize(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const p = r.profile && typeof r.profile === 'object' ? r.profile : {};

    const courses = arr(r.courses).map(function (c) {
      c = c || {};
      return {
        id: safeId(c.id),
        name: str(c.name, 80),
        code: str(c.code, 20),
        teacher: str(c.teacher, 60),
        room: str(c.room, 40),
        color: HEX.test(c.color) ? c.color : U.COLORS[0],
        icon: U.ICON_NAMES.indexOf(c.icon) >= 0 ? c.icon : 'book-open',
        slots: arr(c.slots).map(function (s) {
          s = s || {};
          return { day: Number(s.day), start: String(s.start), end: String(s.end) };
        }).filter(function (s) {
          return Number.isInteger(s.day) && s.day >= 0 && s.day <= 6 && TIME.test(s.start) && TIME.test(s.end);
        })
      };
    }).filter(function (c) { return c.name; });

    const courseIds = new Set(courses.map(function (c) { return c.id; }));

    const assignments = arr(r.assignments).map(function (a) {
      a = a || {};
      return {
        id: safeId(a.id),
        title: str(a.title, 120),
        courseId: courseIds.has(String(a.courseId)) ? String(a.courseId) : '',
        due: DATE.test(a.due) ? a.due : '',
        priority: PRIORITIES.indexOf(a.priority) >= 0 ? a.priority : 'medium',
        done: !!a.done,
        note: str(a.note, 500)
      };
    }).filter(function (a) { return a.title && a.due; });

    const exams = arr(r.exams).map(function (e) {
      e = e || {};
      return {
        id: safeId(e.id),
        title: str(e.title, 120),
        courseId: courseIds.has(String(e.courseId)) ? String(e.courseId) : '',
        date: DATE.test(e.date) ? e.date : '',
        time: TIME.test(e.time) ? e.time : '',
        place: str(e.place, 80),
        scope: str(e.scope, 1000),
        checklist: arr(e.checklist).map(function (x) {
          x = x || {};
          return { id: safeId(x.id), text: str(x.text, 120), done: !!x.done };
        }).filter(function (x) { return x.text; })
      };
    }).filter(function (e) { return e.title && e.date; });

    return {
      version: 1,
      profile: { name: str(p.name, 60), school: str(p.school, 80), avatar: img(p.avatar), logo: img(p.logo) },
      theme: THEMES.indexOf(r.theme) >= 0 ? r.theme : 'system',
      courses: courses,
      assignments: assignments,
      exams: exams
    };
  }

  // data ถูกแก้ไขแบบ in-place เสมอ เพื่อให้ทุกที่อ้างอิงอ็อบเจ็กต์เดียวกัน
  const data = normalize(null);

  function replace(raw) {
    const n = normalize(raw);
    Object.keys(data).forEach(function (k) { delete data[k]; });
    Object.assign(data, n);
  }

  function load() {
    try {
      const raw = global.localStorage.getItem(KEY);
      if (raw) replace(JSON.parse(raw));
    } catch (e) {
      console.warn('โหลดข้อมูลไม่สำเร็จ ใช้ข้อมูลเริ่มต้นแทน', e);
    }
  }

  function save() {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('บันทึกข้อมูลไม่สำเร็จ', e);
      return false;
    }
  }

  function hasData() {
    return data.courses.length + data.assignments.length + data.exams.length > 0;
  }

  function exportJSON() {
    return JSON.stringify(Object.assign({ exportedAt: new Date().toISOString() }, data), null, 2);
  }

  // เพิ่มข้อมูลตัวอย่าง (วันที่อ้างอิงจากวันนี้ จึงดูสมจริงเสมอ)
  function addSample() {
    const mk = function (name, code, teacher, room, color, icon, slots) {
      return { id: U.uid(), name: name, code: code, teacher: teacher, room: room, color: color, icon: icon, slots: slots };
    };
    const math = mk('คณิตศาสตร์', 'MA101', 'ครูสมชาย ใจดี', 'ห้อง 301', '#6366f1', 'calculator',
      [{ day: 1, start: '08:30', end: '10:00' }, { day: 3, start: '13:00', end: '14:30' }]);
    const eng = mk('ภาษาอังกฤษ', 'EN102', 'ครูวิภา ศรีสุข', 'ห้อง 205', '#ec4899', 'languages',
      [{ day: 2, start: '10:30', end: '12:00' }, { day: 4, start: '08:30', end: '10:00' }]);
    const sci = mk('วิทยาศาสตร์', 'SC103', 'ครูอนันต์ แสงทอง', 'ห้องแล็บ 2', '#10b981', 'flask-conical',
      [{ day: 1, start: '10:30', end: '12:00' }, { day: 5, start: '13:00', end: '15:00' }]);
    const his = mk('ประวัติศาสตร์', 'SO104', 'ครูปราณี รักไทย', 'ห้อง 112', '#f59e0b', 'landmark',
      [{ day: 3, start: '08:30', end: '10:00' }]);
    const it = mk('คอมพิวเตอร์', 'IT105', 'ครูธีรศักดิ์ ก้าวหน้า', 'ห้องคอม 1', '#0ea5e9', 'laptop',
      [{ day: 4, start: '13:00', end: '15:00' }]);
    const courses = [math, eng, sci, his, it];

    const asg = function (title, course, days, priority, done, note) {
      return { id: U.uid(), title: title, courseId: course.id, due: U.addDays(days), priority: priority, done: done, note: note || '' };
    };
    const assignments = [
      asg('ใบงานที่ 2 ระบบสมการ', math, -1, 'low', true, ''),
      asg('แบบฝึกหัดบทที่ 3 หน้า 45–48', math, 2, 'high', false, 'ทำลงสมุด ส่งก่อนคาบเรียน'),
      asg('เรียงความ My Weekend (150 คำ)', eng, 4, 'medium', false, ''),
      asg('รายงานการทดลองกรด-เบส', sci, 6, 'high', false, 'แนบรูปถ่ายการทดลอง 2 รูป'),
      asg('สรุปบทที่ 5 สมัยอยุธยา', his, 9, 'low', false, ''),
      asg('ทำเว็บไซต์แนะนำตัวเอง', it, 12, 'medium', false, 'ใช้ HTML + CSS')
    ];

    const chk = function (items) {
      return items.map(function (x) { return { id: U.uid(), text: x[0], done: x[1] }; });
    };
    const exams = [
      { id: U.uid(), title: 'สอบย่อยภาษาอังกฤษ', courseId: eng.id, date: U.addDays(4), time: '10:30', place: 'ห้อง 205',
        scope: 'Unit 3–4: Tenses และคำศัพท์ 60 คำ', checklist: chk([['ท่องคำศัพท์ Unit 3', true], ['ทำแบบฝึกหัด Tenses', false], ['ทบทวนคำศัพท์ Unit 4', false]]) },
      { id: U.uid(), title: 'สอบกลางภาค คณิตศาสตร์', courseId: math.id, date: U.addDays(9), time: '09:00', place: 'หอประชุมใหญ่',
        scope: 'บทที่ 1–4\n• เซต\n• ระบบสมการ\n• อสมการ\n• ฟังก์ชัน', checklist: chk([['สรุปสูตรบทที่ 1–2', true], ['ทำโจทย์บทที่ 3', true], ['ทำโจทย์บทที่ 4', false], ['ทำข้อสอบเก่า 2 ชุด', false]]) },
      { id: U.uid(), title: 'สอบกลางภาค วิทยาศาสตร์', courseId: sci.id, date: U.addDays(16), time: '13:00', place: 'ห้องแล็บ 2',
        scope: 'เคมีพื้นฐาน และการทดลองกรด-เบส', checklist: [] }
    ];

    data.courses.push.apply(data.courses, courses);
    data.assignments.push.apply(data.assignments, assignments);
    data.exams.push.apply(data.exams, exams);
  }

  global.Store = { KEY: KEY, data: data, normalize: normalize, replace: replace, load: load, save: save, hasData: hasData, exportJSON: exportJSON, addSample: addSample };
})(window);
