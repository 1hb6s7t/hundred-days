// Daily appointments are suggestions based on the supplied V2 timetable and an 08:00–17:30 workday.
const fmt=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const at=(hour,minute=0)=>hour*60+minute;
const block=(from,to,title,taskIds=[],note='')=>({start:fmt(from),end:fmt(to),title,taskIds,note});
export function routine(p,minimum=false){
 const t=Object.fromEntries(p.tasks.map(x=>[x.id,x.minutes||0]));
 if(minimum){
  const weekend=p.dow===5||p.dow===6;
  return weekend?[
   block(at(9),at(9,10),'听熟悉材料 10 分钟',['min-listen'],'听完立刻勾选'),
   block(at(9,20),at(9,30),'旧词块提取 10 分钟',['min-chunks'],'完成后勾选'),
   block(at(14),at(14,10),'说或写 10 分钟',['min-output'],'留下自己的句子后勾选'),
   block(at(16),at(16,20),'轻松步行 20 分钟',['min-move'],'走完后勾选'),
   block(at(21,30),at(21,35),'核对三餐与睡眠',['min-life'],'确认后勾选；22:15 左右准备睡觉')
  ]:[
   block(at(6,35),at(6,45),'听熟悉材料 10 分钟',['min-listen'],'听完立刻勾选'),
   block(at(12,20),at(12,30),'旧词块提取 10 分钟',['min-chunks'],'完成后勾选'),
   block(at(17,30),at(17,50),'通勤步行 15–20 分钟',['min-move'],'走完后勾选'),
   block(at(20,30),at(20,40),'说或写 10 分钟',['min-output'],'留下自己的句子后勾选'),
   block(at(21,30),at(21,35),'核对三餐与睡眠',['min-life'],'确认后勾选；22:15 左右准备睡觉')
  ];
 }
 // A full mock needs an uninterrupted daytime slot. If its fixed day number lands on a workday
 // after a start-date change, display a weekend-style template with a clear rescheduling notice.
 if(p.mock&&p.dow<5)return routine({...p,dow:5},false);
 const rows=[];
 if(p.dow<5){
  rows.push(block(at(6,15),at(6,35),'起床、喝水、整理当天材料'));
  rows.push(block(at(6,35),at(6,35)+(p.mock?t['mock-listen']:t.listen),p.mock?'模考听力':'英语听力与复述',[p.mock?'mock-listen':'listen'],'听完核对首听笔记并打卡'));
  rows.push(block(at(7,15),at(7,40),'早餐与出门准备'));
  rows.push(block(at(7,45),at(8),'步行通勤到单位'));
  rows.push(block(at(8),at(12),'工作'));
  rows.push(block(at(12),at(12,20),'午餐'));
  if(!p.mock)rows.push(block(at(12,20),at(12,20)+t.chunks,'词块主动提取',['chunks'],'完成闭卷回想和造句后打卡'));
  rows.push(block(at(13),at(17,30),'工作'));
  rows.push(block(at(17,30),at(17,45),'步行回家',p.strength?[]:['move'],p.strength?'通勤计入日常步数':'两段通勤合计约30分钟；达到今日步行目标后打卡'));
  if(p.strength){rows.push(block(at(17,55),at(17,55)+t.move,`力量训练 ${p.workout}`,['move'],'训练结束、记录动作后打卡'));rows.push(block(at(17,55)+t.move,at(17,55)+t.move+8,'体态活动 8 分钟',['mobility'],'做完打卡'));}
  else rows.push(block(at(17,55),at(18,3),'体态活动 8 分钟',['mobility'],'做完打卡'));
  rows.push(block(at(19),at(19,25),'晚餐；核对今天三餐',['food'],'吃完并确认三餐后打卡'));
  if(p.mock){
   rows.push(block(at(19,30),at(20,30),'模考阅读',['mock-read'],'核对答案前记录原始作答；完成后打卡'));
   rows.push(block(at(20,35),at(21,35),'模考写作',['mock-write'],'写完后打卡；如已疲劳可将整套模考移至最近周末'));
   rows.push(block(at(21,35),at(21,35)+t['mock-review'],'口语模拟与测评复盘',['mock-review'],'时间会影响睡眠；建议把整套模考移至周末'));
  }else{
   rows.push(block(at(19,30),at(19,30)+t.read,'英语阅读与原文证据',['read'],'回答问题并找到原句后打卡'));
   rows.push(block(at(19,30)+t.read,at(19,30)+t.read+t.write,'英语写作与修改',['write'],'留下原稿和修改稿后打卡'));
   rows.push(block(at(20,30),at(20,30)+t.speak,'口语对话、纠音与重说',['speak'],'至少8轮；重录并核对后打卡'));
  }
  rows.push(block(at(21,25),at(21,35),'记录英语实际用时与一句复盘'));
 }else if(p.dow===5){
  rows.push(block(at(8),at(8,40),'早餐与当天准备'));
  if(p.mock){
   rows.push(block(at(9),at(9)+t['mock-listen'],'模考听力',['mock-listen'],'按考试规则完成后打卡'));
   rows.push(block(at(9,50),at(10,50),'模考阅读',['mock-read'],'保留原始答案后打卡'));
   rows.push(block(at(11),at(12),'模考写作',['mock-write'],'完成两项写作后打卡'));
   rows.push(block(at(12),at(13),'午餐与休息'));
   rows.push(block(at(14),at(14)+t['mock-review'],'口语模拟与错题复盘',['mock-review'],'先口语模拟，再梳理错因；完成后打卡'));
  }else{
   rows.push(block(at(9),at(9)+t.listen,'英语听力与复述',['listen'],'首听、对照、关稿复述后打卡'));
   rows.push(block(at(10,15),at(10,15)+t.read,'英语阅读',['read'],'找到原文证据后打卡'));
   rows.push(block(at(11,30),at(11,30)+t.write,'英语写作与反馈',['write'],'保留原稿和修改稿后打卡'));
   rows.push(block(at(12,15),at(13),'午餐与休息'));
   rows.push(block(at(14),at(14)+t.chunks,'词块主动提取',['chunks'],'完成闭卷回想后打卡'));
   const first=Math.min(t.speak,45);
   rows.push(block(at(14,30),at(14,30)+first,'AI 口语情境对话',[], '口语总任务在重说完成后一次打卡'));
   if(t.speak>first)rows.push(block(at(15,30),at(15,30)+t.speak-first,'纠音、重录与反馈',['speak'],'口语总任务完成后打卡'));
   else rows[rows.length-1].taskIds=['speak'];
  }
  if(p.strength){rows.push(block(at(16,45),at(16,45)+t.move,`力量训练 ${p.workout}`,['move'],'训练结束、记录动作后打卡'));rows.push(block(at(16,45)+t.move,at(16,45)+t.move+8,'体态活动 8 分钟',['mobility'],'做完打卡'));}
  else{rows.push(block(at(16,45),at(16,45)+t.move,'快走与恢复',['move'],'走完打卡'));rows.push(block(at(16,45)+t.move,at(16,45)+t.move+8,'体态活动 8 分钟',['mobility'],'做完打卡'));}
  rows.push(block(at(18,30),at(19,10),'晚餐；核对今天三餐',['food'],'吃完并确认三餐后打卡'));
  rows.push(block(at(21,20),at(21,30),'记录英语实际用时与一句复盘'));
 }else{
  rows.push(block(at(8),at(8,40),'早餐与当天准备'));
  rows.push(block(at(9),at(9)+t.listen,'复听本周难点',['listen'],'关稿复述后打卡'));
  rows.push(block(at(10),at(10)+t.chunks,'本周词块复习',['chunks'],'闭卷提取后打卡'));
  rows.push(block(at(10,35),at(10,35)+t.read,'英语阅读',['read'],'找到原文证据后打卡'));
  rows.push(block(at(11,45),at(11,45)+t.write,'英语写作或改写',['write'],'保留修改前后两版并打卡'));
  rows.push(block(at(12,30),at(13,30),'午餐与休息'));
  const first=Math.min(t.speak,45);
  rows.push(block(at(14),at(14)+first,'真人交流或 AI 对话',[], '找不到可靠听者时在复盘中注明'));
  if(t.speak>first)rows.push(block(at(15),at(15)+t.speak-first,'口语复测与周复盘',['speak'],'完整完成后打卡'));
  else rows[rows.length-1].taskIds=['speak'];
  rows.push(block(at(16,15),at(16,15)+t.move,'快走与恢复',['move'],'走完后打卡'));
  rows.push(block(at(17),at(17,8),'体态活动 8 分钟',['mobility'],'做完后打卡'));
  rows.push(block(at(17,30),at(18),'查看下周采购清单与备餐',[],'提前确认家中存货、按需购买'));
  rows.push(block(at(18,30),at(19,10),'晚餐；核对今天三餐',['food'],'吃完并确认三餐后打卡'));
  rows.push(block(at(21,20),at(21,30),'记录英语实际用时与一句复盘'));
 }
 rows.push(block(at(22,15),at(22,25),'准备睡觉',['sleep'],'次日醒来确认睡眠后打卡；尽量留约8小时睡眠机会'));
 return rows.sort((a,b)=>a.start.localeCompare(b.start));
}
export function shoppingWeek(week){const start=(week-1)*7+1,end=Math.min(100,start+6),days=end-start+1;
 const qty=(amount,unit)=>`${Number((amount*days/7).toFixed(2))} ${unit}`;
 const items=[
  {id:'rice',group:'主食',label:'米饭 / 面条',options:[`大米或杂粮米（生重）约 ${qty(.7,'kg')}`,`干面条或意面约 ${qty(.7,'kg')}`]},
  {id:'breakfast',group:'主食',label:'早餐主食',options:[`原味燕麦约 ${qty(.4,'kg')}`,`全麦或普通面包约 ${qty(.6,'kg')}`,`馒头约 ${qty(.6,'kg')}`]},
  {id:'tubers',group:'主食',label:'换口味的主食',options:[`土豆 / 红薯约 ${qty(.8,'kg')}`,`玉米可食部分约 ${qty(.8,'kg')}`]},
  {id:'poultry',group:'蛋白来源',label:'一类肉食',options:[`鸡肉约 ${qty(.8,'kg')}`,`瘦牛 / 猪肉约 ${qty(.8,'kg')}`,`增加豆腐约 ${qty(1.2,'kg')}，按标签核对蛋白`]},
  {id:'fish',group:'蛋白来源',label:'鱼虾',options:[`鱼肉约 ${qty(.4,'kg')}`,`虾仁约 ${qty(.4,'kg')}`,`不吃鱼虾：改用其他蛋白，留意营养搭配`]},
  {id:'eggs',group:'蛋白来源',label:'鸡蛋',options:[`鸡蛋约 ${Math.max(3,Math.round(10*days/7))} 枚`,`不吃蛋：换豆腐 / 奶 / 肉，按实际份量补充`]},
  {id:'tofu',group:'蛋白来源',label:'豆制品',options:[`北豆腐 / 豆干约 ${qty(.8,'kg')}`,`其他豆制品，参考包装蛋白含量`]},
  {id:'milk',group:'蛋白来源',label:'奶或替代品',options:[`牛奶 / 原味酸奶约 ${qty(2,'L')}`,`无糖豆奶或强化植物奶约 ${qty(2,'L')}，看标签`]},
  {id:'veg',group:'蔬果',label:'蔬菜',options:[`多色蔬菜约 ${qty(2.8,'kg')}，深色占一半左右`,`冷冻蔬菜和鲜蔬组合约 ${qty(2.8,'kg')}`]},
  {id:'fruit',group:'蔬果',label:'水果',options:[`当季水果约 ${qty(2,'kg')}`,`两三种易买水果合计约 ${qty(2,'kg')}`]}
 ];
 return {week,start,end,days,items};
}
