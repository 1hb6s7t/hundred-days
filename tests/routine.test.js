import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlan,minimumTasks} from '../plan.js';
import {routine,shoppingWeek} from '../routine.js';
import {dailyMeals,dailyTraining} from '../daily-body.js';
import {scheduleView,dailyMealsView} from '../views.js';
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
 assert.match(all[0].items.find(i=>i.id==='veg').options[0],/3.5 kg/);
 assert.match(all.at(-1).items.find(i=>i.id==='veg').options[0],/1 kg/);
 const s=freshState();setCell(s,'day/8/shopbuy-veg',true,'test');setCell(s,'day/8/shopchoice-veg',1,'test');
 assert.equal(readCell(validateState(s),'day/8/shopbuy-veg'),true);
 assert.equal(readCell(validateState(s),'day/8/shopchoice-veg'),1);
 setCell(s,'day/8/mealchoice-breakfast',1,'test');
 assert.equal(readCell(validateState(s),'day/8/mealchoice-breakfast'),1);
});

test('each day has three concrete meals and its matching exercise route',()=>{
 for(let day=1;day<=100;day++){
  const p=makePlan(day),meals=dailyMeals(day);
  for(const name of ['breakfast','lunch','dinner']){
   assert.equal(meals[name].options.length,2,`D${day} ${name}`);
   assert.ok(meals[name].options.every(option=>/\d/.test(option)),`D${day} ${name} has portions`);
  }
  for(const route of ['community','gym']){
   const workout=dailyTraining(p,route);
   assert.equal(workout.strength,p.strength);
   assert.equal(workout.exercises.length,p.strength?5:0);
   assert.ok(workout.exercises.every(e=>e.sets>=2&&e.reps&&e.cue));
  }
 }
 assert.equal(dailyTraining(makePlan(31),'gym').exercises[1].sets,2);
 assert.equal(dailyTraining(makePlan(29),'community').exercises[0].sets,3);
 assert.equal(dailyTraining(makePlan(50),'community').exercises[0].sets,2);
 assert.equal(makePlan(2).minutes,45);
});

test('a selected meal appears in both the meal card and its time block',()=>{
 const p=makePlan(8),choice=dailyMeals(8).breakfast.options[1];
 const read=id=>id==='mealchoice-breakfast'?1:false;
 const schedule=scheduleView(p,{tasks:p.tasks,read,future:true,esc:value=>String(value),route:'community'});
 const meals=dailyMealsView(p,{read,esc:value=>String(value)});
 assert.ok(schedule.includes(choice));
 assert.ok(meals.includes(choice));
 assert.match(schedule,/固定低杠斜身划船/);
});
