const App = {
  currentPage:"schedule", editingId:null, formType:null, toastTimer:null,
  init(){
    document.getElementById("today-label").textContent=new Intl.DateTimeFormat("th-TH",{weekday:"short",day:"numeric",month:"short"}).format(new Date());
    document.getElementById("year").textContent=new Date().getFullYear();
    this.bindEvents();this.applyTheme(Store.get(Store.keys.theme,"light"));
    Schedule.render();Assignments.render();Exams.render();this.updateStats();
    if(window.lucide)lucide.createIcons();
  },
  bindEvents(){
    document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>this.showPage(b.dataset.page)));
    document.querySelectorAll("[data-open-form]").forEach(b=>b.addEventListener("click",()=>this.openForm(b.dataset.openForm)));
    document.getElementById("day-tabs").addEventListener("click",e=>{const b=e.target.closest("[data-day]");if(b){Schedule.selectedDay=b.dataset.day;Schedule.render();}});
    document.getElementById("task-filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(b){Assignments.filter=b.dataset.filter;Assignments.render();}});
    document.getElementById("task-search").addEventListener("input",()=>Assignments.render());
    document.getElementById("theme-toggle").addEventListener("click",()=>this.applyTheme(document.body.classList.contains("dark")?"light":"dark"));
    document.getElementById("mobile-menu").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
    document.getElementById("modal-close").addEventListener("click",()=>this.closeForm());
    document.getElementById("modal-cancel").addEventListener("click",()=>this.closeForm());
    document.getElementById("modal-backdrop").addEventListener("click",e=>{if(e.target.id==="modal-backdrop")this.closeForm();});
    document.getElementById("entry-form").addEventListener("submit",e=>this.submitForm(e));
    document.body.addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]"), addPlan=e.target.closest("[data-add-plan]");
      if(edit)this.edit(edit.dataset.edit,edit.dataset.id);
      if(del)this.remove(del.dataset.delete,del.dataset.id);
      if(addPlan)Exams.addPlan(addPlan.dataset.addPlan);
    });
    document.body.addEventListener("change",e=>{
      if(e.target.matches("[data-toggle-task]"))Assignments.toggle(e.target.dataset.toggleTask,e.target.checked);
      if(e.target.matches("[data-toggle-plan]"))Exams.togglePlan(e.target.dataset.togglePlan,Number(e.target.dataset.planIndex),e.target.checked);
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape")this.closeForm();});
  },
  showPage(page){
    this.currentPage=page;
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
    document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
    document.getElementById("page-crumb").textContent=({schedule:"ตารางเรียน",assignments:"การบ้านและงาน",exams:"สอบและอ่านหนังสือ"})[page];
    document.getElementById("sidebar").classList.remove("open");
    window.scrollTo({top:0,behavior:"smooth"});
  },
  applyTheme(theme){
    document.body.classList.toggle("dark",theme==="dark");Store.set(Store.keys.theme,theme);
    document.getElementById("theme-label").textContent=theme==="dark"?"โหมดสว่าง":"โหมดมืด";
    document.getElementById("theme-icon").setAttribute("data-lucide",theme==="dark"?"sun":"moon");
    if(window.lucide)lucide.createIcons();
  },
  updateStats(){
    document.getElementById("stat-classes").textContent=Schedule.all().length;
    document.getElementById("stat-pending").textContent=Assignments.all().filter(x=>!x.done).length;
    document.getElementById("stat-exams").textContent=Exams.all().filter(x=>dateDistance(x.date)>=0).length;
  },
  openForm(type,item=null){
    this.formType=type;this.editingId=item?.id||null;
    const title={class:"วิชาเรียน",assignment:"การบ้าน / งาน",exam:"กำหนดสอบ"};
    document.getElementById("modal-title").textContent=(item?"แก้ไข":"เพิ่ม")+title[type];
    const fields=type==="class"?Schedule.form(item||{}):type==="assignment"?Assignments.form(item||{}):Exams.form(item||{});
    const values={...(item||{})};
    if(type==="exam")values.planText=(item?.plan||[]).map(p=>p.text).join("\n");
    document.getElementById("form-fields").innerHTML=fields.map(field=>{
      const val=values[field.name] ?? field.value ?? "";
      let input="";
      if(field.type==="select")input=`<select name="${field.name}" ${field.required?"required":""}>${field.options.map(([v,l])=>`<option value="${escapeHTML(v)}" ${String(val)===String(v)?"selected":""}>${escapeHTML(l)}</option>`).join("")}</select>`;
      else if(field.type==="textarea")input=`<textarea name="${field.name}" placeholder="${escapeHTML(field.placeholder||"")}" ${field.required?"required":""}>${escapeHTML(val)}</textarea>`;
      else input=`<input name="${field.name}" type="${field.type||"text"}" value="${escapeHTML(val)}" placeholder="${escapeHTML(field.placeholder||"")}" ${field.required?"required":""}>`;
      return `<div class="field ${field.full?"full":""}"><label>${escapeHTML(field.label)}</label>${input}</div>`;
    }).join("");
    document.getElementById("modal-backdrop").hidden=false;
    if(window.lucide)lucide.createIcons();
    setTimeout(()=>document.querySelector("#form-fields input, #form-fields select, #form-fields textarea")?.focus(),50);
  },
  edit(type,id){
    const source=type==="class"?Schedule.all():type==="assignment"?Assignments.all():Exams.all();
    const item=source.find(x=>x.id===id);if(item)this.openForm(type,item);
  },
  closeForm(){document.getElementById("modal-backdrop").hidden=true;document.getElementById("entry-form").reset();this.editingId=null;this.formType=null;},
  submitForm(e){
    e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());
    if(this.formType==="class"){
      if(data.end<=data.start){alert("เวลาเลิกเรียนต้องอยู่หลังเวลาเริ่มเรียน");return;}
      Schedule.create(data,this.editingId);
    }else if(this.formType==="assignment"){
      Assignments.create(data,this.editingId);
    }else if(this.formType==="exam"){
      const item=Exams.all().find(x=>x.id===this.editingId);
      Exams.create(data,this.editingId,item?.plan||[]);
    }
    const page=this.formType==="class"?"schedule":this.formType==="assignment"?"assignments":"exams";
    if(this.formType==="class")Schedule.selectedDay=data.day;
    this.closeForm();this.showPage(page);
    if(page==="schedule")Schedule.render();
  },
  remove(type,id){if(type==="class")Schedule.remove(id);else if(type==="assignment")Assignments.remove(id);else Exams.remove(id);},
  toast(message){
    const el=document.getElementById("toast");el.textContent=message;el.classList.add("show");
    clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove("show"),2400);
  }
};
document.addEventListener("DOMContentLoaded",()=>App.init());
