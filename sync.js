import {cloudConfig,authRedirectUrl} from './config.js';
import {freshState,validateState,mergeStates} from './core.js';
const SESSION='hundred-session-v1';
export function authErrorMessage(error){
 if(error.status===429||['over_email_send_rate_limit','over_request_rate_limit'].includes(error.code))return '验证邮件发送太频繁，请稍后再试，并检查垃圾邮件；已验证的账号可直接登录。';
 return ({invalid_credentials:'邮箱或密码不正确，请使用在本站注册时设置的密码。',email_not_confirmed:'邮箱尚未验证。请点击下方「重新发送验证邮件」，然后打开最新一封邮件中的验证链接。',email_address_not_authorized:'当前邮件服务只支持项目所有者的邮箱，请使用你的 Supabase 账号邮箱注册。'})[error.code]||({'Invalid login credentials':'邮箱或密码不正确，请使用在本站注册时设置的密码。','Email not confirmed':'邮箱尚未验证。请点击下方「重新发送验证邮件」，然后打开最新一封邮件中的验证链接。'})[error.message]||error.message;
}
export class Cloud {
 constructor(onStatus,onUser,onRemote,getState) {
  this.onStatus=onStatus;this.onUser=onUser;this.onRemote=onRemote;this.getState=getState;
  this.config=cloudConfig;this.session=null;this.busy=false;this.again=false;this.authNotice='';
  try {this.session=JSON.parse(localStorage.getItem(SESSION)||'null');}catch{}
 }
 get configured(){return Boolean(this.config.url&&this.config.key);}
 get user(){return this.session?.user ?? null;}
 async request(path,{method='GET',body,token}={}) {
  const res=await fetch(this.config.url+path,{method,headers:{apikey:this.config.key,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const text=await res.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new Error('同步服务返回异常，请稍后再试');}
  if(!res.ok) throw Object.assign(new Error(data?.msg||data?.message||data?.error_description||`请求失败 (${res.status})`),{status:res.status,code:data?.error_code||data?.code});
  return data;
 }
 saveSession(s){this.session=s;localStorage.setItem(SESSION,JSON.stringify(s));}
 async login(email,password) {
  const data=await this.request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
  this.saveSession({...data,expires_at:Date.now()/1000+data.expires_in});this.authNotice='';this.onUser();await this.sync();
 }
 async signup(email,password){
  const data=await this.request('/auth/v1/signup?'+new URLSearchParams({redirect_to:authRedirectUrl}),{method:'POST',body:{email,password}});
  if(data.access_token){this.saveSession({...data,expires_at:Date.now()/1000+data.expires_in});this.authNotice='';this.onUser();await this.sync();return true;}return false;
 }
 async resendConfirmation(email){
  await this.request('/auth/v1/resend?'+new URLSearchParams({redirect_to:authRedirectUrl}),{method:'POST',body:{type:'signup',email}});
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
 async handleAuthCallback(){
  // Email verification links use Supabase's client-side implicit callback.
  const fragment=new URLSearchParams(location.hash.slice(1));
  const hasError=fragment.has('error')||fragment.has('error_code');
  if(hasError||fragment.has('access_token')){
   history.replaceState(null,'',location.pathname+location.search);
   if(hasError){
    this.authNotice=fragment.get('error_code')==='otp_expired'?'验证链接已失效或已使用。如果已验证过邮箱，请直接登录；否则重新发送验证邮件，只打开最新一封。':'邮箱验证未完成，请重新发送验证邮件；如果已经验证过，请直接登录。';
    return;
   }
   try {
    if(!fragment.get('refresh_token'))throw new Error('验证链接不完整');
    const user=await this.request('/auth/v1/user',{token:fragment.get('access_token')});
    this.saveSession({user,access_token:fragment.get('access_token'),refresh_token:fragment.get('refresh_token'),expires_at:Date.now()/1000+Number(fragment.get('expires_in')||3600)});
    this.authNotice='';
   }catch{this.authNotice='未能完成验证登录。请先尝试使用邮箱和密码登录；若提示尚未验证，再重新发送验证邮件。';}
  }
 }
 async start(){
  await this.handleAuthCallback();
  this.onUser();this.sync();setInterval(()=>{if(!document.hidden)this.sync();},30000);
  window.addEventListener('online',()=>this.sync());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.sync();});
  window.addEventListener('storage',event=>{
   if(event.key===SESSION){const old=this.user?.id;try{this.session=JSON.parse(event.newValue||'null');}catch{this.session=null;}if(this.user?.id!==old)this.onUser();this.sync();}
  });
 }
}
