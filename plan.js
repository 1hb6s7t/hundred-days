import {addDays,weekday} from './core.js';
export const phases=[
 {from:1,to:14,name:'建立节奏',note:'先找到适合自己的难度，让习惯生根。'},
 {from:15,to:28,name:'稳稳进步',note:'稳定三次力量训练，英语从句子走向段落。'},
 {from:29,to:49,name:'积累力量',note:'循序增加训练刺激，用原文证据检验理解。'},
 {from:50,to:56,name:'恢复与校准',note:'减少训练量，用新卷发现下一步方向。'},
 {from:57,to:84,name:'拓展边界',note:'练习学术短讲、问题澄清与持续追问。'},
 {from:85,to:98,name:'巩固与迁移',note:'减少新词，把学过的表达带进新情境。'},
 {from:99,to:100,name:'看见改变',note:'回看真实的进步，安排下一段旅程。'}
];
export const mockDays=[6,27,55,83,97];
export const topics=['认识新同事','我的工作日','问路与确认方向','时间、日期和数字','礼貌请求帮助','点餐与食物选择','改约与协商时间','过去的一次经历','介绍一个地方','谈论兴趣与习惯','比较两种选择','解释一个简单流程','团队分工','说明问题与解决办法','描述一个重要的人','讲述一件有用的物品','教育与技能','城市交通','科技与日常生活','环境与个人行动','提出研究问题','解释研究方法','读懂图表趋势','控制变量','区分相关与因果','讨论样本限制','学术提问与澄清','总结与未来计划'];
export const firstLessons=[['Meeting a new team member','meeting-new-team-member'],['Business cards','business-cards'],['Finding the library','finding-library'],['The first English class','first-english-class'],['A request from your boss','request-your-boss']];
export const bc = level => `https://learnenglish.britishcouncil.org/free-resources/listening/${level.toLowerCase()}`;
export function makePlan(day,start='2026-10-19',level='A1') {
 const date=addDays(start,day-1),dow=weekday(date),week=Math.ceil(day/7),phase=phases.find(p=>day>=p.from&&day<=p.to);
 const mock=mockDays.includes(day),sunday=dow===6;
 const english=dow===5?(day<=14?210:270):sunday?(day<=14?180:240):day<=7?120:150;
 const strength=day!==100 && (day===99 || (day<=14?[0,5]:[0,2,5]).includes(dow));
 const workout=day===99?'A':dow===0?'A':day<=14?'B':dow===2?'B':'C';
 const deload=(day>=50&&day<=56)||day>=92;
 const minutes=strength?(day<=14?40:day<=28?45:deload?40:55):sunday?35:25;
 const unit=day<=5?day-1:Math.min(27,Math.floor((day-1)*28/100));
 const topic=topics[unit];
 const budget=mock?[40,60,60,english-160]:english===120?[25,15,20,20,40]:english===150?[35,20,30,20,45]:english===210?[50,20,40,30,70]:english===180?[30,20,40,30,60]:english===270?[60,20,60,40,90]:[45,20,60,35,80];
 const lesson=day<=5?{name:firstLessons[day-1][0],url:bc('A1')+'/'+firstLessons[day-1][1]}:{name:sunday?'复听本周难点＋真人交流':`${level} 分级听力 · 选一篇未学新材料`,url:bc(level)};
 const output=day<=14?'60–80词短文':day<=28?'80–120词段落':day<=56?'一个有理由和例子的论证段':'Task 1 / Task 2 轮换；依据能力缩短';
 const tasks=mock?[
  {id:'mock-listen',group:'english',label:'模考 · 听力',minutes:budget[0],detail:'使用未做过的完整试卷，按所选考试模式计时。记录原始正确数；考试中不用AI。'},
  {id:'mock-read',group:'english',label:'模考 · 阅读',minutes:60,detail:'60分钟完成完整Academic阅读。保留原始答案，再核对证据。'},
  {id:'mock-write',group:'english',label:'模考 · 写作',minutes:60,detail:'60分钟完成两项写作，使用可靠外部评阅；未评阅就标记待评。'},
  {id:'mock-review',group:'english',label:'口语模拟与测评复盘',minutes:budget[3],detail:'口语单独模拟。整理听读错因；写说待可靠评阅，不凭AI凑总分。完整模考替代今天常规学习。'}
 ]:[
  {id:'listen',group:'english',label:sunday?'听力 · 复听与迁移':'听力 · 听懂，再复述',minutes:budget[0],detail:`${lesson.name}。不看稿首听 → 标记3处困难 → 对照讲稿 → 跟读短句 → 关稿复述3个要点。${[1,3].includes(dow)?'其中10–15分钟可用《雅思王听力真题语料库》做点式听写，不额外叠加。':''}`},
  {id:'chunks',group:'english',label:'词块 · 主动提取',minutes:budget[1],detail:`${sunday?'不加新词，复习本周表达。':`从今天材料中选${day>=85?4:6}个有用词块，遮住答案回想，换情境造句。`}复习第1、3、7、14、30天前学过的词块；到期过多时停新词。`},
  {id:'read',group:'english',label:'阅读 · 找到原文证据',minutes:budget[2],detail:`围绕「${topic}」读一篇与当前等级匹配的短文。回答3个理解问题，并圈出对应原句。第29天后可穿插雅思题型；不按日期强升难度。`},
  {id:'write',group:'english',label:sunday?'写作 · 反馈后重写':'写作 · 留下一份作品',minutes:budget[3],detail:`${output}，主题「${topic}」。先自己写，再请AI指出最多3个关键问题，重写并保留两版。基础吃力时维持80–120词。`},
  {id:'speak',group:'english',label:sunday?'口语 · 真人校准与复盘':'口语 · 开口，反馈，再说',minutes:budget[4],detail:sunday?'口语预算内安排30–45分钟真人交流，其余用于新句复测与周复盘。找不到可靠听者时标记未核验。':`围绕「${topic}」完成至少8轮AI问答。先原声对照与首录，中间对话，最后只改2个发音疑点和1个表达问题，换新句重说。纠音包含在本时段。`}
 ];
 tasks.push({id:'move',group:'body',label:strength?`力量训练 ${workout} · ${deload?'减量恢复':'全身训练'}`:'快走与恢复',minutes,detail:strength?'社区 / 健身房二选一。含约6分钟热身；大动作间休息90–120秒，辅助动作45–60秒。动作清楚、留有余力。':'按可耐受强度快走；通勤步行可计入。能交谈、不能轻松唱歌可粗略作为中等强度参考。休息日不练力量也是完成。'},
 {id:'mobility',group:'body',label:'体态活动 · 让身体松一松',minutes:8,detail:'轻收下巴、靠墙滑臂、胸椎旋转、髋踝活动各约2分钟。每45–60分钟换姿势或起身走动，不强压到疼痛。'},
 {id:'food',group:'life',label:'正常三餐 · 灵活搭配',detail:'主食＋明确蛋白来源＋蔬菜；按实际可获得食物替换。先稳定食量，看几周趋势再调整。'},
 {id:'sleep',group:'life',label:'睡眠 · 留足休息时间',detail:'按自己的起床时间倒推就寝，保留约7–9小时睡眠机会。不要靠熬夜补打卡。'});
 return {day,date,dow,week,phase,mock,english,unit,topic,strength,workout,deload,minutes,lesson,tasks};
}
export const minimumTasks=[{id:'min-listen',label:'听10分钟',group:'english',minutes:10,detail:'听一个熟悉的短片段，关稿说出主题。'},{id:'min-chunks',label:'提取10分钟',group:'english',minutes:10,detail:'复习旧词块，不强加新词。'},{id:'min-output',label:'说或写10分钟',group:'english',minutes:10,detail:'说一段自己的经历，或写5个完整句子。'},{id:'min-move',label:'步行15–20分钟',group:'body',minutes:20,detail:'保持温和活动，不补双倍训练。'},{id:'min-life',label:'正常三餐，保住睡眠',group:'life',detail:'明天回到正常节奏；保底不等于完成标准计划。'}];
const ex=(name,reps,cue)=>({name,reps,cue});
export const workouts={
 community:{
 A:[ex('徒手深蹲','8–12次','髋膝自然弯曲，膝盖随脚尖方向；先用可控深度。'),ex('固定高支撑俯卧撑','6–12次','选牢固墙面或固定杆，身体成一直线。'),ex('固定低杠斜身划船','8–12次','双脚踩稳，杠体固定；没有合适低杠改安全背包划船。'),ex('双腿臀桥','12–15次','收紧臀部抬髋，不用腰向上顶。'),ex('死虫式','每侧6–8次','呼气缓慢伸展，保持腰背稳定。')],
 B:[ex('背包髋折叠 / 早安式','8–12次','髋部后移，背部中立，负重固定。'),ex('扶物分腿蹲','每侧8–10次','扶牢固支撑，按能力控制下蹲范围。'),ex('固定高支撑俯卧撑','8–12次','调整支撑高度以保留余力。'),ex('安全背包单臂划船','每侧8–12次','背包闭合、可握稳，不用门把手或摇晃桌椅拉拽。'),ex('侧桥','每侧15–30秒','可屈膝降低难度，肩髋保持稳定。')],
 C:[ex('徒手 / 抱背包深蹲','10–12次','稳定后再增加少量负重。'),ex('固定高支撑俯卧撑','6–12次','身体稳定，全程可控。'),ex('固定低杠斜身划船','8–12次','脚向前移会更难，先选轻松角度。'),ex('轻水瓶侧平举','12–15次','轻负重、不耸肩，抬到舒适高度。'),ex('鸟狗式','每侧6–8次','对侧手脚缓慢伸展，骨盆不摇摆。')]
 },
 gym:{
 A:[ex('腿举 / 高脚杯深蹲','8–12次','先请教练确认器械设置与动作。'),ex('器械推胸','8–12次','肩部稳定，选择可控重量。'),ex('坐姿划船','8–12次','不借腰部大幅后仰。'),ex('臀桥','12–15次','先从自重起步，稳定后加重。'),ex('死虫式','每侧6–8次','缓慢呼气，不塌腰。')],
 B:[ex('轻哑铃罗马尼亚硬拉','8–12次','先学髋折叠，哑铃贴近腿部。'),ex('扶物分腿蹲','每侧8–10次','可先徒手，平衡优先。'),ex('哑铃地板卧推 / 推胸','8–12次','轻重量，不追求力竭。'),ex('高位下拉 / 坐姿划船','8–12次','肩背发力，避免猛拉。'),ex('侧桥','每侧15–30秒','可屈膝，保持稳定。')],
 C:[ex('高脚杯深蹲','10–12次','选择能稳定控制的重量。'),ex('器械推胸','8–12次','动作连续可控。'),ex('坐姿划船','8–12次','肩颈放松，不借惯性。'),ex('轻哑铃侧平举','12–15次','不甩动，不耸肩。'),ex('鸟狗式','每侧6–8次','控制骨盆转动。')]
 }};
export function setsFor(day,index){return day>=29 && !(day>=50&&day<=56) && day<92 && index<3?3:2;}
export const carbs=[['米饭 / 杂粮饭',200,'熟重'],['普通 / 全麦面包',100,'即食重，核对标签'],['原味燕麦',80,'干重'],['面条 / 意面',70,'干重'],['馒头',105,'即食重'],['土豆',280,'蒸煮后可食重'],['红薯',220,'蒸煮后可食重'],['玉米粒',240,'熟可食重，不含棒芯']];
export const proteins=[['鸡胸肉','约180克','生可食重'],['去皮鸡腿肉','约200克','生可食重'],['瘦牛肉','约200克','生可食重'],['白肉鱼','约210克','生可食重'],['虾仁','约200克','生可食重'],['北豆腐','约330克','标签蛋白约12克 / 100克时'],['鸡蛋＋北豆腐','3枚＋150克','豆腐蛋白按标签核对']];
export function prompts(p,level='A1',kind='speak') {
 const intro=`今天是100天计划第${p.day}天，主题「${p.topic}」，当前按${level}难度练习，以我的实际回答调整。`;
 const guard='没有可分析的原始语音时，不根据转写文字判断发音。不要编造音素准确率、时间戳或雅思分数，不替我编造经历。';
 const text={
 speak:`你是我的英语口语搭档。${intro}\n每次只问一个英文问题，等我回答后再追问，至少8轮，我的表达占一半以上。卡住时先给关键词，不先给范文。一小段结束后最多反馈3个影响理解的问题，中文解释、英文示范，再让我用自己的经历重说。${guard}\n现在只问第一个问题。`,
 pronunciation:`我们做发音筛查与新句复测。${intro}\n${p.day<=28?'筛查词：ship / sheep，live / leave。句子：I live near the office. Please leave the sheet on the desk.':'请先问我日志里反复出现并经过原声或可靠听者复核的问题，选一个作为今天目标。'}\n先等我读。只有能分析原始语音时，才谨慎指出最多2个疑点，引用我实际说过的短句，说明不确定性，示范、重读、再换一个新句子。只有转写文字或无法确认时，明确说“不能据此判断发音”。用Cambridge词典原声交叉核对；不能访问就说明。${guard}`,
 listen:`你是我的听力复盘助手。${intro}\n先等我提供首听笔记、没听懂的位置、短段原文和答案，不要猜测原文。把困难区分为声音识别、词块、句法、同义替换、数字拼写或审题问题。每次处理一个，引用我提供的原文证据，先让我解释再提示。最后留下3句进行听懂、跟读、关稿复述和新情境应用。不要把看稿后的理解当作首听能力。`,
 chunks:`你是词块主动提取教练。${intro}\n先等我粘贴今天与到期复习的词块。每次给一个中文情境，让我闭卷说英文，再给反馈。不会的次日复练，会的进入1、3、7、14、30天复习。每次让我换自己的情境造句，不给孤立单词表。`,
 write:`你是我的英语读写反馈助手。${intro}\n先等我贴原文、题目和我自己的答案，不猜测未提供的内容。阅读要求引用原文证据；写作先检查任务完成、逻辑、语法和用词，只挑3个最影响表达的问题。让我先修改，再示范一小段，不包办整篇。保留我的真实信息。没有可靠外部评阅时不提供正式雅思分数。`
 };return text[kind];
}
