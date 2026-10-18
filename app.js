/* =====================================================
   app.js — ส่วนแสดงผลและการทำงานของแอป
   ===================================================== */
(function () {
  'use strict';

  const U = window.Utils;
  const Store = window.Store;
  const D = Store.data;
  const { esc, uid, DAY_NAMES, DAY_SHORT, DAY_ORDER, COLORS, ICONS, daysUntil, fmtDate, timeToMin } = U;

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const icon = function (name, cls) { return '<i data-lucide="' + name + '" class="' + (cls || 'w-4 h-4') + '"></i>'; };
  const refreshIcons = function () { if (window.lucide) window.lucide.createIcons(); };

  const TABS = [
    { id: 'schedule', label: 'ตารางเรียน', short: 'ตารางเรียน', icon: 'calendar-days' },
    { id: 'assignments', label: 'การบ้าน', short: 'การบ้าน', icon: 'notebook-pen' },
    { id: 'exams', label: 'สอบ & อ่านหนังสือ', short: 'สอบ', icon: 'graduation-cap' }
  ];

  const PRIORITY = {
    high: { label: 'สูง · High', cls: 'badge-high', rank: 0 },
    medium: { label: 'กลาง · Medium', cls: 'badge-medium', rank: 1 },
    low: { label: 'ต่ำ · Low', cls: 'badge-low', rank: 2 }
  };

  const ui = {
    tab: 'schedule',
    day: 'all',
    asg: { status: 'all', priority: 'all', course: 'all' },
    exam: 'upcoming'
  };

  const courseById = function (id) { return D.courses.find(function (c) { return c.id === id; }); };
  const courseName = function (c) { return c ? c.name : 'ไม่ระบุวิชา'; };

  function persist() {
    if (!Store.save()) toast('บันทึกข้อมูลไม่สำเร็จ (พื้นที่เก็บข้อมูลเต็มหรือถูกปิดไว้) ลองลดขนาดรูปหรือสำรองข้อมูลไว้', 'error');
  }

  /* ---------------------------------------------------
     Theme (Dark / Light)
     --------------------------------------------------- */
  const isDark = function () { return document.documentElement.classList.contains('dark'); };

  function applyTheme() {
    const dark = D.theme === 'dark' || (D.theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#0a0f1f' : '#6366f1');
  }

  function toggleTheme() {
    D.theme = isDark() ? 'light' : 'dark';
    persist();
    applyTheme();
    renderHeader();
    refreshIcons();
  }

  /* ---------------------------------------------------
     Toast
     --------------------------------------------------- */
  function toast(msg, type) {
    const box = $('#toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.setAttribute('role', 'status');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 260);
    }, 3200);
  }

  /* ---------------------------------------------------
     Derived data
     --------------------------------------------------- */
  function classesOn(day) {
    const out = [];
    D.courses.forEach(function (c) {
      c.slots.forEach(function (s) { if (s.day === day) out.push({ c: c, s: s }); });
    });
    return out.sort(function (a, b) { return timeToMin(a.s.start) - timeToMin(b.s.start); });
  }

  function sortedExams() {
    return D.exams.slice().sort(function (a, b) {
      return (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00'));
    });
  }

  function upcomingExams() {
    return sortedExams().filter(function (e) { return daysUntil(e.date) >= 0; });
  }

  /* ---------------------------------------------------
     Header / Banner / Nav
     --------------------------------------------------- */
  function renderHeader() {
    const logo = D.profile.logo || 'logo.svg';
    $('#appHeader').innerHTML =
      '<div class="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">' +
        '<button type="button" class="flex items-center gap-3 text-left" data-action="nav" data-tab="schedule" aria-label="กลับหน้าแรก">' +
          '<img src="' + esc(logo) + '" alt="โลโก้แอป" class="w-10 h-10 rounded-xl object-cover shadow-sm">' +
          '<span class="leading-tight">' +
            '<span class="block font-display font-semibold">ช่วยในการเรียน</span>' +
            '<span class="block text-xs text-muted">Student Study Planner</span>' +
          '</span>' +
        '</button>' +
        '<nav class="hidden md:flex ml-6 gap-1" aria-label="เมนูหลัก">' +
          TABS.map(function (t) {
            return '<button type="button" class="tab-btn ' + (ui.tab === t.id ? 'is-active' : '') + '" data-action="nav" data-tab="' + t.id + '"' +
              (ui.tab === t.id ? ' aria-current="page"' : '') + '>' + icon(t.icon, 'w-[18px] h-[18px]') + esc(t.label) + '</button>';
          }).join('') +
        '</nav>' +
        '<div class="ml-auto flex items-center gap-1">' +
          '<button type="button" class="icon-btn" data-action="open-data" aria-label="สำรอง / นำเข้าข้อมูล" title="สำรอง / นำเข้าข้อมูล">' + icon('database', 'w-5 h-5') + '</button>' +
          '<button type="button" class="icon-btn" data-action="toggle-theme" aria-label="สลับโหมดมืด/สว่าง" title="สลับโหมดมืด/สว่าง">' + icon(isDark() ? 'sun' : 'moon', 'w-5 h-5') + '</button>' +
        '</div>' +
      '</div>';
  }

  function renderNav() {
    $('#bottomNav').innerHTML =
      '<div class="grid grid-cols-3 max-w-md mx-auto">' +
        TABS.map(function (t) {
          return '<button type="button" class="bn-item ' + (ui.tab === t.id ? 'is-active' : '') + '" data-action="nav" data-tab="' + t.id + '"' +
            (ui.tab === t.id ? ' aria-current="page"' : '') + '>' + icon(t.icon, 'w-5 h-5') + '<span>' + esc(t.short) + '</span></button>';
        }).join('') +
      '</div>';
  }

  function renderBanner() {
    const p = D.profile;
    const now = new Date();
    const h = now.getHours();
    const hello = h < 12 ? 'สวัสดีตอนเช้า' : h < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
    const todayN = classesOn(now.getDay()).length;
    const pending = D.assignments.filter(function (a) { return !a.done; });
    const overdue = pending.filter(function (a) { return daysUntil(a.due) < 0; }).length;
    const nx = upcomingExams()[0];
    const nd = nx ? daysUntil(nx.date) : null;

    $('#banner').innerHTML =
      '<div class="banner rounded-3xl p-5 sm:p-7">' +
        '<div class="banner-blob b1"></div><div class="banner-blob b2"></div>' +
        '<div class="relative flex flex-col lg:flex-row lg:items-center gap-6">' +
          '<div class="flex items-center gap-4 min-w-0">' +
            '<button type="button" class="avatar-btn" data-action="open-profile" aria-label="แก้ไขโปรไฟล์และรูปภาพ" title="แก้ไขโปรไฟล์">' +
              (p.avatar ? '<img src="' + esc(p.avatar) + '" alt="รูปโปรไฟล์">' : icon('user', 'w-9 h-9')) +
              '<span class="avatar-edit">' + icon('camera', 'w-3.5 h-3.5') + '</span>' +
            '</button>' +
            '<div class="min-w-0">' +
              '<p class="text-sm text-white/80">' + hello + '</p>' +
              '<h1 class="font-display text-2xl sm:text-3xl font-semibold leading-tight break-words">' + (p.name ? esc(p.name) : 'นักเรียน') + '</h1>' +
              '<p class="text-sm text-white/80 mt-1">' + esc(U.fmtToday()) + (p.school ? ' · ' + esc(p.school) : '') + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="grid grid-cols-3 gap-2.5 sm:gap-3 lg:ml-auto lg:w-[28rem]">' +
            stat('calendar-check', String(todayN), 'คาบเรียนวันนี้') +
            stat('clipboard-list', String(pending.length), overdue ? 'งานค้าง (เลยกำหนด ' + overdue + ')' : 'งานที่ยังไม่เสร็จ') +
            stat('timer', nx ? (nd === 0 ? 'วันนี้' : nd + ' วัน') : '–', nx ? 'สอบ: ' + nx.title : 'ยังไม่มีกำหนดสอบ') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function stat(ic, value, label) {
    return '<div class="stat">' + icon(ic, 'w-[18px] h-[18px] opacity-90') +
      '<div class="stat-v">' + esc(value) + '</div><div class="stat-l" title="' + esc(label) + '">' + esc(label) + '</div></div>';
  }

  /* ---------------------------------------------------
     Shared view pieces
     --------------------------------------------------- */
  function viewHead(title, sub, btnAction, btnLabel) {
    return '<div class="flex flex-wrap items-end justify-between gap-3 mb-4">' +
      '<div><h2 class="font-display text-xl sm:text-2xl font-semibold">' + esc(title) + '</h2>' +
      '<p class="text-sm text-muted mt-0.5">' + esc(sub) + '</p></div>' +
      '<button type="button" class="btn btn-primary" data-action="' + btnAction + '">' + icon('plus') + esc(btnLabel) + '</button></div>';
  }

  function emptyState(ic, title, text, actions) {
    return '<div class="empty fade-in">' +
      '<div class="empty-ic">' + icon(ic, 'w-8 h-8') + '</div>' +
      '<h3 class="font-display font-semibold text-lg">' + esc(title) + '</h3>' +
      '<p class="text-sm text-muted mt-1 max-w-md mx-auto">' + esc(text) + '</p>' +
      (actions ? '<div class="flex flex-wrap justify-center gap-2 mt-5">' + actions + '</div>' : '') +
      '</div>';
  }

  const sampleBtn = function () {
    return '<button type="button" class="btn btn-ghost" data-action="load-sample">' + icon('sparkles') + 'ใส่ข้อมูลตัวอย่าง</button>';
  };

  function actionBtns(editAct, delAct, id, label) {
    return '<button type="button" class="icon-btn icon-btn-sm" data-action="' + editAct + '" data-id="' + esc(id) + '" aria-label="แก้ไข ' + esc(label) + '" title="แก้ไข">' + icon('pencil', 'w-4 h-4') + '</button>' +
      '<button type="button" class="icon-btn icon-btn-sm danger" data-action="' + delAct + '" data-id="' + esc(id) + '" aria-label="ลบ ' + esc(label) + '" title="ลบ">' + icon('trash-2', 'w-4 h-4') + '</button>';
  }

  /* ---------------------------------------------------
     Page 1: ตารางเรียน
     --------------------------------------------------- */
  function classCard(item, isToday) {
    const c = item.c, s = item.s;
    const now = new Date();
    const nowM = now.getHours() * 60 + now.getMinutes();
    const live = isToday && nowM >= timeToMin(s.start) && nowM < timeToMin(s.end);
    return '<article class="class-card ' + (live ? 'is-live' : '') + '" style="--c:' + c.color + '">' +
      '<div class="cc-ic">' + icon(c.icon, 'w-5 h-5') + '</div>' +
      '<div class="min-w-0 flex-1">' +
        '<div class="flex flex-wrap items-center gap-x-2 gap-y-1"><h4 class="font-semibold leading-snug break-words">' + esc(c.name) + '</h4>' +
        (live ? '<span class="badge badge-live">กำลังเรียน</span>' : '') + '</div>' +
        (c.code ? '<p class="text-xs text-muted">' + esc(c.code) + '</p>' : '') +
        '<ul class="mt-2 space-y-1 text-sm">' +
          '<li class="meta">' + icon('clock') + '<span>' + s.start + '–' + s.end + ' น.</span></li>' +
          (c.room ? '<li class="meta">' + icon('map-pin') + '<span>' + esc(c.room) + '</span></li>' : '') +
          (c.teacher ? '<li class="meta">' + icon('user') + '<span class="break-words min-w-0">' + esc(c.teacher) + '</span></li>' : '') +
        '</ul>' +
      '</div>' +
      '<div class="card-actions">' + actionBtns('edit-course', 'del-course', c.id, c.name) + '</div>' +
    '</article>';
  }

  function viewSchedule() {
    const head = viewHead('ตารางเรียน', 'แสดงรายวิชาตามวันและเวลา', 'add-course', 'เพิ่มวิชา');
    if (!D.courses.length) {
      return head + emptyState('calendar-days', 'ยังไม่มีวิชาในตารางเรียน',
        'เริ่มจากเพิ่มวิชาแรกของคุณ หรือลองใส่ข้อมูลตัวอย่างเพื่อดูหน้าตาของแอป',
        '<button type="button" class="btn btn-primary" data-action="add-course">' + icon('plus') + 'เพิ่มวิชาแรก</button>' + sampleBtn());
    }

    const todayIdx = new Date().getDay();
    const chips = [{ v: 'all', l: 'ทั้งสัปดาห์', today: false }].concat(DAY_ORDER.map(function (d) {
      return { v: String(d), l: DAY_SHORT[d], today: d === todayIdx };
    }));
    const chipHtml = '<div class="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="กรองตามวัน">' +
      chips.map(function (c) {
        return '<button type="button" class="chip ' + (ui.day === c.v ? 'is-active' : '') + '" data-action="set-day" data-v="' + c.v + '">' +
          esc(c.l) + (c.today ? '<span class="dot-today" title="วันนี้"></span>' : '') + '</button>';
      }).join('') + '</div>';

    const days = ui.day === 'all' ? DAY_ORDER : [Number(ui.day)];
    const rows = days.map(function (d) {
      const items = classesOn(d);
      const isToday = d === todayIdx;
      return '<section class="day-row card" aria-label="' + DAY_NAMES[d] + '">' +
        '<div class="day-label ' + (isToday ? 'is-today' : '') + '">' +
          '<p class="font-display font-semibold">' + DAY_NAMES[d] + '</p>' +
          '<p class="text-xs ' + (isToday ? '' : 'text-muted') + '">' + (items.length ? items.length + ' คาบ' : 'ว่าง') + '</p>' +
          (isToday ? '<span class="badge badge-today md:mt-1.5">วันนี้</span>' : '') +
        '</div>' +
        '<div>' + (items.length
          ? '<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">' + items.map(function (i) { return classCard(i, isToday); }).join('') + '</div>'
          : '<p class="text-sm text-muted py-2.5">ไม่มีเรียน พักผ่อนได้เลย</p>') + '</div>' +
      '</section>';
    }).join('');

    return head + chipHtml + '<div class="space-y-3">' + rows + '</div>';
  }

  /* ---------------------------------------------------
     Page 2: การบ้าน
     --------------------------------------------------- */
  function dueChip(a) {
    if (a.done) return '';
    const d = daysUntil(a.due);
    if (d < 0) return '<span class="chip-due due-over">เลยกำหนด ' + (-d) + ' วัน</span>';
    if (d === 0) return '<span class="chip-due due-today">ส่งวันนี้</span>';
    if (d === 1) return '<span class="chip-due due-soon">พรุ่งนี้</span>';
    return '<span class="chip-due ' + (d <= 3 ? 'due-soon' : 'due-ok') + '">อีก ' + d + ' วัน</span>';
  }

  function asgItem(a) {
    const c = courseById(a.courseId);
    const pr = PRIORITY[a.priority];
    return '<li class="asg ' + (a.done ? 'is-done' : '') + '" style="--c:' + (c ? c.color : '#94a3b8') + '">' +
      '<input type="checkbox" class="check" data-change="toggle-asg" data-id="' + esc(a.id) + '" ' + (a.done ? 'checked' : '') + ' aria-label="ทำเสร็จแล้ว: ' + esc(a.title) + '">' +
      '<div class="min-w-0 flex-1">' +
        '<p class="asg-title">' + esc(a.title) + '</p>' +
        '<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-sm">' +
          '<span class="meta">' + icon('calendar') + '<span>ส่ง ' + esc(fmtDate(a.due)) + '</span></span>' +
          dueChip(a) +
          '<span class="badge ' + pr.cls + '">' + pr.label + '</span>' +
        '</div>' +
        (a.note ? '<p class="text-sm text-muted mt-1.5 whitespace-pre-line break-words">' + esc(a.note) + '</p>' : '') +
      '</div>' +
      '<div class="flex flex-none">' + actionBtns('edit-asg', 'del-asg', a.id, a.title) + '</div>' +
    '</li>';
  }

  function viewAssignments() {
    const head = viewHead('การบ้านและงาน', 'จดงานแยกตามวิชา ติ๊กเมื่อทำเสร็จ', 'add-asg', 'เพิ่มงาน');
    if (!D.assignments.length) {
      return head + emptyState('notebook-pen', 'ยังไม่มีการบ้าน',
        'จดงานที่ต้องส่ง กำหนดความสำคัญ แล้วติ๊กเมื่อทำเสร็จ',
        '<button type="button" class="btn btn-primary" data-action="add-asg">' + icon('plus') + 'เพิ่มงานแรก</button>' + sampleBtn());
    }

    const f = ui.asg;
    if (f.course !== 'all' && f.course !== '__none' && !courseById(f.course)) f.course = 'all';

    const total = D.assignments.length;
    const done = D.assignments.filter(function (a) { return a.done; }).length;
    const pct = Math.round(done / total * 100);

    const list = D.assignments.filter(function (a) {
      const sOk = f.status === 'all' || (f.status === 'done' ? a.done : !a.done);
      const pOk = f.priority === 'all' || a.priority === f.priority;
      const cOk = f.course === 'all' || (f.course === '__none' ? !a.courseId : a.courseId === f.course);
      return sOk && pOk && cOk;
    });

    // จัดกลุ่มตามวิชา
    const groups = new Map();
    list.forEach(function (a) {
      const k = a.courseId || '';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(a);
    });
    const keys = Array.from(groups.keys()).sort(function (x, y) {
      if (x === '') return 1;
      if (y === '') return -1;
      return courseName(courseById(x)).localeCompare(courseName(courseById(y)), 'th');
    });

    const cnt = {
      all: total,
      pending: total - done,
      done: done
    };
    const statusChips = [['all', 'ทั้งหมด'], ['pending', 'ยังไม่เสร็จ'], ['done', 'เสร็จแล้ว']].map(function (s) {
      return '<button type="button" class="chip ' + (f.status === s[0] ? 'is-active' : '') + '" data-action="set-asg-status" data-v="' + s[0] + '">' +
        s[1] + ' <span class="count">' + cnt[s[0]] + '</span></button>';
    }).join('');

    const courseOpts = '<option value="all">ทุกวิชา</option>' +
      D.courses.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'th'); }).map(function (c) {
        return '<option value="' + esc(c.id) + '" ' + (f.course === c.id ? 'selected' : '') + '>' + esc(c.name) + '</option>';
      }).join('') + '<option value="__none" ' + (f.course === '__none' ? 'selected' : '') + '>ไม่ระบุวิชา</option>';
    const prOpts = '<option value="all">ทุกระดับ</option>' + Object.keys(PRIORITY).map(function (k) {
      return '<option value="' + k + '" ' + (f.priority === k ? 'selected' : '') + '>' + PRIORITY[k].label + '</option>';
    }).join('');

    const progress =
      '<div class="card p-4 mb-4">' +
        '<div class="flex items-center justify-between text-sm mb-2">' +
          '<span class="font-medium flex items-center gap-2">' + icon('circle-check-big', 'w-4 h-4 text-emerald-500') + 'ความคืบหน้า</span>' +
          '<span class="text-muted">เสร็จ ' + done + ' / ' + total + ' งาน (' + pct + '%)</span>' +
        '</div><div class="progress"><span style="width:' + pct + '%"></span></div>' +
      '</div>';

    const filters =
      '<div class="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">' +
        '<div class="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="กรองตามสถานะ">' + statusChips + '</div>' +
        '<div class="flex gap-2 lg:ml-auto">' +
          '<select class="input" data-change="asg-priority" aria-label="กรองตามระดับความสำคัญ">' + prOpts + '</select>' +
          '<select class="input" data-change="asg-course" aria-label="กรองตามวิชา">' + courseOpts + '</select>' +
        '</div>' +
      '</div>';

    let body;
    if (!list.length) {
      body = emptyState('inbox', 'ไม่พบงานตามตัวกรอง', 'ลองเปลี่ยนตัวกรองด้านบน หรือเพิ่มงานใหม่', null);
    } else {
      body = '<div class="space-y-6">' + keys.map(function (k) {
        const c = courseById(k);
        const items = groups.get(k).slice().sort(function (a, b) {
          if (a.done !== b.done) return a.done ? 1 : -1;
          if (a.due !== b.due) return a.due.localeCompare(b.due);
          return PRIORITY[a.priority].rank - PRIORITY[b.priority].rank;
        });
        const dn = items.filter(function (a) { return a.done; }).length;
        return '<section>' +
          '<div class="flex items-center gap-2.5 mb-2.5 px-1" style="--c:' + (c ? c.color : '#94a3b8') + '">' +
            '<span class="dot"></span><h3 class="font-display font-semibold">' + esc(courseName(c)) + '</h3>' +
            '<span class="text-xs text-muted">เสร็จ ' + dn + '/' + items.length + '</span>' +
          '</div>' +
          '<ul class="space-y-2">' + items.map(asgItem).join('') + '</ul>' +
        '</section>';
      }).join('') + '</div>';
    }

    return head + progress + filters + body;
  }

  /* ---------------------------------------------------
     Page 3: สอบ & วางแผนอ่านหนังสือ
     --------------------------------------------------- */
  function countdown(e) {
    const d = daysUntil(e.date);
    if (d < 0) return '<div class="countdown cd-past"><b class="cd-num text-lg">ผ่านแล้ว</b></div>';
    if (d === 0) return '<div class="countdown cd-urgent"><b class="cd-num">วันนี้!</b></div>';
    const cls = d <= 3 ? 'cd-urgent' : d <= 7 ? 'cd-soon' : 'cd-ok';
    return '<div class="countdown ' + cls + '"><small>อีก</small><b class="cd-num">' + d + '</b><small>วัน</small></div>';
  }

  function examCard(e) {
    const c = courseById(e.courseId);
    const color = c ? c.color : '#6366f1';
    const total = e.checklist.length;
    const done = e.checklist.filter(function (x) { return x.done; }).length;
    const pct = total ? Math.round(done / total * 100) : 0;

    const items = e.checklist.map(function (x) {
      return '<li class="check-row ' + (x.done ? 'is-done' : '') + '">' +
        '<label><input type="checkbox" class="check" data-change="toggle-check" data-id="' + esc(e.id) + '" data-cid="' + esc(x.id) + '" ' + (x.done ? 'checked' : '') + '>' +
        '<span class="txt break-words min-w-0">' + esc(x.text) + '</span></label>' +
        '<button type="button" class="icon-btn icon-btn-sm danger" data-action="del-check" data-id="' + esc(e.id) + '" data-cid="' + esc(x.id) + '" aria-label="ลบหัวข้อ ' + esc(x.text) + '">' + icon('x', 'w-3.5 h-3.5') + '</button>' +
      '</li>';
    }).join('');

    return '<article class="card exam-card" style="--c:' + color + '">' +
      '<div class="exam-top">' +
        '<div class="min-w-0 flex-1">' +
          (c ? '<span class="badge mb-1.5" style="background:color-mix(in srgb,' + color + ' 16%,transparent);color:' + color + '">' + icon(c.icon, 'w-3 h-3') + esc(c.name) + '</span>' : '') +
          '<h3 class="font-display text-lg font-semibold leading-snug break-words">' + esc(e.title) + '</h3>' +
        '</div>' + countdown(e) +
      '</div>' +
      '<div class="p-4">' +
        '<ul class="space-y-1.5 text-sm">' +
          '<li class="meta">' + icon('calendar') + '<span>' + esc(fmtDate(e.date, true)) + '</span></li>' +
          (e.time ? '<li class="meta">' + icon('clock') + '<span>เวลา ' + e.time + ' น.</span></li>' : '') +
          (e.place ? '<li class="meta">' + icon('map-pin') + '<span>' + esc(e.place) + '</span></li>' : '') +
        '</ul>' +
        (e.scope ? '<div class="scope"><p class="label">ขอบเขตเนื้อหาที่ออกสอบ</p><p class="text-sm whitespace-pre-line break-words">' + esc(e.scope) + '</p></div>' : '') +
        '<div class="mt-4">' +
          '<div class="flex items-center justify-between text-sm mb-1.5">' +
            '<span class="font-medium flex items-center gap-1.5">' + icon('list-checks', 'w-4 h-4') + 'แผนการอ่านหนังสือ</span>' +
            '<span class="text-muted">' + done + '/' + total + '</span>' +
          '</div>' +
          '<div class="progress"><span style="width:' + pct + '%"></span></div>' +
          (total ? '<ul class="mt-2.5 space-y-0.5">' + items + '</ul>' : '<p class="text-sm text-muted mt-2">ยังไม่มีหัวข้อ เพิ่มหัวข้อที่ต้องอ่านได้ด้านล่าง</p>') +
          '<form data-form="add-check" data-id="' + esc(e.id) + '" class="mt-2.5 flex gap-2">' +
            '<input name="text" class="input" placeholder="เพิ่มหัวข้อที่ต้องอ่าน…" maxlength="120" autocomplete="off" required aria-label="เพิ่มหัวข้อแผนอ่านหนังสือ">' +
            '<button type="submit" class="btn btn-soft">' + icon('plus') + 'เพิ่ม</button>' +
          '</form>' +
        '</div>' +
        '<div class="flex justify-end gap-1 mt-4 pt-3 border-t" style="border-color:var(--border)">' + actionBtns('edit-exam', 'del-exam', e.id, e.title) + '</div>' +
      '</div>' +
    '</article>';
  }

  function viewExams() {
    const head = viewHead('กำหนดการสอบ & แผนอ่านหนังสือ', 'นับถอยหลังวันสอบ พร้อมเช็กลิสต์การอ่าน', 'add-exam', 'เพิ่มการสอบ');
    if (!D.exams.length) {
      return head + emptyState('graduation-cap', 'ยังไม่มีกำหนดการสอบ',
        'เพิ่มวันสอบ ขอบเขตเนื้อหา และวางแผนการอ่านหนังสือเป็นขั้นตอน',
        '<button type="button" class="btn btn-primary" data-action="add-exam">' + icon('plus') + 'เพิ่มการสอบ</button>' + sampleBtn());
    }

    const all = sortedExams();
    const up = all.filter(function (e) { return daysUntil(e.date) >= 0; });
    const past = all.filter(function (e) { return daysUntil(e.date) < 0; }).reverse();
    const list = ui.exam === 'upcoming' ? up : ui.exam === 'past' ? past : up.concat(past);

    const chips = [['upcoming', 'กำลังจะมาถึง', up.length], ['past', 'ผ่านไปแล้ว', past.length], ['all', 'ทั้งหมด', all.length]].map(function (c) {
      return '<button type="button" class="chip ' + (ui.exam === c[0] ? 'is-active' : '') + '" data-action="set-exam-filter" data-v="' + c[0] + '">' +
        c[1] + ' <span class="count">' + c[2] + '</span></button>';
    }).join('');

    const body = list.length
      ? '<div class="grid gap-4 lg:grid-cols-2 items-start">' + list.map(examCard).join('') + '</div>'
      : emptyState('inbox', 'ไม่มีรายการในหมวดนี้', 'ลองเลือกหมวดอื่น หรือเพิ่มการสอบใหม่', null);

    return head + '<div class="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="กรองการสอบ">' + chips + '</div>' + body;
  }

  /* ---------------------------------------------------
     Render
     --------------------------------------------------- */
  function render(opts) {
    renderHeader();
    renderNav();
    renderBanner();
    const view = $('#view');
    view.innerHTML = ui.tab === 'assignments' ? viewAssignments() : ui.tab === 'exams' ? viewExams() : viewSchedule();
    if (opts && opts.animate) {
      view.classList.remove('fade-in');
      void view.offsetWidth;
      view.classList.add('fade-in');
    }
    refreshIcons();
    document.title = (TABS.find(function (t) { return t.id === ui.tab; }).label) + ' | ช่วยในการเรียน';
  }

  // วาดใหม่แล้วคืนโฟกัสให้องค์ประกอบเดิม (สำหรับผู้ใช้คีย์บอร์ด)
  function renderKeepFocus(selector) {
    render();
    const el = selector && document.querySelector(selector);
    if (el) el.focus();
  }

  function applyHash() {
    const t = location.hash.slice(1);
    ui.tab = TABS.some(function (x) { return x.id === t; }) ? t : 'schedule';
    render({ animate: true });
  }

  function setTab(t) {
    if (location.hash.slice(1) === t) applyHash();
    else location.hash = t;
    window.scrollTo({ top: 0 });
  }

  /* ---------------------------------------------------
     Modal
     --------------------------------------------------- */
  const modal = $('#modal');
  let modalSubmit = null;
  let downOnBackdrop = false;

  function openModal(o) {
    modal.innerHTML =
      '<form id="modalForm" class="modal-card ' + (o.size === 'lg' ? 'modal-lg' : '') + '" autocomplete="off">' +
        '<header class="modal-head"><h2 class="font-display text-lg font-semibold">' + esc(o.title) + '</h2>' +
          '<button type="button" class="icon-btn" data-action="close-modal" aria-label="ปิด">' + icon('x', 'w-5 h-5') + '</button></header>' +
        '<div class="modal-body">' + o.body + '<p id="formError" class="form-error" role="alert" hidden></p></div>' +
        '<footer class="modal-foot">' +
          (o.onSubmit
            ? '<button type="button" class="btn btn-ghost" data-action="close-modal">ยกเลิก</button><button type="submit" class="btn btn-primary">' + esc(o.submitLabel || 'บันทึก') + '</button>'
            : '<button type="button" class="btn btn-primary" data-action="close-modal">ปิด</button>') +
        '</footer>' +
      '</form>';
    modalSubmit = o.onSubmit || null;
    if (!modal.open) modal.showModal();
    document.documentElement.classList.add('modal-open');
    refreshIcons();
    if (o.onSubmit) {
      const first = modal.querySelector('input[type="text"], input[type="date"], input:not([type]), textarea');
      if (first) first.focus();
    }
  }

  function closeModal() {
    if (modal.open) modal.close();
  }

  function showFormError(msg) {
    const el = $('#formError', modal);
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.scrollIntoView({ block: 'nearest' });
  }

  modal.addEventListener('close', function () {
    document.documentElement.classList.remove('modal-open');
    modal.innerHTML = '';
    modalSubmit = null;
  });
  modal.addEventListener('mousedown', function (e) { downOnBackdrop = e.target === modal; });
  modal.addEventListener('click', function (e) { if (e.target === modal && downOnBackdrop) closeModal(); });

  /* ---------------------------------------------------
     Forms
     --------------------------------------------------- */
  const field = function (label, inner, hint) {
    return '<label class="field"><span class="label">' + label + '</span>' + inner + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</label>';
  };

  function courseOptions(selected) {
    return '<option value="">ไม่ระบุวิชา</option>' +
      D.courses.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'th'); }).map(function (c) {
        return '<option value="' + esc(c.id) + '" ' + (c.id === selected ? 'selected' : '') + '>' + esc(c.name) + (c.code ? ' (' + esc(c.code) + ')' : '') + '</option>';
      }).join('');
  }

  /* ----- วิชาเรียน ----- */
  function slotRow(s) {
    s = s || { day: 1, start: '08:30', end: '10:00' };
    return '<div class="slot-row flex flex-wrap items-center gap-2">' +
      '<select name="day" class="input flex-1 min-w-[7.5rem]" aria-label="วัน">' +
        DAY_ORDER.map(function (d) { return '<option value="' + d + '" ' + (d === s.day ? 'selected' : '') + '>' + DAY_NAMES[d] + '</option>'; }).join('') +
      '</select>' +
      '<input type="time" name="start" class="input w-[7rem]" value="' + s.start + '" required aria-label="เวลาเริ่ม">' +
      '<span class="text-muted">–</span>' +
      '<input type="time" name="end" class="input w-[7rem]" value="' + s.end + '" required aria-label="เวลาเลิก">' +
      '<button type="button" class="icon-btn danger" data-action="remove-slot" aria-label="ลบช่วงเวลานี้">' + icon('x', 'w-4 h-4') + '</button>' +
    '</div>';
  }

  function findClash(course) {
    for (let i = 0; i < D.courses.length; i++) {
      const o = D.courses[i];
      if (o.id === course.id) continue;
      for (let a = 0; a < course.slots.length; a++) {
        for (let b = 0; b < o.slots.length; b++) {
          const x = course.slots[a], y = o.slots[b];
          if (x.day === y.day && x.start < y.end && y.start < x.end) return o.name;
        }
      }
    }
    return '';
  }

  function courseForm(id) {
    const c = id ? courseById(id) : null;
    if (id && !c) return;
    const v = c || {
      name: '', code: '', teacher: '', room: '',
      color: COLORS[D.courses.length % COLORS.length], icon: 'book-open',
      slots: [{ day: 1, start: '08:30', end: '10:00' }]
    };

    const body =
      field('ชื่อวิชา *', '<input class="input" name="name" required maxlength="80" value="' + esc(v.name) + '" placeholder="เช่น คณิตศาสตร์พื้นฐาน">') +
      '<div class="grid sm:grid-cols-2 gap-x-3">' +
        field('รหัสวิชา', '<input class="input" name="code" maxlength="20" value="' + esc(v.code) + '" placeholder="เช่น MA101">') +
        field('ห้องเรียน', '<input class="input" name="room" maxlength="40" value="' + esc(v.room) + '" placeholder="เช่น ห้อง 301">') +
      '</div>' +
      field('ชื่อผู้สอน', '<input class="input" name="teacher" maxlength="60" value="' + esc(v.teacher) + '" placeholder="เช่น ครูสมชาย ใจดี">') +
      '<fieldset class="field"><legend class="label">วัน-เวลาเรียน *</legend>' +
        '<div id="slots" class="space-y-2">' + v.slots.map(slotRow).join('') + '</div>' +
        '<button type="button" class="btn btn-soft mt-2.5" data-action="add-slot">' + icon('plus') + 'เพิ่มวัน/เวลาเรียน</button>' +
        '<span class="hint">วิชาที่เรียนหลายวัน ให้กดเพิ่มช่วงเวลาในวิชาเดียวกัน</span>' +
      '</fieldset>' +
      '<fieldset class="field"><legend class="label">สีประจำวิชา</legend><div class="flex flex-wrap gap-2.5">' +
        COLORS.map(function (col) {
          return '<label class="swatch" style="--c:' + col + '"><input type="radio" name="color" value="' + col + '" ' + (v.color === col ? 'checked' : '') + ' aria-label="สี ' + col + '"><span></span></label>';
        }).join('') + '</div></fieldset>' +
      '<fieldset class="field"><legend class="label">ไอคอนประจำวิชา</legend><div class="grid grid-cols-6 gap-2">' +
        ICONS.map(function (ic) {
          return '<label class="icon-opt" title="' + ic[1] + '"><input type="radio" name="icon" value="' + ic[0] + '" ' + (v.icon === ic[0] ? 'checked' : '') + ' aria-label="' + ic[1] + '"><span>' + icon(ic[0], 'w-5 h-5') + '</span></label>';
        }).join('') + '</div></fieldset>';

    openModal({
      title: c ? 'แก้ไขวิชาเรียน' : 'เพิ่มวิชาเรียน',
      body: body,
      onSubmit: function (form) {
        const fd = new FormData(form);
        const name = String(fd.get('name') || '').trim();
        if (!name) return 'กรุณากรอกชื่อวิชา';
        const slots = Array.prototype.map.call(form.querySelectorAll('.slot-row'), function (r) {
          return { day: Number(r.querySelector('[name="day"]').value), start: r.querySelector('[name="start"]').value, end: r.querySelector('[name="end"]').value };
        });
        if (!slots.length) return 'กรุณาเพิ่มวัน-เวลาเรียนอย่างน้อย 1 ช่วง';
        if (slots.some(function (s) { return !s.start || !s.end || s.end <= s.start; })) return 'เวลาเลิกเรียนต้องอยู่หลังเวลาเริ่มเรียน';

        const item = {
          id: c ? c.id : uid(),
          name: name,
          code: String(fd.get('code') || '').trim(),
          teacher: String(fd.get('teacher') || '').trim(),
          room: String(fd.get('room') || '').trim(),
          color: COLORS.indexOf(fd.get('color')) >= 0 ? fd.get('color') : COLORS[0],
          icon: U.ICON_NAMES.indexOf(fd.get('icon')) >= 0 ? fd.get('icon') : 'book-open',
          slots: slots
        };
        const clash = findClash(item);
        if (c) Object.assign(c, item); else D.courses.push(item);
        persist();
        render();
        toast(c ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มวิชาเรียนแล้ว', 'success');
        if (clash) toast('เวลาเรียนทับกับวิชา “' + clash + '”', 'warn');
      }
    });
  }

  function deleteCourse(id) {
    const c = courseById(id);
    if (!c) return;
    if (!confirm('ลบวิชา “' + c.name + '” ?\nการบ้านและตารางสอบของวิชานี้จะยังอยู่ แต่จะเปลี่ยนเป็น “ไม่ระบุวิชา”')) return;
    D.courses = D.courses.filter(function (x) { return x.id !== id; });
    D.assignments.forEach(function (a) { if (a.courseId === id) a.courseId = ''; });
    D.exams.forEach(function (e) { if (e.courseId === id) e.courseId = ''; });
    persist();
    render();
    toast('ลบวิชาแล้ว');
  }

  /* ----- การบ้าน ----- */
  function asgForm(id) {
    const a = id ? D.assignments.find(function (x) { return x.id === id; }) : null;
    if (id && !a) return;
    const v = a || { title: '', courseId: '', due: U.addDays(1), priority: 'medium', note: '' };

    const body =
      field('ชื่องาน/การบ้าน *', '<input class="input" name="title" required maxlength="120" value="' + esc(v.title) + '" placeholder="เช่น แบบฝึกหัดบทที่ 3">') +
      '<div class="grid sm:grid-cols-2 gap-x-3">' +
        field('วิชา', '<select class="input" name="courseId">' + courseOptions(v.courseId) + '</select>') +
        field('กำหนดส่ง *', '<input class="input" type="date" name="due" required value="' + esc(v.due) + '">') +
      '</div>' +
      '<fieldset class="field"><legend class="label">ระดับความสำคัญ</legend><div class="seg-group">' +
        Object.keys(PRIORITY).map(function (k) {
          return '<label class="seg"><input type="radio" name="priority" value="' + k + '" ' + (v.priority === k ? 'checked' : '') + '><span class="seg-opt seg-' + k + '">' + PRIORITY[k].label + '</span></label>';
        }).join('') + '</div></fieldset>' +
      field('บันทึกเพิ่มเติม', '<textarea class="input" name="note" maxlength="500" placeholder="รายละเอียด หรือสิ่งที่ต้องเตรียม">' + esc(v.note) + '</textarea>');

    openModal({
      title: a ? 'แก้ไขการบ้าน' : 'เพิ่มการบ้าน',
      body: body,
      onSubmit: function (form) {
        const fd = new FormData(form);
        const title = String(fd.get('title') || '').trim();
        if (!title) return 'กรุณากรอกชื่องาน';
        const due = String(fd.get('due') || '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return 'กรุณาเลือกกำหนดส่ง';
        const cid = String(fd.get('courseId') || '');
        const item = {
          id: a ? a.id : uid(),
          title: title,
          courseId: courseById(cid) ? cid : '',
          due: due,
          priority: PRIORITY[fd.get('priority')] ? fd.get('priority') : 'medium',
          done: a ? a.done : false,
          note: String(fd.get('note') || '').trim()
        };
        if (a) Object.assign(a, item); else D.assignments.push(item);
        persist();
        render();
        toast(a ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มการบ้านแล้ว', 'success');
      }
    });
  }

  /* ----- การสอบ ----- */
  function examForm(id) {
    const e = id ? D.exams.find(function (x) { return x.id === id; }) : null;
    if (id && !e) return;
    const v = e || { title: 'สอบกลางภาค', courseId: '', date: U.addDays(14), time: '09:00', place: '', scope: '' };

    const body =
      field('ชื่อการสอบ *', '<input class="input" name="title" required maxlength="120" value="' + esc(v.title) + '" placeholder="เช่น สอบกลางภาค คณิตศาสตร์">') +
      field('วิชา', '<select class="input" name="courseId">' + courseOptions(v.courseId) + '</select>') +
      '<div class="grid sm:grid-cols-2 gap-x-3">' +
        field('วันสอบ *', '<input class="input" type="date" name="date" required value="' + esc(v.date) + '">') +
        field('เวลาสอบ', '<input class="input" type="time" name="time" value="' + esc(v.time) + '">') +
      '</div>' +
      field('สถานที่สอบ', '<input class="input" name="place" maxlength="80" value="' + esc(v.place) + '" placeholder="เช่น หอประชุมใหญ่ / ห้อง 301">') +
      field('ขอบเขตเนื้อหาที่ออกสอบ', '<textarea class="input" name="scope" maxlength="1000" placeholder="เช่น บทที่ 1–4 เรื่องเซตและฟังก์ชัน">' + esc(v.scope) + '</textarea>') +
      (e ? '' : field('แผนการอ่านหนังสือ (เริ่มต้น)', '<textarea class="input" name="checklist" maxlength="1500" placeholder="พิมพ์หัวข้อละ 1 บรรทัด&#10;เช่น&#10;สรุปสูตรบทที่ 1&#10;ทำโจทย์บทที่ 2"></textarea>', 'พิมพ์หัวข้อละ 1 บรรทัด — เพิ่ม/ลบ/ติ๊กภายหลังได้ที่การ์ดการสอบ'));

    openModal({
      title: e ? 'แก้ไขการสอบ' : 'เพิ่มการสอบ',
      body: body,
      onSubmit: function (form) {
        const fd = new FormData(form);
        const title = String(fd.get('title') || '').trim();
        if (!title) return 'กรุณากรอกชื่อการสอบ';
        const date = String(fd.get('date') || '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'กรุณาเลือกวันสอบ';
        const cid = String(fd.get('courseId') || '');
        const item = {
          id: e ? e.id : uid(),
          title: title,
          courseId: courseById(cid) ? cid : '',
          date: date,
          time: String(fd.get('time') || ''),
          place: String(fd.get('place') || '').trim(),
          scope: String(fd.get('scope') || '').trim(),
          checklist: e ? e.checklist : String(fd.get('checklist') || '').split('\n')
            .map(function (t) { return t.trim().slice(0, 120); }).filter(Boolean)
            .map(function (t) { return { id: uid(), text: t, done: false }; })
        };
        if (e) Object.assign(e, item); else D.exams.push(item);
        persist();
        render();
        toast(e ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มการสอบแล้ว', 'success');
      }
    });
  }

  /* ----- โปรไฟล์ & รูปภาพ ----- */
  function imagePicker(name, label, current, hint) {
    const round = name === 'avatar' ? 'rounded-full' : 'rounded-2xl';
    return '<div class="field" data-picker="' + name + '">' +
      '<span class="label">' + label + '</span>' +
      '<div class="flex items-center gap-3">' +
        '<div class="pick-preview ' + round + '">' + (current ? '<img src="' + esc(current) + '" alt="">' : icon(name === 'avatar' ? 'user' : 'image', 'w-6 h-6')) + '</div>' +
        '<div class="flex flex-wrap gap-2">' +
          '<label class="btn btn-soft cursor-pointer">' + icon('upload') + 'เลือกรูป<input type="file" accept="image/*" class="sr-only-input" data-pick="' + name + '"></label>' +
          '<button type="button" class="btn btn-ghost" data-action="clear-pick" data-pick="' + name + '">' + icon('trash-2') + 'ลบรูป</button>' +
        '</div>' +
      '</div>' +
      '<input type="hidden" name="' + name + '" value="' + esc(current) + '">' +
      '<span class="hint">' + hint + '</span>' +
    '</div>';
  }

  function setPick(name, url) {
    const wrap = modal.querySelector('[data-picker="' + name + '"]');
    if (!wrap) return;
    wrap.querySelector('input[type="hidden"]').value = url;
    wrap.querySelector('.pick-preview').innerHTML = url ? '<img src="' + esc(url) + '" alt="">' : icon(name === 'avatar' ? 'user' : 'image', 'w-6 h-6');
    refreshIcons();
  }

  function handlePick(input) {
    const name = input.dataset.pick;
    const file = input.files && input.files[0];
    if (!file) return;
    const isAvatar = name === 'avatar';
    U.resizeImage(file, isAvatar ? 320 : 256, isAvatar ? 'image/jpeg' : 'image/png')
      .then(function (url) { setPick(name, url); })
      .catch(function (err) { showFormError(err.message); })
      .then(function () { input.value = ''; });
  }

  function openProfile() {
    const p = D.profile;
    openModal({
      title: 'โปรไฟล์และรูปภาพ',
      body:
        field('ชื่อของคุณ', '<input class="input" name="name" maxlength="60" value="' + esc(p.name) + '" placeholder="เช่น น้องมะลิ">') +
        field('โรงเรียน / ชั้นเรียน', '<input class="input" name="school" maxlength="80" value="' + esc(p.school) + '" placeholder="เช่น ม.4/2 โรงเรียนตัวอย่างวิทยา">') +
        imagePicker('avatar', 'รูปโปรไฟล์ (แสดงที่แบนเนอร์)', p.avatar, 'ย่อขนาดอัตโนมัติและเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น') +
        imagePicker('logo', 'โลโก้แอปพลิเคชัน (แสดงที่แถบด้านบน)', p.logo, 'ถ้าไม่ใส่ จะใช้โลโก้เริ่มต้นจาก logo.svg'),
      onSubmit: function (form) {
        const fd = new FormData(form);
        D.profile.name = String(fd.get('name') || '').trim().slice(0, 60);
        D.profile.school = String(fd.get('school') || '').trim().slice(0, 80);
        const clean = Store.normalize({ profile: { avatar: fd.get('avatar'), logo: fd.get('logo') } }).profile;
        D.profile.avatar = clean.avatar;
        D.profile.logo = clean.logo;
        persist();
        render();
        toast('บันทึกโปรไฟล์แล้ว', 'success');
      }
    });
  }

  /* ----- จัดการข้อมูล (สำรอง / นำเข้า / ล้าง) ----- */
  function openData() {
    openModal({
      title: 'จัดการข้อมูล',
      body:
        '<p class="text-sm text-muted mb-3">ข้อมูลทั้งหมดถูกเก็บใน <b>LocalStorage ของเบราว์เซอร์เครื่องนี้</b> จะไม่หายเมื่อรีเฟรช แต่จะหายถ้าล้างข้อมูลเบราว์เซอร์ หรือเปลี่ยนเครื่อง แนะนำให้สำรองไฟล์ไว้เป็นระยะ</p>' +
        '<div class="card p-3 mb-4 text-sm flex flex-wrap gap-x-5 gap-y-1">' +
          '<span>วิชา <b>' + D.courses.length + '</b></span><span>การบ้าน <b>' + D.assignments.length + '</b></span><span>การสอบ <b>' + D.exams.length + '</b></span>' +
        '</div>' +
        '<div class="grid sm:grid-cols-2 gap-2.5">' +
          '<button type="button" class="btn btn-soft" data-action="export">' + icon('download') + 'ดาวน์โหลดไฟล์สำรอง (.json)</button>' +
          '<button type="button" class="btn btn-soft" data-action="import">' + icon('upload') + 'นำเข้าไฟล์สำรอง</button>' +
          '<button type="button" class="btn btn-ghost" data-action="load-sample">' + icon('sparkles') + 'เพิ่มข้อมูลตัวอย่าง</button>' +
          '<button type="button" class="btn btn-danger" data-action="reset">' + icon('trash-2') + 'ล้างข้อมูลทั้งหมด</button>' +
        '</div>' +
        '<input type="file" id="importInput" accept="application/json,.json" class="sr-only-input" tabindex="-1" aria-hidden="true">'
    });
  }

  function handleImport(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const raw = JSON.parse(String(reader.result));
        if (!raw || typeof raw !== 'object' || !('courses' in raw || 'assignments' in raw || 'exams' in raw)) throw new Error('bad');
        if (!confirm('นำเข้าข้อมูลจากไฟล์นี้?\nข้อมูลปัจจุบันบนเครื่องจะถูกแทนที่ทั้งหมด')) return;
        Store.replace(raw);
        persist();
        applyTheme();
        closeModal();
        render();
        toast('นำเข้าข้อมูลเรียบร้อย', 'success');
      } catch (err) {
        toast('ไฟล์นี้ไม่ใช่ไฟล์สำรองของแอปนี้ หรือเสียหาย', 'error');
      }
    };
    reader.onerror = function () { toast('อ่านไฟล์ไม่สำเร็จ', 'error'); };
    reader.readAsText(file);
    input.value = '';
  }

  /* ---------------------------------------------------
     Events
     --------------------------------------------------- */
  const findAsg = function (id) { return D.assignments.find(function (a) { return a.id === id; }); };
  const findExam = function (id) { return D.exams.find(function (e) { return e.id === id; }); };

  const actions = {
    nav: function (d) { setTab(d.tab); },
    'toggle-theme': toggleTheme,
    'open-profile': openProfile,
    'open-data': openData,
    'close-modal': closeModal,
    'clear-pick': function (d) { setPick(d.pick, ''); },

    'add-course': function () { courseForm(); },
    'edit-course': function (d) { courseForm(d.id); },
    'del-course': function (d) { deleteCourse(d.id); },
    'add-slot': function () { $('#slots', modal).insertAdjacentHTML('beforeend', slotRow()); refreshIcons(); },
    'remove-slot': function (d, el) { el.closest('.slot-row').remove(); },
    'set-day': function (d) { ui.day = d.v; render(); },

    'add-asg': function () { asgForm(); },
    'edit-asg': function (d) { asgForm(d.id); },
    'del-asg': function (d) {
      const a = findAsg(d.id);
      if (!a || !confirm('ลบงาน “' + a.title + '” ?')) return;
      D.assignments = D.assignments.filter(function (x) { return x.id !== d.id; });
      persist(); render(); toast('ลบงานแล้ว');
    },
    'set-asg-status': function (d) { ui.asg.status = d.v; render(); },

    'add-exam': function () { examForm(); },
    'edit-exam': function (d) { examForm(d.id); },
    'del-exam': function (d) {
      const e = findExam(d.id);
      if (!e || !confirm('ลบการสอบ “' + e.title + '” พร้อมแผนอ่านหนังสือทั้งหมด ?')) return;
      D.exams = D.exams.filter(function (x) { return x.id !== d.id; });
      persist(); render(); toast('ลบการสอบแล้ว');
    },
    'set-exam-filter': function (d) { ui.exam = d.v; render(); },
    'del-check': function (d) {
      const e = findExam(d.id);
      if (!e) return;
      e.checklist = e.checklist.filter(function (x) { return x.id !== d.cid; });
      persist(); render();
    },

    'load-sample': function () {
      if (Store.hasData() && !confirm('เพิ่มข้อมูลตัวอย่างต่อท้ายข้อมูลที่มีอยู่?')) return;
      Store.addSample();
      persist(); closeModal(); render();
      toast('เพิ่มข้อมูลตัวอย่างแล้ว', 'success');
    },
    export: function () {
      U.download('study-planner-backup-' + U.todayStr() + '.json', Store.exportJSON());
      toast('ดาวน์โหลดไฟล์สำรองแล้ว', 'success');
    },
    import: function () { const i = $('#importInput', modal); if (i) i.click(); },
    reset: function () {
      if (!confirm('ล้างข้อมูลทั้งหมด (วิชา การบ้าน การสอบ และโปรไฟล์) ?\nการกระทำนี้ย้อนกลับไม่ได้ — แนะนำให้ดาวน์โหลดไฟล์สำรองก่อน')) return;
      const theme = D.theme;
      Store.replace(null);
      D.theme = theme;
      persist(); closeModal(); render();
      toast('ล้างข้อมูลทั้งหมดแล้ว');
    }
  };

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const h = actions[el.dataset.action];
    if (h) h(el.dataset, el, e);
  });

  document.addEventListener('change', function (e) {
    const t = e.target;
    if (t.dataset.pick) return handlePick(t);
    if (t.id === 'importInput') return handleImport(t);
    const a = t.dataset.change;
    if (!a) return;

    if (a === 'toggle-asg') {
      const item = findAsg(t.dataset.id);
      if (!item) return;
      item.done = t.checked;
      persist();
      renderKeepFocus('[data-change="toggle-asg"][data-id="' + t.dataset.id + '"]');
      if (item.done) toast('เยี่ยมมาก! ทำเสร็จอีกหนึ่งงานแล้ว 🎉', 'success');
    } else if (a === 'toggle-check') {
      const ex = findExam(t.dataset.id);
      const it = ex && ex.checklist.find(function (x) { return x.id === t.dataset.cid; });
      if (!it) return;
      it.done = t.checked;
      persist();
      renderKeepFocus('[data-change="toggle-check"][data-id="' + t.dataset.id + '"][data-cid="' + t.dataset.cid + '"]');
    } else if (a === 'asg-priority') {
      ui.asg.priority = t.value; render();
    } else if (a === 'asg-course') {
      ui.asg.course = t.value; render();
    }
  });

  document.addEventListener('submit', function (e) {
    const f = e.target;
    if (f.id === 'modalForm') {
      e.preventDefault();
      if (!modalSubmit) return closeModal();
      Promise.resolve(modalSubmit(f)).then(function (err) {
        if (typeof err === 'string') showFormError(err); else closeModal();
      });
      return;
    }
    if (f.dataset.form === 'add-check') {
      e.preventDefault();
      const ex = findExam(f.dataset.id);
      const text = f.elements.text.value.trim();
      if (!ex || !text) return;
      ex.checklist.push({ id: uid(), text: text.slice(0, 120), done: false });
      persist();
      render();
      const inp = document.querySelector('[data-form="add-check"][data-id="' + ex.id + '"] input[name="text"]');
      if (inp) inp.focus();
    }
  });

  /* ---------------------------------------------------
     Init
     --------------------------------------------------- */
  function init() {
    Store.load();
    applyTheme();
    window.addEventListener('hashchange', applyHash);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = function () { if (D.theme === 'system') { applyTheme(); renderHeader(); refreshIcons(); } };
    if (mq.addEventListener) mq.addEventListener('change', onScheme);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !modal.open) render(); });
    applyHash();
  }

  // รอให้ Lucide (defer) โหลดเสร็จก่อนวาดไอคอน
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.StudyPlanner = { render: render };
})();
