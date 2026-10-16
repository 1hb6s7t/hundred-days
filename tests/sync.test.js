import test from 'node:test';
import assert from 'node:assert/strict';
import {Cloud} from '../sync.js';
import {freshState,setCell,readCell} from '../core.js';

globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
function client(initial){let state=initial;const statuses=[];const cloud=new Cloud((s)=>statuses.push(s),()=>{},s=>state=s,()=>state);cloud.session={user:{id:'test-user'},access_token:'test-token',expires_at:Date.now()/1000+3600};return{cloud,statuses,state:()=>state};}
test('sync fetches beyond default 1000-row API limit',async()=>{
 const c=client(freshState()),rows=Array.from({length:1205},(_,i)=>({key:`day/${Math.floor(i/20)+1}/field${i%20}`,value:true,at:1,device:'b'}));const offsets=[];
 c.cloud.request=async path=>{const offset=Number(new URL('https://test.invalid'+path).searchParams.get('offset'));offsets.push(offset);return rows.slice(offset,offset+1000);};
 await c.cloud.sync();assert.deepEqual(offsets,[0,1000]);assert.equal(Object.keys(c.state().cells).length,1205);assert.equal(c.statuses.at(-1),'已同步');
});
test('failed writes keep local data and never falsely report success',async()=>{
 const s=freshState();setCell(s,'day/1/listen',true,'a');const c=client(s);c.cloud.request=async()=>{throw new Error('offline');};await c.cloud.sync();assert.equal(readCell(c.state(),'day/1/listen'),true);assert.equal(c.statuses.at(-1),'同步失败 · 本地已保存');
});
test('local edits during an in-flight read survive returned remote data',async()=>{
 const s=freshState(),c=client(s);c.cloud.request=async()=>{setCell(s,'day/1/note','new local edit','a',100);return [{key:'day/1/listen',value:true,at:50,device:'b'}];};await c.cloud.sync();assert.equal(readCell(c.state(),'day/1/note'),'new local edit');assert.equal(readCell(c.state(),'day/1/listen'),true);
});
test('account change during a request does not write another account cache',async()=>{
 const c=client(freshState());c.cloud.request=async()=>{c.cloud.session={user:{id:'different-user'}};return [{key:'day/1/listen',value:true,at:50,device:'b'}];};await c.cloud.sync();assert.equal(readCell(c.state(),'day/1/listen'),null);
});
