import {cloudConfig} from './config.js';
import {freshState,validateState,mergeStates} from './core.js';
const SESSION='hundred-session-v1';
export class Cloud {
 constructor(onStatus,onUser,onRemote,getState) {
  this.onStatus=onStatus;this.onUser=onUser;this.onRemote=onRemote;this.getState=getState;
  this.config=cloudConfig;this.session=null;this.busy=false;this.again=false;
  try {this.session=JSON.parse(localStorage.getItem(SESSION)||'null');}catch{}
 }
 get configured(){return Boolean(this.config.url&&this.config.key);}
 get user(){return this.session?.user ?? null;}
 async request(path,{method='GET',body,token}={}) {
  const res=await fetch(this.config.url+path,{method,headers:{apikey:this.config.key,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const text=await res.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new Error('同步服务返回异常，请稍后再试');}
  if(!res.ok) throw new Error(data?.msg||data?.message||data?.error_description||`请求失败 (${res.status})`);
  return data;
 }
 saveSession(s){this.session=s;localStorage.setItem(SESSION,JSON.stringify(s));}
 async login(email,password) {
  const data=await this.request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
  this.saveSession({...data,expires_at:Date.now()/1000+data.expires_in});this.onUser();await this.sync();
 }
 async signup(email,password){
  const data=await this.request('/auth/v1/signup',{method:'POST',body:{email,password}});
  if(data.access_token){this.saveSession({...data,expires_at:Date.now()/1000+data.expires_in});this.onUser();await this.sync();return true;}return false;
 }
 async logout(){
  if(this.session) {try{await this.request('/auth/v1/logout',{method:'POST',token:this.session.access_token});}catch{}}
  this.session=null;localStorage.removeItem(SESSION);this.onUser();this.onStatus('未登录');
 }
 async token(){
  if(!this.session)throw new Error('请先登录');
  if(this.session.expires_at < Date.now()/1000+90){
   const d=await this.request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:this.session.refresh_token}});
   this.saveSession({...d,expires_at:Date.now()/1000+d.expires_in});
  }return this.session.access_token;
 }
 async sync(){
  if(!this.configured){this.onStatus('云端待配置');return;}
  if(!this.user){this.onStatus('登录后同步');return;}
  if(!navigator.onLine){this.onStatus('离线 · 已暂存');return;}
  if(this.busy){this.again=true;return;}
  this.busy=true;const owner=this.user.id;this.onStatus('正在同步…');
  try {
   const token=await this.token();
   const cells=Object.entries(this.getState().cells).map(([key,c])=>({key,...c}));
   if(cells.length)await this.request('/rest/v1/rpc/hundred_merge',{method:'POST',token,body:{incoming:cells}});
   const rows=[];
   for(let offset=0;offset<10000;offset+=1000){
    const batch=await this.request(`/rest/v1/hundred_cells?select=key,value,at,device&order=key.asc&limit=1000&offset=${offset}`,{token});
    rows.push(...batch);if(batch.length<1000)break;
   }
   const remote=freshState();for(const {key,...c} of rows)remote.cells[key]=c;
   if(this.user?.id!==owner)return;
   this.onRemote(mergeStates(this.getState(),validateState(remote)));this.onStatus('已同步');
  }catch(error){this.onStatus('同步失败 · 本地已保存',error.message);}
  finally{this.busy=false;if(this.again){this.again=false;this.schedule();}}
 }
 schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.sync(),1200);}
 start(){this.onUser();this.sync();setInterval(()=>{if(!document.hidden)this.sync();},30000);window.addEventListener('online',()=>this.sync());document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.sync();});}
}
