import {addDays,dateLabel} from './core.js';
import {routine,shoppingWeek} from './routine.js?v=4';
import {dailyMeals,dailyTraining} from './daily-body.js?v=4';

export function scheduleView(p,{minimum=false,tasks,read,future,esc,route}){
 const rows=routine(p,minimum),meals=dailyMeals(p.day),training=dailyTraining(p,route);
 return `<section class="card schedule-card" id="daily-schedule"><div class="card-heading"><div><span class="overline">TODAY, HOUR BY HOUR</span><h2>今天几点做？什么时候打卡？</h2><p>${p.dow<5?'工作日按 08:00–17:30 上班、步行通勤各15分钟排程。':'双休日安排较长学习时段，每段之间留休息。'}做完相应任务再勾选；下方任务清单会同步更新。</p></div><span class="tag">${minimum?'保底日':'标准日'}</span></div>${p.mock&&p.dow<5?'<div class="notice">测评编号落在工作日。下方是完整测评的白天模板；请预留休假，或将整套测评移至最近周末，再按实际完成打卡，避免熬夜补完。</div>':''}<div class="schedule-list">${rows.map(row=>`<article class="schedule-item"><div class="schedule-time"><strong>${row.start}</strong><span>${row.end}</span></div><div class="schedule-content"><h3>${esc(row.title)}</h3>${row.note?`<p>${esc(row.note)}</p>`:''}${mealCue(row,meals,read,esc)}${trainingCue(row,training,esc)}${row.taskIds.map(id=>{const task=tasks.find(x=>x.id===id);if(!task)return '';const done=read(id)===true;return `<label class="schedule-check ${done?'done':''}"><input type="checkbox" data-check="${id}" ${done?'checked':''} ${future?'disabled':''}><span>${done?'已打卡':'完成后打卡'} · ${esc(task.label)}</span></label>`;}).join('')}</div></article>`).join('')}</div><p class="small-note">时间可随工作和体力前后移动；打卡以实际完成为准。睡眠在次日醒来后确认，英语实际用时在下方单独记录。</p></section>`;
}

export function shoppingView(p,{week,read,startDate,esc}){
 const shop=shoppingWeek(week),first=shop.start,done=shop.items.filter(item=>read(first,'shopbuy-'+item.id)===true).length;
 return `<section class="card shopping-card" id="weekly-shopping"><div class="card-heading"><div><span class="overline">WEEKLY GROCERY LIST</span><h2>第 ${week} 周采购食材</h2><p>D${shop.start}–D${shop.end} · ${dateLabel(addDays(startDate,shop.start-1))}—${dateLabel(addDays(startDate,shop.end-1))} · 一人约 ${shop.days} 天</p></div><span class="tag">已备齐 ${done} / ${shop.items.length}</span></div><div class="shop-week-nav"><button class="outline" data-shop-week="${week-1}" ${week===1?'disabled':''}>← 上周</button><button class="outline" data-shop-week="${week+1}" ${week===15?'disabled':''}>下周 →</button></div><p class="small-note">这是采购估算，不是每日固定菜单。先扣除家里已有、食堂和外食会吃到的份量；主食与蛋白可以在同类中替换。勾选会同步到手机和电脑。</p><div class="shop-groups">${['主食','蛋白来源','蔬果'].map(group=>`<div class="shop-group"><h3>${group}</h3>${shop.items.filter(item=>item.group===group).map(item=>{const choice=Math.min(item.options.length-1,Math.max(0,Number(read(first,'shopchoice-'+item.id))||0)),bought=read(first,'shopbuy-'+item.id)===true;return `<div class="shop-row ${bought?'bought':''}"><label class="shop-check"><input type="checkbox" data-shop-buy="${item.id}" data-shop-day="${first}" ${bought?'checked':''}><span>${esc(item.label)}</span></label><label class="shop-select-label">本周选择<select data-shop-choice="${item.id}" data-shop-day="${first}">${item.options.map((option,i)=>`<option value="${i}" ${i===choice?'selected':''}>${esc(option)}</option>`).join('')}</select></label></div>`;}).join('')}</div>`).join('')}</div><p class="small-note">蔬菜按约500克/天、水果按约285克/天估算；鱼类约450克/周。这些数量落在<a href="https://www.nhc.gov.cn/sps/c100088/202505/6b7a718abd4848e8a3e98fc561a8858b.shtml" target="_blank" rel="noopener noreferrer">国家卫健委建议</a>范围内。购物数量按本周示例餐盘估算；选备选方案、食堂或外食时请相应增减。</p></section>`;
}

function mealCue(row,meals,read,esc){
 const key=row.title.includes('早餐')?'breakfast':row.title.includes('午餐')?'lunch':row.title.includes('晚餐')?'dinner':null;
 if(!key)return '';
 const options=meals[key].options,choice=Math.min(options.length-1,Math.max(0,Number(read('mealchoice-'+key))||0));
 return `<div class="schedule-meal"><strong>今日餐盘</strong><span>${esc(options[choice])}</span></div>`;
}
function trainingCue(row,training,esc){
 if(!row.title.startsWith('力量训练')||!training.strength)return '';
 return `<details class="schedule-training"><summary>查看本次动作、组数与次数</summary><ol>${training.exercises.map(e=>`<li>${esc(e.name)} · ${e.sets}组 × ${esc(e.reps)}</li>`).join('')}</ol></details>`;
}
export function dailyMealsView(p,{read,esc}){
 const meals=dailyMeals(p.day),names={breakfast:'早餐',lunch:'午餐',dinner:'晚餐'};
 return `<section class="card daily-meals-card" id="daily-meals"><div class="card-heading"><div><span class="overline">THREE MEALS TODAY</span><h2>第 ${p.day} 天，三餐吃什么？</h2><p>今天的第一套搭配按原计划的食物份量编排，第二套可在买不到食材时替换。</p></div></div><div class="meal-list">${Object.entries(names).map(([key,name])=>{const meal=meals[key],choice=Math.min(meal.options.length-1,Math.max(0,Number(read('mealchoice-'+key))||0));return `<article class="meal-item"><div class="meal-heading"><h3>${name}</h3><span>${esc(meal.time)}</span></div><p class="meal-plate">${esc(meal.options[choice])}</p><label>今天选择<select data-meal-choice="${key}">${meal.options.map((option,i)=>`<option value="${i}" ${i===choice?'selected':''}>${i===0?'方案 A':'备选 B'} · ${esc(option)}</option>`).join('')}</select></label><p class="small-note">${esc(meal.note)}</p></article>`;}).join('')}</div><details class="info-details"><summary>加餐和临时外食怎么替换</summary><p>${esc(meals.snack)}</p><p>${esc(meals.fallback)}</p></details><p class="small-note">主食克数并非碳水克数。肉鱼虾按生可食重，米饭按熟重；包装食品优先看标签。进食量结合原有食量、饥饿感和训练恢复调整；三餐完成后按时间表打卡。北豆腐示例按包装标注约12克蛋白/100克估算；高蛋白酸奶和豆浆也请核对标签。</p></section>`;
}
export function dailyWorkoutView(p,{route,esc}){
 const training=dailyTraining(p,route);
 return `<section class="card daily-workout-card" id="daily-workout"><div class="card-heading"><div><span class="overline">MOVEMENT TODAY</span><h2>第 ${p.day} 天，${p.strength?`力量 ${p.workout}`:'步行与恢复'}</h2><p>${p.strength?`约 ${p.minutes} 分钟；两种地点选一条路线。`:`约 ${p.minutes} 分钟；恢复日无需补力量。`}</p></div></div>${p.strength?`<div class="mode-switch"><button data-route="community" class="${route==='community'?'selected':''}">徒手 / 社区</button><button data-route="gym" class="${route==='gym'?'selected':''}">健身房</button></div><ol class="daily-exercises">${training.exercises.map(e=>`<li><div><strong>${esc(e.name)}</strong><span>${esc(e.cue)}</span></div><b>${e.sets}组 × ${esc(e.reps)}</b></li>`).join('')}</ol>`:`<p class="walk-prescription">${esc(training.walk)}</p>`}<p class="small-note">${esc(training.notes)}</p></section>`;
}
export function dailyBodyView(p,{route,read,esc}){return `<div class="daily-body-grid">${dailyWorkoutView(p,{route,esc})}${dailyMealsView(p,{read,esc})}</div>`;}
