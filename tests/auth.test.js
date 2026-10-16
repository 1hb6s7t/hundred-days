import test from 'node:test';
import assert from 'node:assert/strict';
import {Cloud,authErrorMessage} from '../sync.js';
import {authRedirectUrl} from '../config.js';
import {freshState} from '../core.js';

globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
function client(){return new Cloud(()=>{},()=>{},()=>{},freshState);}
function callback(hash){
 globalThis.location={hash,pathname:'/hundred-days/',search:''};
 let replacement;
 globalThis.history={replaceState:(_state,_title,url)=>replacement=url};
 return ()=>replacement;
}

test('signup and resend both preserve the full Pages callback path',async()=>{
 const cloud=client(),requests=[];
 cloud.request=async(path,options)=>{requests.push({url:new URL(path,cloud.config.url),options});return {};};
 assert.equal(await cloud.signup('person@example.invalid','test-password'),false);
 await cloud.resendConfirmation('person@example.invalid');
 assert.equal(requests[0].url.pathname,'/auth/v1/signup');
 assert.equal(requests[1].url.pathname,'/auth/v1/resend');
 for(const request of requests){
  assert.equal(request.url.searchParams.get('redirect_to'),authRedirectUrl);
  assert.equal(new URL(request.url.searchParams.get('redirect_to')).pathname,'/hundred-days/');
  assert.equal(request.options.method,'POST');
 }
 assert.deepEqual(requests[1].options.body,{type:'signup',email:'person@example.invalid'});
 assert.equal(cloud.user,null);
});

test('expired callback exposes recovery guidance, clears URL, sends no mail and keeps existing session',async()=>{
 const clean=callback('#error=access_denied&error_code=otp_expired&error_description=untrusted');
 const cloud=client();cloud.session={user:{id:'existing'}};
 cloud.request=async()=>{assert.fail('an error callback must not make an authentication request');};
 await cloud.handleAuthCallback();
 assert.match(cloud.authNotice,/已失效或已使用/);
 assert.match(cloud.authNotice,/重新发送验证邮件/);
 assert.doesNotMatch(cloud.authNotice,/untrusted/);
 assert.equal(clean(),'/hundred-days/');assert.equal(cloud.user.id,'existing');
});

test('verification callback validates token with server before saving session',async()=>{
 const clean=callback('#access_token=example-token&refresh_token=example-refresh&expires_in=3600');
 const cloud=client();let verified=false;
 cloud.request=async(path,options)=>{assert.equal(path,'/auth/v1/user');assert.equal(options.token,'example-token');assert.equal(cloud.user,null);verified=true;return {id:'verified'};};
 await cloud.handleAuthCallback();
 assert.equal(verified,true);assert.equal(cloud.user.id,'verified');assert.equal(cloud.authNotice,'');
 assert.equal(clean(),'/hundred-days/');
});

test('invalid verification callback remains signed out and gives actionable recovery',async()=>{
 callback('#access_token=expired-token&refresh_token=expired-refresh');
 const cloud=client();cloud.request=async()=>{throw new Error('invalid JWT');};
 await cloud.handleAuthCallback();
 assert.equal(cloud.user,null);assert.match(cloud.authNotice,/邮箱和密码登录/);
});

test('auth errors preserve server codes and offer Chinese recovery guidance',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({msg:'Email not confirmed',error_code:'email_not_confirmed'}),{status:400}));
 await assert.rejects(client().login('person@example.invalid','test-password'),error=>{
  assert.equal(error.code,'email_not_confirmed');assert.equal(error.status,400);
  assert.match(authErrorMessage(error),/重新发送验证邮件/);return true;
 });
 assert.match(authErrorMessage({status:429}),/稍后再试/);
});
