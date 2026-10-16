import test from 'node:test';
import assert from 'node:assert/strict';
import {dateKey,addDays,dayNumber,freshState,setCell,readCell,mergeStates,validateState,completion,validDate} from '../core.js';
import {makePlan,minimumTasks,mockDays,setsFor,prompts} from '../plan.js';
import {units} from '../practice.js';
test('calendar spans 100 days across year boundary, Shanghai date stays correct',()=>{
 assert.equal(addDays('2026-10-19',99),'2027-01-26');assert.equal(dayNumber('2026-10-19','2027-01-26'),100);assert.equal(dateKey(new Date('2026-10-18T17:00:00Z')),'2026-10-19');assert.equal(validDate('2026-02-30'),false);
});
test('default schedule includes 41 strength days, safe spacing and five mocks',()=>{
 const plans=Array.from({length:100},(_,i)=>makePlan(i+1));const lifts=plans.filter(p=>p.strength);assert.equal(lifts.length,41);assert.deepEqual(plans.filter(p=>p.mock).map(p=>p.day),mockDays);assert.equal(plans[99].strength,false);assert.ok(lifts.every((p,i)=>i===0||p.day-lifts[i-1].day>=2));
 for(const p of plans){assert.equal(p.tasks.filter(t=>t.group==='english').reduce((sum,t)=>sum+t.minutes,0),p.english);assert.ok(p.tasks.every(t=>!t.minutes||t.minutes>0));assert.equal(new Set(p.tasks.map(t=>t.id)).size,p.tasks.length);}
 assert.equal(setsFor(50,0),2);assert.equal(setsFor(35,0),3);assert.equal(setsFor(92,0),2);
});
test('budgets follow actual weekends after changing start date',()=>{const p=makePlan(1,'2026-10-17');assert.equal(p.dow,5);assert.equal(p.english,210);assert.equal(p.strength,true);});
test('minimum does not falsely complete full day',()=>{const s=freshState();for(const t of minimumTasks)setCell(s,'day/1/'+t.id,true,'a');assert.equal(completion(s,1,minimumTasks).complete,true);assert.equal(completion(s,1,makePlan(1).tasks).complete,false);});
test('offline edits merge without losing independent fields; latest uncheck survives',()=>{
 const a=freshState(),b=freshState();setCell(a,'day/1/listen',true,'a',100);setCell(b,'day/1/food',true,'b',101);let m=mergeStates(a,b);assert.equal(readCell(m,'day/1/listen'),true);assert.equal(readCell(m,'day/1/food'),true);setCell(b,'day/1/listen',false,'b',200);m=mergeStates(m,b);assert.equal(readCell(m,'day/1/listen'),false);assert.deepEqual(mergeStates(a,b),mergeStates(b,a));assert.deepEqual(mergeStates(m,m),m);
});
test('import rejects malformed fields, prototype keys, and implausible timestamps',()=>{
 const s=freshState();setCell(s,'settings/start','2026-10-19','a');assert.deepEqual(validateState(s),s);for(const raw of [{version:2,cells:{}},{version:1,cells:{'day/0/note':{value:'x',at:1,device:'a'}}},{version:1,cells:{'settings/start':{value:'bad',at:1,device:'a'}}},{version:1,cells:{'day/1/note':{value:{html:'bad'},at:1,device:'a'}}}])assert.throws(()=>validateState(raw));
});
test('all 100 days have five tailored prompts and complete original practice units',()=>{
 for(let d=1;d<=100;d++)for(const type of ['speak','pronunciation','listen','chunks','write'])assert.ok(prompts(makePlan(d),'A1',type).length>80);
 assert.equal(units.length,28);for(const u of units){assert.equal(u.questions.length,3);assert.equal(u.answers.length,3);assert.equal(u.chunks.length,6);assert.ok(u.text.length>180);}
});
