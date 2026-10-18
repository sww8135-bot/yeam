const Assignments = {
  filter: "all",
  all() { return Store.get(Store.keys.assignments); },
  save(items) { Store.set(Store.keys.assignments, items); },
  render() {
    const all = this.all(), query = (document.getElementById("task-search")?.value || "").trim().toLowerCase();
    const items = all.filter(item => (this.filter === "all" || (this.filter === "done" ? item.done : !item.done)) && `${item.title} ${item.subject}`.toLowerCase().includes(query)).sort((a,b)=>(a.due||"9999").localeCompare(b.due||"9999"));
    const container = document.getElementById("assignment-list");
    container.innerHTML = items.length ? items.map(item=>`<article class="assignment-card ${item.done?"completed":""}"><div class="assignment-top"><div><span class="subject-label">${escapeHTML(item.subject)}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description || "ไม่มีรายละเอียดเพิ่มเติม")}</p></div><span class="priority ${item.priority}">${({high:"สูง",medium:"ปานกลาง",low:"ต่ำ"})[item.priority]||"ปานกลาง"}</span></div><div class="assignment-bottom"><span class="due-date"><i data-lucide="calendar-clock"></i>ส่ง ${formatDate(item.due)}</span><label class="check-label"><input type="checkbox" data-toggle-task="${item.id}" ${item.done?"checked":""}> ${item.done?"เสร็จแล้ว":"ทำเสร็จแล้ว"}</label><button class="icon-button" data-edit="assignment" data-id="${item.id}" aria-label="แก้ไข"><i data-lucide="pencil"></i></button><button class="icon-button" data-delete="assignment" data-id="${item.id}" aria-label="ลบ"><i data-lucide="trash-2"></i></button></div></article>`).join("") : `<div class="empty-state" style="grid-column:1/-1"><i data-lucide="notebook-pen"></i><b>ยังไม่มีรายการที่ตรงกัน</b><p>เพิ่มงานใหม่ หรือเปลี่ยนตัวกรองเพื่อดูรายการอื่น</p></div>`;
    document.querySelectorAll(".filter-tab").forEach(b=>b.classList.toggle("active",b.dataset.filter===this.filter));
    const done=all.filter(x=>x.done).length, percent=all.length?Math.round(done/all.length*100):0;
    document.getElementById("task-progress-label").textContent=`${percent}% เสร็จแล้ว`;
    document.getElementById("task-progress-fill").style.width=percent+"%";
    document.getElementById("nav-task-count").textContent=all.filter(x=>!x.done).length;
    if(window.lucide) lucide.createIcons();
    App.updateStats();
  },
  form(item={}) {
    return [
      {name:"title",label:"ชื่องาน *",required:true,placeholder:"เช่น แบบฝึกหัดบทที่ 3"},
      {name:"subject",label:"วิชา *",required:true,placeholder:"เช่น คณิตศาสตร์"},
      {name:"due",label:"วันกำหนดส่ง *",type:"date",required:true},
      {name:"priority",label:"ระดับความสำคัญ",type:"select",options:[["high","สูง"],["medium","ปานกลาง"],["low","ต่ำ"]],value:"medium"},
      {name:"description",label:"รายละเอียดงาน",type:"textarea",full:true,placeholder:"จดรายละเอียดหรือสิ่งที่ต้องทำ..."}
    ];
  },
  create(data,id) {
    const items=this.all();
    if(id){const i=items.findIndex(x=>x.id===id);if(i>=0)items[i]={...items[i],...data};}
    else items.push({id:Store.id(),...data,done:false});
    this.save(items);this.render();App.toast(id?"แก้ไขงานแล้ว":"เพิ่มงานแล้ว");
  },
  toggle(id,done){this.save(this.all().map(x=>x.id===id?{...x,done}:x));this.render();App.toast(done?"ทำเครื่องหมายว่างานเสร็จแล้ว":"ย้ายกลับไปงานที่ยังไม่เสร็จ");},
  remove(id){if(!confirm("ต้องการลบงานนี้ใช่หรือไม่?"))return;this.save(this.all().filter(x=>x.id!==id));this.render();App.toast("ลบงานแล้ว");}
};
