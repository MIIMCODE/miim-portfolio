/* Declarative editors for studio content. All writes still go through the publish flow. */
(() => {
  'use strict';
  const C = window.MiimContent;
  const specs = {
    identity: ['identity-section','هویت برند و هیرو','نام، تیترها، تصویر پروفایل و لوگوی استودیو', {
      brand:['نام برند',100],brandSub:['زیرعنوان برند',180],name:['نام مدیر',100],roleFa:['عنوان فارسی',200],roleEn:['عنوان انگلیسی',200],availability:['متن وضعیت همکاری',200],available:['پذیرش پروژه فعال است',0,'checkbox'],heroEyebrow:['برچسب بالای هیرو',200],heroTitle:['تیتر اصلی هیرو',350],heroAccent:['بخش طلایی تیتر (بخشی از تیتر اصلی)',150],heroBio:['متن معرفی هیرو',2000,'textarea'],photo:['عکس اصلی هیروی پوستر',600,'image'],logo:['لوگوی برند',600,'image'] }],
    about:['about-section','دربارهٔ استودیو','معرفی و مزیت‌های همکاری', {eyebrow:['برچسب بخش',150],heading:['عنوان',350],text:['متن معرفی',4000,'textarea'],highlights:['مزیت‌ها؛ هر مورد در یک خط',0,'lines']}],
    services:['services-section','خدمات','افزودن، حذف و مرتب‌سازی خدمات', {title:['عنوان خدمت',150],subtitle:['زیرعنوان انگلیسی',150],badge:['برچسب',100],description:['توضیحات',1600,'textarea'],icon:['آیکون',0,'select',['code','layers','pen','play']],deliverables:['خروجی‌ها؛ هر مورد در یک خط',0,'lines']}],
    skills:['skills-section','مهارت‌ها','درصد هر مهارت بین ۰ تا ۱۰۰ است', {name:['نام مهارت',80],percent:['درصد',100,'number',0],tag:['ابزارها',120]}],
    stats:['stats-section','آمار هیرو','اعداد نمایشی و شمارش خودکار آثار منتشرشده', {label:['عنوان آمار',150],value:['عدد',1000000000,'number',0],prefix:['پیشوند',20],suffix:['پسوند',30],dynamicWorks:['محاسبهٔ خودکار از آثار قابل نمایش',0,'checkbox']}],
    process:['process-section','مراحل همکاری','عنوان و توضیح مرحله‌ها', {step:['شماره یا برچسب مرحله',20],title:['عنوان',150],desc:['توضیحات',1600,'textarea']}],
    testimonials:['testimonials-section','نظرات مشتریان','ویرایش متن، نام و امتیاز نظرها', {name:['نام مشتری',100],role:['سمت / شرکت',150],quote:['متن نظر',2000,'textarea'],rating:['امتیاز از ۵',5,'number',1]}],
    platforms:['social-section','شبکه‌های اجتماعی','آدرس‌های معتبر با http یا https', {key:['شبکه',0,'select',C.platforms],label:['عنوان نمایشی',50],url:['آدرس',2048,'url']}],
    contact:['contact-copy-section','متن بخش تماس','تیترها و آدرس؛ سفارش‌ها در صندوق خصوصی و روبیکا ثبت می‌شوند', {eyebrow:['برچسب',150],heading:['عنوان تماس',350],lead:['متن دعوت به همکاری',1600,'textarea'],address:['نشانی',400]}],
    seo:['seo-section','تنظیمات جست‌وجو و سایت','عنوان نتایج جست‌وجو و توضیح کوتاه', {title:['عنوان صفحه (خالی = عنوان خودکار)',180],description:['توضیح متا و اشتراک‌گذاری',400,'textarea']}],
    footer:['footer-section','پاورقی','متن حقوق و مالکیت سایت', {legal:['متن حقوقی',1000,'textarea']}],
  };
  const limits = {services:20,skills:30,stats:12,process:12,testimonials:30,platforms:12};
  const defaults = {services:{id:'',title:'خدمت جدید',subtitle:'',badge:'',description:'',icon:'code',deliverables:[]}, skills:{name:'مهارت جدید',percent:80,tag:''},stats:{label:'آمار جدید',value:0,prefix:'',suffix:'',dynamicWorks:false},process:{step:'',title:'مرحلهٔ جدید',desc:''},testimonials:{name:'مشتری',role:'',quote:'',rating:5},platforms:{key:'link',label:'لینک جدید',url:''}};
  let changed = () => {}, upload = async () => {}, locked = false;
  const mount = () => document.getElementById('studio-editor');
  function button(label, action, className='outline-button') { const b=document.createElement('button');b.type='button';b.className=className;b.textContent=label;b.addEventListener('click',action);return b; }
  function field(parent, key, spec, value, owner) {
    const [title,max,type='text',extra] = spec;
    const label=document.createElement('label');label.textContent=title;
    const input=document.createElement(type==='textarea'||type==='lines'?'textarea':type==='select'?'select':'input');
    input.dataset.cmsKey=key;input.dataset.cmsType=type;
    if (type==='select') extra.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;input.append(o);});
    else if(!['lines','textarea'].includes(type)) input.type=['image','text'].includes(type)?'text':type;
    if(type==='checkbox') input.checked=value !== false && Boolean(value);
    else input.value=type==='lines'?(value||[]).join('\n'):value??'';
    if(max && type!=='number') input.maxLength=max;
    if(type==='number'){input.min=extra;input.max=max;input.required=true;}
    if(['url','image'].includes(type))input.dir='ltr';
    label.append(input);parent.append(label);
    if(type==='image') {
      const preview=document.createElement('img');preview.className='cms-image-preview';preview.alt=title;
      preview.src=imageSrc(value);label.append(preview);
      const file=document.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp,image/gif';file.hidden=true;
      const status=document.createElement('small');status.className='helper-text';status.setAttribute('role','status');
      const trigger=button('آپلود تصویر',()=>file.click());
      file.addEventListener('change',async()=>{if(!file.files[0])return;try {trigger.disabled=true;status.textContent='در حال آپلود…';const url=await upload(file.files[0]);input.value=url;preview.src=url;status.textContent='آپلود شد؛ برای اعمال روی سایت منتشر کنید.';changed();}catch(e){status.textContent=e.message;}finally{trigger.disabled=locked;file.value='';}});
      label.append(trigger,file,status);
    }
  }
  function readFields(parent, base={}) {
    const result={...base};
    parent.querySelectorAll('[data-cms-key]').forEach(el=>{
      const type=el.dataset.cmsType;
      result[el.dataset.cmsKey]=type==='checkbox'?el.checked:type==='number'?Number(el.value):type==='lines'?el.value.split('\n').map(v=>v.trim()).filter(Boolean):el.value;
    });return result;
  }
  function render(data, options={}) {
    changed=options.onChange||changed;upload=options.onUpload||upload;
    const open = new Set(Array.from(mount().querySelectorAll('details[open]'),el=>el.id));
    const root=mount();root.replaceChildren();
    for(const [key,[id,title,desc,shape]] of Object.entries(specs)) {
      const section=document.createElement('details');section.id=id;section.className='cms-section';section.dataset.sectionKey=key;
      section.open=open.has(id);
      const summary=document.createElement('summary');const h=document.createElement('span');h.textContent=title;const small=document.createElement('small');small.textContent=desc;summary.append(h,small);section.append(summary);
      const content=document.createElement('div');content.className='cms-section-body';
      const items=key==='platforms'?data.contact.platforms:data[key];
      if(limits[key]) {
        const rows=document.createElement('div');rows.className='cms-rows';
        const renderRow=(value,index)=>{
          const row=document.createElement('article');row.className='cms-row';row._base=value;
          const toolbar=document.createElement('div');toolbar.className='cms-row-toolbar';
          const caption=document.createElement('strong');caption.textContent=`${index+1}. ${value.title||value.name||value.label||value.step||'ردیف'}`;
          toolbar.append(caption);
          toolbar.append(button('↑',()=>moveRow(row,-1)),button('↓',()=>moveRow(row,1)),button('حذف',()=>{if(confirm('این ردیف از پیش‌نویس حذف شود؟')){row.remove();changed();}},'text-button danger-button'));
          row.append(toolbar);const grid=document.createElement('div');grid.className='cms-grid';
          for(const [fieldKey,spec]of Object.entries(shape))field(grid,fieldKey,spec,value[fieldKey],key);
          row.append(grid);rows.append(row);
        };
        (items||[]).forEach(renderRow);
        const add=button('＋ افزودن ردیف',()=>{
          if(rows.children.length>=limits[key]){alert('به سقف تعداد ردیف‌ها رسیده‌اید.');return;}
          const item=structuredClone(defaults[key]);if(key==='services')item.id='service-'+crypto.randomUUID();
          renderRow(item,rows.children.length);changed();
        });content.append(rows,add);
      } else {
        const grid=document.createElement('div');grid.className='cms-grid';
        for(const [fieldKey,spec] of Object.entries(shape))field(grid,fieldKey,spec,(items||{})[fieldKey],key);
        content.append(grid);
      }
      if(key==='seo') {
        const label=document.createElement('label');label.textContent='تم پیش‌فرض بازدیدکنندهٔ جدید';
        const select=document.createElement('select');select.id='site-default-theme';
        for(const [v,t]of [['dark','تاریک'],['light','روشن']]){const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o);}select.value=data.theme||'dark';label.append(select);content.append(label);
      }
      section.append(content);root.append(section);
    }
  }
  function moveRow(row,dir){const sibling=dir<0?row.previousElementSibling:row.nextElementSibling;if(!sibling)return;if(dir<0)row.parentNode.insertBefore(row,sibling);else row.parentNode.insertBefore(sibling,row);changed();}
  function collect(base) {
    const out={...base,contact:{...base.contact}};
    mount().querySelectorAll('.cms-section').forEach(section=>{
      const key=section.dataset.sectionKey;
      const value=limits[key]?Array.from(section.querySelectorAll('.cms-row'),row=>readFields(row,row._base)):readFields(section,base[key]);
      if(key==='platforms')out.contact.platforms=value;
      else if(key==='contact')out.contact={...out.contact,...value};
      else out[key]=value;
    });out.theme=document.getElementById('site-default-theme').value;
    return out;
  }
  function imageSrc(value){try {const ref=C.image(value);return ref.startsWith(C.MEDIA)?ref:'../Image/'+encodeURIComponent(ref);}catch{return '';}}
  function lock(value){locked=value;mount().querySelectorAll('input,textarea,select,button').forEach(el=>{el.disabled=value;});}
  window.MiimCMS={render,collect,imageSrc,lock};
})();
