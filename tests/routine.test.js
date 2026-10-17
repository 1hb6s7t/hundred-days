import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlan,minimumTasks} from '../plan.js';
import {routine,shoppingWeek} from '../routine.js';
import {freshState,setCell,readCell,validateState} from '../core.js';

for(const start of ['2026-10-19','2026-10-17'])test(`all 100 daily schedules are ordered and every task has a check-in (${start})`,()=>{
 for(let day=1;day<=100;day++){
  const p=makePlan(day,start),rows=routine(p),ids=rows.flatMap(row=>row.taskIds);
  assert.deepEqual(ids.slice().sort(),p.tasks.map(t=>t.id).sort(),`D${day}: task coverage`);
  for(let i=1;i<rows.length;i++)assert.ok(rows[i].start>=rows[i-1].end,`D${day}: ${rows[i-1].title} overlaps ${rows[i].title}`);
  assert.equal(rows.at(-1).taskIds[0],'sleep');
  const min=routine(p,true).flatMap(row=>row.taskIds);
  assert.deepEqual(min.slice().sort(),minimumTasks.map(t=>t.id).sort());
 }
});

test('the shop list covers exactly 100 days and the final partial week shrinks quantities',()=>{
 const all=Array.from({length:15},(_,i)=>shoppingWeek(i+1));
 assert.equal(all.reduce((n,w)=>n+w.days,0),100);
 assert.deepEqual(all.at(-1).items.map(i=>i.id),all[0].items.map(i=>i.id));
 assert.match(all[0].items.find(i=>i.id==='veg').options[0],/2.8 kg/);
 assert.match(all.at(-1).items.find(i=>i.id==='veg').options[0],/0.8 kg/);
 const s=freshState();setCell(s,'day/8/shopbuy-veg',true,'test');setCell(s,'day/8/shopchoice-veg',1,'test');
 assert.equal(readCell(validateState(s),'day/8/shopbuy-veg'),true);
 assert.equal(readCell(validateState(s),'day/8/shopchoice-veg'),1);
});
