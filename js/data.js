/* DADASHMODE v3 · domain data: segment types, games, emotions, themes, default episode */
'use strict';
const TYPES={title:'افتتاحیه',intro:'معرفی بازی (تمام‌صفحه)',rules:'قوانین (انیمیشنی)',countdown:'شمارش معکوس',play:'بازی زنده',bank:'وضعیت بانک زمان',dialogue:'دیالوگ',winner:'اعلام برنده',card:'کارت متنی'};
const TYPE_ALIAS={'افتتاحیه':'title','شروع':'title','معرفی':'intro','قوانین':'rules','قانون':'rules','شمارش':'countdown','بازی':'play','بانک':'bank','امتیاز':'bank','دیالوگ':'dialogue','گفتگو':'dialogue','برنده':'winner','کارت':'card','متن':'card'};
const GAMES={generic:'عمومی',cup:'برج لیوان',distance:'فاصله را انتخاب کن',mystery:'لقمهٔ مرموز',mitts:'دستکش و پازل',powers:'ریسک زمان',vault:'توالی نهایی و کیف طلایی'};
const GAME_ALIAS={'لیوان':'cup','برج':'cup','فاصله':'distance','پرتاب':'distance','مرموز':'mystery','لقمه':'mystery','جعبه':'mystery','دستکش':'mitts','پازل':'mitts','ریسک':'powers','قدرت':'powers','کیف':'vault','نهایی':'vault','رمز':'vault'};
const EMO={
  excited:{fa:'هیجان‌زده',ins:'Energetic and thrilled, like a top TV game-show host hyping a live studio crowd. Big smile in the voice, bright and punchy.',rate:1.08,pitch:1.15},
  warm:{fa:'گرم و صمیمی',ins:'Warm, friendly and inviting, like talking to close friends. Smiling, relaxed pace.',rate:1,pitch:1.05},
  suspense:{fa:'تعلیق',ins:'Suspenseful and mysterious. Lower, slower, with dramatic pauses, building tension right before a reveal.',rate:.88,pitch:.95},
  whisper:{fa:'نجوا و رازآلود',ins:'Close, breathy half-whisper, secretive and intimate, as if sharing a secret with the camera.',rate:.9,pitch:1},
  serious:{fa:'جدی و قاطع',ins:'Firm, clear and authoritative, stating an important rule. Confident, crisp articulation.',rate:.95,pitch:1},
  referee:{fa:'داور سخت‌گیر',ins:'A sharp, strict referee making an instant call. Short, decisive, loud and clear, zero hesitation.',rate:1.05,pitch:1.05},
  playful:{fa:'شوخ و بامزه',ins:'Playful and teasing, a light laugh in the voice, cheeky comic timing.',rate:1.05,pitch:1.15},
  taunt:{fa:'کُری‌خوانی',ins:'Cheeky trash-talk between friends, confident smirk in the voice, provocative but fun.',rate:1.03,pitch:1.1},
  calm:{fa:'آرام و توضیحی',ins:'Calm, clear explainer tone, like a friendly teacher explaining game rules step by step. Every word easy to understand.',rate:.97,pitch:1.03},
  epic:{fa:'حماسی',ins:'Epic, grand and powerful like a movie-trailer announcer, heavy emphasis, slow build.',rate:.9,pitch:.95},
  celebrate:{fa:'جشن و پیروزی',ins:'Ecstatic celebration, cheering a winner, overflowing joy and energy, almost shouting with happiness.',rate:1.1,pitch:1.2},
  shock:{fa:'شوکه',ins:'Genuinely shocked and amazed, gasping, as if something unbelievable just happened on stage.',rate:1.05,pitch:1.15}};
const GEMINI_VOICES=[['Aoede','نسیمی و روان'],['Leda','جوان و شاداب'],['Zephyr','روشن و پرانرژی'],['Kore','محکم و مطمئن'],['Laomedeia','سرحال و پرانرژی'],['Autonoe','روشن'],['Callirrhoe','راحت و خودمانی'],['Despina','نرم و صاف'],['Erinome','شفاف'],['Achernar','لطیف'],['Sulafat','گرم'],['Vindemiatrix','ملایم'],['Pulcherrima','رو به جلو'],['Gacrux','پخته'],['Puck','شاد (مردانه)'],['Charon','اطلاع‌رسان (مردانه)'],['Fenrir','هیجانی (مردانه)'],['Orus','محکم (مردانه)']];
const OPENAI_VOICES=['coral','nova','shimmer','sage','ballad','marin','alloy','verse','ash','echo','fable','onyx','cedar'];
const THEMES=[
  {name:'استودیو قرمز',bg1:'#12060a',bg2:'#4f0d1c',accent:'#ff3b3b',accent2:'#ffd23f',ink:'#fff7ec',shade:'#7a0f1f'},
  {name:'گرگ نئونی',bg1:'#040b16',bg2:'#0b3050',accent:'#00e5ff',accent2:'#ff2d6f',ink:'#f2fbff',shade:'#063a5c'},
  {name:'کیف طلایی',bg1:'#0d0a05',bg2:'#3a2a0a',accent:'#ffc53d',accent2:'#ff7a1a',ink:'#fffaf0',shade:'#8a5a00'},
  {name:'آب‌نبات',bg1:'#1b0b4a',bg2:'#5b21d6',accent:'#39ff88',accent2:'#ffe14d',ink:'#fffdf7',shade:'#2a0f7a'},
  {name:'آرنای سایبری',bg1:'#05060f',bg2:'#1c1446',accent:'#7cf7ff',accent2:'#ffe600',ink:'#f5f7ff',shade:'#2b1d73'},
  {name:'یخ و برق',bg1:'#06142e',bg2:'#1d4ed8',accent:'#7dd3fc',accent2:'#fef08a',ink:'#f8fbff',shade:'#0b2a6b'},
  {name:'جنگل',bg1:'#04140a',bg2:'#0f5132',accent:'#a3e635',accent2:'#fb923c',ink:'#f7fff0',shade:'#14532d'},
  {name:'غروب داغ',bg1:'#1a0505',bg2:'#8a1c0a',accent:'#ff8a00',accent2:'#fff06a',ink:'#fff8ee',shade:'#6b1204'}];
const COLOR_KEYS={bg1:'پس‌زمینه تیره',bg2:'پس‌زمینه روشن',accent:'رنگ اصلی',accent2:'رنگ دوم',ink:'متن',shade:'سایه عمق'};
const FONTS={'Lalezar':'لاله‌زار · سنگین و تلویزیونی','Marhey':'مرحی · فانتزی و بامزه','Estedad':'استعداد · مدرن و محکم','Vazirmatn':'وزیرمتن · تمیز','Noto Kufi Arabic':'کوفی · رسمی'};
const POWERS=[
  {id:'hint',cat:'کمک',name:'راهنما',cost:15,desc:'داور یک راهنمایی می‌دهد'},
  {id:'life',cat:'کمک',name:'جان اضافه',cost:25,desc:'یک شکست نادیده گرفته می‌شود'},
  {id:'slow',cat:'حمله',name:'کندسازی',cost:20,desc:'حریف ۵ ثانیه دیرتر شروع می‌کند'},
  {id:'hard',cat:'حمله',name:'حالت سخت',cost:30,desc:'حریف یک محدودیت می‌گیرد'},
  {id:'double',cat:'ریسک',name:'دو برابر یا هیچ',cost:0,desc:'موفقیت: شرط دو برابر · شکست: شرط می‌سوزد',variable:true},
  {id:'allin',cat:'ریسک',name:'بازگشت ALL IN',cost:30,desc:'موفقیت +۵۰ · شکست −۳۰ · فقط یک بار و فقط نفر عقب‌تر',win:50,lose:30}];
const SABOTAGE=['دستکش‌های غول‌پیکر','۵ ثانیه تأخیر در شروع','فقط ۲ تلاش به جای ۳'];
const DIST={green:{fa:'سبز',sec:5,col:'#22c55e'},yellow:{fa:'زرد',sec:10,col:'#facc15'},red:{fa:'قرمز',sec:20,col:'#ef4444'}};
const MYSTERY_POOL=[{k:'gain',v:15},{k:'gain',v:15},{k:'steal',v:5},{k:'empty',v:0},{k:'empty',v:0},{k:'empty',v:0}];

const L=(emotion,text,direction='')=>({id:uid(),speaker:'host',emotion,text,direction});
function mkSeg(o){return Object.assign({id:uid(),type:'card',game:'generic',title:'',subtitle:'',rules:[],duration:30,reward:10,notes:'',issue:'',status:'draft',winner:'',lines:[]},o)}

function defaultEpisode(){return {
  format:'dadashmode-episode/3',name:'داداش‌مود · بانک زمان · قسمت ۱',unit:'ثانیه',startBank:20,
  speakers:[{id:'host',name:'نیلا (مجری و داور)',provider:'gemini',voice:'Leda'}],
  players:[{id:'elias',name:'اِلیاس',color:'#ff2738',symbol:'▲',key:'a'},{id:'emad',name:'عِماد',color:'#00c98d',symbol:'●',key:'l'}],
  theme:Object.assign({font:'Lalezar'},THEMES[0]),
  brief:{summary:'دوئل الیاس و عماد در شش راند. تنها پول مسابقه «ثانیه» است؛ هر دو با ۲۰ ثانیه شروع می‌کنند و ثانیه‌های جمع‌شده در توالی نهایی خرج می‌شود.',tone:'مجری زن پرانرژی، کوتاه‌گو، منصف با کمی کُری. حین بازی کم حرف بزند؛ واکنش بازیکن‌ها مهم‌تر است.',characters:['اِلیاس · قرمز · نماد مثلث · کلید A','عِماد · سبز · نماد دایره · کلید L','نیلا · مجری و داور'],beats:['افتتاحیه و معرفی بانک زمان','راند ۱ تا ۵ با پاداش ثانیه','توالی نهایی و باز کردن کیف طلایی'],directorNotes:['هیچ نتیجه‌ای برای جذاب‌تر شدن عوض نمی‌شود','اگر نتیجه واضح نیست: بازبینی VAR','کدهای کیف روی کاغذ هم نوشته شود']},
  segments:[
    mkSeg({type:'title',title:'داداش‌مود',subtitle:'بانک زمان · قسمت یک',status:'ok',lines:[L('excited','سلام سلام! به داداش‌مود خوش اومدید!'),L('warm','امشب اِلیاس و عِماد روبه‌روی هم وایسادن، و تنها پول این بازی... زمانه.')]}),
    mkSeg({type:'bank',title:'بانک زمان',subtitle:'هر نفر با ۲۰ ثانیه شروع می‌کند',status:'ok',lines:[L('calm','قانون اصلی ساده‌ست: هر کدومتون با بیست ثانیه شروع می‌کنید.'),L('suspense','هر راندی که ببرید، ثانیه به بانکتون اضافه می‌شه. هر اشتباه، ثانیه می‌سوزونه.'),L('epic','و آخر بازی، همین ثانیه‌ها تعیین می‌کنه کی کیف طلایی رو باز می‌کنه.')]}),
    mkSeg({type:'intro',game:'cup',title:'برج لیوان',subtitle:'راند یک',status:'ok',lines:[L('suspense','راند اول... چالشی که دست‌ها رو می‌لرزونه.'),L('excited','برج لیوان!')]}),
    mkSeg({type:'rules',game:'cup',title:'قوانین برج لیوان',rules:['۱۰ لیوان، چیدمان ۱-۲-۳-۴','فقط با یک دست','دست دوم = خطا','برج باید ۲ ثانیه سرپا بماند','جایزه: ۱۰+ ثانیه'],status:'ok',lines:[L('calm','قوانین رو خوب گوش کنید.'),L('calm','ده تا لیوان، به شکل هرم یک، دو، سه، چهار.'),L('serious','فقط با یک دست! دست دوم پشت کمر.'),L('referee','اگه دست دوم بیاد وسط، خطاست.'),L('suspense','برج باید دو ثانیه کامل سرپا بمونه.'),L('excited','و برنده، ده ثانیه می‌گیره!')]}),
    mkSeg({type:'countdown',title:'آماده‌اید؟',status:'ok'}),
    mkSeg({type:'play',game:'cup',title:'برج لیوان',subtitle:'راند یک',duration:30,reward:10,status:'ok'}),
    mkSeg({type:'intro',game:'distance',title:'فاصله را انتخاب کن',subtitle:'راند دو',status:'ok',lines:[L('playful','راند دوم مال کسایی‌ه که به خودشون اعتماد دارن.'),L('excited','فاصله رو انتخاب کن!')]}),
    mkSeg({type:'rules',game:'distance',title:'قوانین فاصله',rules:['سبز ۵+ · زرد ۱۰+ · قرمز ۲۰+','انتخاب قبل از پرتاب اول قفل می‌شود','هر نفر ۳ پرتاب'],status:'ok',lines:[L('calm','سه تا خط داریم.'),L('calm','سبز پنج ثانیه، زرد ده ثانیه، قرمز بیست ثانیه.'),L('serious','قبل از پرتاب اول انتخاب می‌کنید، و دیگه عوض نمی‌شه.'),L('taunt','سه تا پرتاب. ببینیم کی جرئت خط قرمز رو داره.')]}),
    mkSeg({type:'play',game:'distance',title:'فاصله را انتخاب کن',subtitle:'راند دو',duration:45,reward:10,status:'ok',lines:[L('referee','انتخاب قفل شد.')]}),
    mkSeg({type:'intro',game:'mystery',title:'لقمهٔ مرموز',subtitle:'راند سه',status:'ok',lines:[L('whisper','شش تا جعبه. هیچ‌کس نمی‌دونه توشون چیه... حتی من.'),L('excited','لقمهٔ مرموز!')]}),
    mkSeg({type:'rules',game:'mystery',title:'قوانین لقمهٔ مرموز',rules:['۶ جعبه · شماره ۱ تا ۶','دو جعبه: ۱۵+ ثانیه','یک جعبه: ۵ ثانیه از حریف می‌دزدد','سه جعبه: پوچ'],status:'ok',lines:[L('calm','هر کدوم یه جعبه انتخاب می‌کنید و لقمه‌ش رو می‌خورید.'),L('calm','شش جعبه داریم، از یک تا شش.'),L('excited','دو تاشون پونزده ثانیه جایزه دارن.'),L('taunt','یکی‌شون پنج ثانیه از حریفت می‌دزده.'),L('playful','و سه تاشون... هیچی! فقط یه لقمه‌ی عجیب.')]}),
    mkSeg({type:'play',game:'mystery',title:'لقمهٔ مرموز',subtitle:'راند سه',duration:40,reward:15,status:'ok',lines:[L('suspense','لقمه خورده شد... ببینیم توی جعبه چی بود.')]}),
    mkSeg({type:'intro',game:'mitts',title:'دستکش و پازل',subtitle:'راند چهار',status:'ok',lines:[L('playful','راند چهارم رو با دستکش فر بازی می‌کنید!'),L('excited','دستکش و پازل!')]}),
    mkSeg({type:'rules',game:'mitts',title:'قوانین دستکش و پازل',rules:['دستکش فر را بپوش','جعبهٔ چسبی را باز کن','۴ قطعهٔ آرم گرگ را بچین','خط پایان را لمس کن','جایزه: ۱۵+ و کارت خرابکاری'],status:'ok',lines:[L('calm','اول دستکش فر رو می‌پوشید.'),L('calm','بعد جعبه‌ی چسب‌خورده رو باز می‌کنید.'),L('serious','چهار قطعه‌ی آرم گرگ رو پیدا می‌کنید و درست می‌چینید.'),L('excited','و می‌دوید سمت خط پایان!'),L('suspense','برنده پونزده ثانیه می‌گیره... و یه کارت خرابکاری برای حریفش.')]}),
    mkSeg({type:'play',game:'mitts',title:'دستکش و پازل',subtitle:'راند چهار',duration:60,reward:15,status:'ok',lines:[L('shock','کارت خرابکاری رو شد!')]}),
    mkSeg({type:'intro',game:'powers',title:'ریسک زمان',subtitle:'راند پنج',status:'ok',lines:[L('suspense','حالا وقتشه ثانیه‌هاتون رو خرج کنید.'),L('epic','ریسک زمان!')]}),
    mkSeg({type:'rules',game:'powers',title:'فروشگاه قدرت',rules:['راهنما ۱۵ · جان اضافه ۲۵','کندسازی حریف ۲۰ · حالت سخت ۳۰','دو برابر یا هیچ','بازگشت ALL IN: +۵۰ یا −۳۰','خرید قبل از شروع قفل می‌شود'],status:'ok',lines:[L('calm','با ثانیه‌هاتون می‌تونید قدرت بخرید.'),L('calm','راهنما پونزده ثانیه، جان اضافه بیست و پنج ثانیه.'),L('taunt','کندسازی حریف بیست ثانیه، حالت سخت سی ثانیه.'),L('suspense','دو برابر یا هیچ... یا همه‌چیز یا هیچی.'),L('epic','و بازگشت! فقط یک بار، فقط برای کسی که عقبه. موفق بشی پنجاه ثانیه، شکست بخوری سی ثانیه می‌سوزه.'),L('referee','خرید که انجام شد، قفله.')]}),
    mkSeg({type:'play',game:'powers',title:'ریسک زمان',subtitle:'راند پنج',duration:45,reward:10,status:'ok',lines:[L('referee','خرید قفل شد.')]}),
    mkSeg({type:'bank',title:'قبل از فینال',subtitle:'وضعیت بانک زمان',status:'ok',lines:[L('suspense','قبل از فینال، بیاید ببینیم کی چقدر ثانیه داره.')]}),
    mkSeg({type:'intro',game:'vault',title:'توالی نهایی',subtitle:'راند شش · کیف طلایی',status:'ok',lines:[L('epic','رسیدیم به آخرین مرحله.'),L('suspense','سه مرحله، سه رمز... و یک کیف طلایی.')]}),
    mkSeg({type:'rules',game:'vault',title:'قوانین توالی نهایی',rules:['۱ · نقاشی با چشم بسته → رمز ۱','۲ · ساخت از حافظه → رمز ۲','۳ · چالش منطق → رمز ۳','۴ · سه رمز = باز شدن کیف','ترتیب اشتباه فقط همان مرحله را ریست می‌کند'],status:'ok',lines:[L('calm','مرحله اول: نقاشی با چشم بسته. تصویر رو چند ثانیه می‌بینید و بعد از حافظه می‌کشید.'),L('calm','مرحله دوم: یه الگو رو کوتاه نشونتون می‌دم، باید دقیقاً بازسازیش کنید.'),L('serious','مرحله سوم: یه معمای منطقی که فقط با اطلاعات دو مرحله‌ی قبل حل می‌شه.'),L('epic','هر مرحله یه رمز می‌ده. سه رمز، کیف طلایی رو باز می‌کنه.'),L('referee','اشتباه کنی، فقط همون مرحله از اول شروع می‌شه.')]}),
    mkSeg({type:'countdown',title:'فینال!',status:'ok'}),
    mkSeg({type:'play',game:'vault',title:'توالی نهایی',subtitle:'کیف طلایی',duration:90,reward:0,status:'ok'}),
    mkSeg({type:'winner',title:'قهرمان داداش‌مود',subtitle:'کیف طلایی باز شد',status:'ok',lines:[L('suspense','و قهرمان این قسمت از داداش‌مود...'),L('celebrate','تبریک! فوق‌العاده بود!')]})
  ]}}
