const Schedule = {
  selectedDay: "จันทร์",
  all() { return Store.get(Store.keys.classes); },
  save(items) { Store.set(Store.keys.classes, items); },
  render() {
    const items = this.all().filter(item => item.day === this.selectedDay).sort((a,b) => (a.start || "").localeCompare(b.start || ""));
    const container = document.getElementById("class-list");
    if (!items.length) {
      container.innerHTML = `<div class="empty-state"><i data-lucide="calendar-plus"></i><b>ยังไม่มีวิชาเรียนในวัน${this.selectedDay}</b><p>เพิ่มวิชาเรียนเพื่อสร้างตารางของคุณ</p></div>`;
    } else {
      container.innerHTML = items.map(item => {
        const index = Math.max(0, this.all().findIndex(x => x.id === item.id));
        const icon = SUBJECT_ICONS[index % SUBJECT_ICONS.length];
        return `<article class="class-row"><div class="class-time">${escapeHTML(item.start)} – ${escapeHTML(item.end)}<span>${escapeHTML(item.room || "ไม่ระบุห้อง")}</span></div><div class="class-color" style="background:${escapeHTML(item.color || "#6558e8")}"></div><div class="class-main"><div class="subject-icon"><i data-lucide="${icon}"></i></div><div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.code || "ไม่มีรหัส")} · ${escapeHTML(item.teacher || "ไม่ระบุผู้สอน")}</p></div></div><div class="class-actions"><button class="icon-button" data-edit="class" data-id="${item.id}" aria-label="แก้ไข"><i data-lucide="pencil"></i></button><button class="icon-button" data-delete="class" data-id="${item.id}" aria-label="ลบ"><i data-lucide="trash-2"></i></button></div></article>`;
      }).join("");
    }
    document.querySelectorAll(".day-tab").forEach(button => button.classList.toggle("active", button.dataset.day === this.selectedDay));
    if (window.lucide) lucide.createIcons();
    App.updateStats();
  },
  form(item = {}) {
    return [
      {name:"name",label:"ชื่อวิชา *",required:true,placeholder:"เช่น คณิตศาสตร์"},
      {name:"code",label:"รหัสวิชา",placeholder:"เช่น MAT101"},
      {name:"day",label:"วันที่เรียน *",type:"select",required:true,options:DAYS.map(x=>[x,x]),value:item.day || this.selectedDay},
      {name:"room",label:"ห้องเรียน",placeholder:"เช่น 302"},
      {name:"start",label:"เวลาเริ่ม *",type:"time",required:true,value:"08:30"},
      {name:"end",label:"เวลาเลิก *",type:"time",required:true,value:"10:00"},
      {name:"teacher",label:"ชื่อผู้สอน",placeholder:"เช่น อ.สมชาย"},
      {name:"color",label:"สีประจำวิชา",type:"select",options:[["#6558e8","ม่วง"],["#159b75","เขียว"],["#ed9149","ส้ม"],["#e35d72","ชมพู"],["#3288cf","ฟ้า"]],value:"#6558e8"}
    ];
  },
  create(data, id) {
    const items = this.all();
    if (id) { const index = items.findIndex(x=>x.id===id); if(index>=0) items[index] = {...items[index],...data}; }
    else items.push({id:Store.id(),...data});
    this.save(items); this.render(); App.toast(id ? "แก้ไขวิชาเรียนแล้ว" : "เพิ่มวิชาเรียนแล้ว");
  },
  remove(id) {
    if (!confirm("ต้องการลบวิชาเรียนนี้ใช่หรือไม่?")) return;
    this.save(this.all().filter(x=>x.id!==id)); this.render(); App.toast("ลบวิชาเรียนแล้ว");
  }
};
