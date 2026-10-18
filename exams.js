const Exams = {
  all(){return Store.get(Store.keys.exams);},
  save(items){Store.set(Store.keys.exams,items);},
  render(){
    const items=this.all().sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999"));
    const container=document.getElementById("exam-list");
    container.innerHTML=items.length?items.map(item=>{
      const days=dateDistance(item.date), countdown=days===null?"ยังไม่กำหนดวัน":days<0?`ผ่านมา ${Math.abs(days)} วัน`:days===0?"สอบวันนี้":`อีก ${days} วัน`;
      const plan=item.plan||[], done=plan.filter(x=>x.done).length, percent=plan.length?Math.round(done/plan.length*100):0;
      const date=new Date((item.date||"2000-01-01")+"T00:00:00");
      return `<article class="exam-card"><div class="exam-card-head"><div class="exam-date-box"><b>${item.date?date.getDate():"—"}</b><span>${item.date?new Intl.DateTimeFormat("th-TH",{month:"short"}).format(date):"ไม่ระบุ"}</span></div><div class="exam-info"><h3>${escapeHTML(item.subject)} — ${escapeHTML(item.title)}</h3><p>${escapeHTML(item.type||"การสอบ")}</p><div class="exam-meta"><span><i data-lucide="clock"></i>${item.time?escapeHTML(item.time):"ไม่ระบุเวลา"}</span><span><i data-lucide="map-pin"></i>${escapeHTML(item.place||"ไม่ระบุสถานที่")}</span></div></div><span class="countdown ${days===0?"today":""}">${countdown}</span></div><div class="exam-scope"><b><i data-lucide="list-checks" style="width:14px;display:inline-block;vertical-align:middle"></i> ขอบเขตเนื้อหาสอบ</b>${escapeHTML(item.scope||"ยังไม่ได้ระบุขอบเขต")}</div><div class="study-plan"><div class="study-plan-head"><span>แผนอ่านหนังสือ</span><span>${done}/${plan.length} งาน · ${percent}%</span></div><div class="study-checklist">${plan.length?plan.map((p,i)=>`<label class="study-check ${p.done?"done":""}"><input type="checkbox" data-toggle-plan="${item.id}" data-plan-index="${i}" ${p.done?"checked":""}><span>${escapeHTML(p.text)}</span></label>`).join(""):`<span class="muted">ยังไม่มีแผนอ่านหนังสือ</span>`}</div></div><div class="exam-actions"><button class="icon-button" data-add-plan="${item.id}" title="เพิ่มหัวข้ออ่าน"><i data-lucide="list-plus"></i></button><button class="icon-button" data-edit="exam" data-id="${item.id}" title="แก้ไข"><i data-lucide="pencil"></i></button><button class="icon-button" data-delete="exam" data-id="${item.id}" title="ลบ"><i data-lucide="trash-2"></i></button></div></article>`;
    }).join(""):`<div class="empty-state"><i data-lucide="book-open-check"></i><b>ยังไม่มีการสอบที่บันทึกไว้</b><p>เพิ่มวันสอบและสร้าง Checklist สำหรับอ่านหนังสือ</p></div>`;
    App.updateStats();if(window.lucide)lucide.createIcons();
  },
  form(item={}){return[
    {name:"subject",label:"วิชา *",required:true,placeholder:"เช่น วิทยาศาสตร์"},
    {name:"title",label:"ชื่อการสอบ *",required:true,placeholder:"เช่น สอบกลางภาค"},
    {name:"date",label:"วันสอบ *",type:"date",required:true},
    {name:"time",label:"เวลาสอบ",type:"time"},
    {name:"place",label:"สถานที่สอบ",placeholder:"เช่น ห้อง 204"},
    {name:"type",label:"ประเภทการสอบ",type:"select",options:[["กลางภาค","กลางภาค"],["ปลายภาค","ปลายภาค"],["เก็บคะแนน","เก็บคะแนน"],["สอบย่อย","สอบย่อย"],["อื่น ๆ","อื่น ๆ"]],value:"กลางภาค"},
    {name:"scope",label:"ขอบเขตเนื้อหาที่ออกสอบ",type:"textarea",full:true,placeholder:"เช่น บทที่ 1–3, สูตรที่ควรจำ..."},
    {name:"planText",label:"แผนอ่านหนังสือ (แยกแต่ละข้อด้วยการขึ้นบรรทัดใหม่)",type:"textarea",full:true,placeholder:"อ่านบทที่ 1\\nสรุปเนื้อหาบทที่ 2\\nทำแบบฝึกหัดทบทวน"}
  ];},
  create(data,id,existingPlan=[]){
    const {planText,...rest}=data;
    const plan=planText!==undefined?planText.split("\n").map(x=>x.trim()).filter(Boolean).map(text=>({text,done:false})):existingPlan;
    const items=this.all();
    if(id){const i=items.findIndex(x=>x.id===id);if(i>=0)items[i]={...items[i],...rest,plan};}
    else items.push({id:Store.id(),...rest,plan});
    this.save(items);this.render();App.toast(id?"แก้ไขกำหนดสอบแล้ว":"เพิ่มกำหนดสอบแล้ว");
  },
  togglePlan(id,index,done){this.save(this.all().map(x=>x.id===id?{...x,plan:x.plan.map((p,i)=>i===index?{...p,done}:p)}:x));this.render();},
  addPlan(id){const text=prompt("เพิ่มหัวข้อที่ต้องอ่าน:");if(!text||!text.trim())return;this.save(this.all().map(x=>x.id===id?{...x,plan:[...(x.plan||[]),{text:text.trim(),done:false}]}:x));this.render();App.toast("เพิ่มแผนอ่านหนังสือแล้ว");},
  remove(id){if(!confirm("ต้องการลบกำหนดสอบนี้ใช่หรือไม่?"))return;this.save(this.all().filter(x=>x.id!==id));this.render();App.toast("ลบกำหนดสอบแล้ว");}
};
