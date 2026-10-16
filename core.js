export const VERSION = 1;
export const DEFAULT_START = '2026-10-19';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year:'numeric',month:'2-digit',day:'2-digit' }).format(date);
}
export function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s; }
export function addDays(s,n) { const d = new Date(s+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export function dayNumber(start, date = dateKey()) { return Math.round((Date.parse(date)-Date.parse(start))/86400000)+1; }
export function weekday(date) { return (new Date(date+'T00:00:00Z').getUTCDay()+6)%7; }
export function dateLabel(date) { return new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long',timeZone:'UTC'}).format(new Date(date)); }
export function freshState() { return {version:VERSION, cells:{}}; }
// Each independently edited field has a logical timestamp. This avoids losing another
// device's checks when two devices edit different fields while offline.
export function readCell(state,key,fallback=null) { return state.cells[key]?.value ?? fallback; }
export function setCell(state,key,value,device,now=Date.now()) {
  const max = Math.max(0,...Object.values(state.cells).map(c=>c.at));
  state.cells[key]={value,at:Math.max(now,max+1),device}; return state;
}
export function mergeStates(a,b) {
  const merged=freshState();
  for(const state of [a,b]) for(const [key,cell] of Object.entries(state.cells)) {
    const old=merged.cells[key];
    if(!old || cell.at>old.at || (cell.at===old.at && cell.device>old.device)) merged.cells[key]=structuredClone(cell);
  }
  return merged;
}
export function validateState(raw) {
  if(!raw || raw.version!==1 || !raw.cells || Array.isArray(raw.cells) || typeof raw.cells!=='object') throw new Error('备份格式不正确');
  const entries=Object.entries(raw.cells);
  if(entries.length>10000) throw new Error('备份记录过多');
  const state=freshState();
  for(const [key,c] of entries) {
    if(!/^(settings\/(start|route|level)|day\/(?:[1-9]|[1-9][0-9]|100)\/[a-zA-Z0-9_-]+)$/.test(key)) throw new Error('备份含未知字段');
    if(!c || !Number.isSafeInteger(c.at) || c.at<0 || c.at>Date.now()+86400000 || typeof c.device!=='string' || c.device.length>100) throw new Error('备份时间戳无效');
    if(!['string','number','boolean'].includes(typeof c.value) && c.value!==null) throw new Error('备份值无效');
    if(typeof c.value==='number' && !Number.isFinite(c.value)) throw new Error('备份数值无效');
    if(typeof c.value==='string' && c.value.length>20000) throw new Error('单条记录过长');
    if(key==='settings/start' && !validDate(c.value)) throw new Error('开始日期无效');
    if(key==='settings/route' && !['community','gym'].includes(c.value)) throw new Error('训练路线无效');
    if(key==='settings/level' && !['A1','A2','B1','B2'].includes(c.value)) throw new Error('英语级别无效');
    state.cells[key]={value:c.value,at:c.at,device:c.device};
  }
  return state;
}
export function completion(state,day,tasks) {
  const done=tasks.filter(t=>readCell(state,`day/${day}/${t.id}`,false)===true).length;
  return {done,total:tasks.length,percent:Math.round(done/tasks.length*100),complete:done===tasks.length};
}
export function trendValues(state,field) {return Array.from({length:100},(_,i)=>({day:i+1,value:readCell(state,`day/${i+1}/${field}`)})).filter(p=>p.value!==null && p.value!=='' && Number.isFinite(Number(p.value))).map(p=>({...p,value:Number(p.value)}));}
