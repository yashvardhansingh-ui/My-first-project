/* ============================================================
   FITFLOW · script.js
   Vanilla JS — fully modular, localStorage-backed
   ============================================================ */

'use strict';

/* ── CONSTANTS ────────────────────────────────────────────── */
const GOAL_CALORIES = { loss: 1500, maintain: 2000, gain: 2800 };
const GOAL_LABELS   = { loss: '🔥 Weight Loss', maintain: '⚖️ Maintain', gain: '💪 Muscle Gain' };

const WORKOUTS = {
  Mon: { label:'Monday',    exercises:['Push-ups × 20','Squats × 20','Plank 1 min','Jumping Jacks × 30'] },
  Tue: { label:'Tuesday',   exercises:['Running 20 min','Burpees × 15','High Knees × 40','Cool-down stretch'] },
  Wed: { label:'Wednesday', exercises:['Pull-ups × 12','Dips × 15','Pike Push-ups × 12','Dead Hang 30 s'] },
  Thu: { label:'Thursday',  exercises:['Lunges × 20','Glute Bridges × 25','Calf Raises × 30','Wall Sit 45 s'] },
  Fri: { label:'Friday',    exercises:['HIIT Circuit 25 min','Mountain Climbers × 30','Box Jumps × 15','Stretch 10 min'] },
};

const DIET_PLANS = {
  loss: { meals:[
    { title:'Breakfast', icon:'🌅', subtitle:'~350 kcal', items:[{name:'Oatmeal with berries',cal:180},{name:'Boiled eggs (×2)',cal:140},{name:'Green tea',cal:5},{name:'Apple',cal:80}] },
    { title:'Lunch',     icon:'☀️', subtitle:'~520 kcal', items:[{name:'Grilled chicken breast',cal:220},{name:'Steamed broccoli & carrots',cal:90},{name:'Brown rice (½ cup)',cal:120},{name:'Green salad',cal:60},{name:'Lemon water',cal:5}] },
    { title:'Dinner',    icon:'🌙', subtitle:'~420 kcal', items:[{name:'Baked salmon (150 g)',cal:220},{name:'Sautéed spinach',cal:60},{name:'Quinoa (½ cup)',cal:110},{name:'Cucumber slices',cal:20}] },
    { title:'Snacks',    icon:'🍎', subtitle:'~210 kcal', items:[{name:'Greek yoghurt (low-fat)',cal:90},{name:'Almonds (×10)',cal:70},{name:'Baby carrots',cal:30},{name:'Herbal tea',cal:5}] },
  ]},
  maintain: { meals:[
    { title:'Breakfast', icon:'🌅', subtitle:'~500 kcal', items:[{name:'Whole-grain toast (×2)',cal:160},{name:'Peanut butter (2 tbsp)',cal:190},{name:'Banana',cal:90},{name:'Orange juice',cal:110}] },
    { title:'Lunch',     icon:'☀️', subtitle:'~720 kcal', items:[{name:'Turkey & avocado wrap',cal:380},{name:'Mixed bean salad',cal:160},{name:'Low-fat milk',cal:100},{name:'Mixed fruit cup',cal:80}] },
    { title:'Dinner',    icon:'🌙', subtitle:'~680 kcal', items:[{name:'Lean beef stir-fry',cal:320},{name:'Noodles (1 cup)',cal:220},{name:'Stir-fried vegetables',cal:90},{name:'Soy sauce dressing',cal:30}] },
    { title:'Snacks',    icon:'🍎', subtitle:'~300 kcal', items:[{name:'Cottage cheese',cal:100},{name:'Mixed nuts (small handful)',cal:140},{name:'Rice cakes (×2)',cal:70}] },
  ]},
  gain: { meals:[
    { title:'Breakfast',     icon:'🌅', subtitle:'~800 kcal', items:[{name:'Protein pancakes (×4)',cal:380},{name:'Scrambled eggs (×3)',cal:210},{name:'Whole milk (1 cup)',cal:150},{name:'Banana',cal:90}] },
    { title:'Lunch',         icon:'☀️', subtitle:'~950 kcal', items:[{name:'Grilled chicken (200 g)',cal:330},{name:'White rice (1.5 cups)',cal:360},{name:'Roasted sweet potato',cal:130},{name:'Olive oil drizzle',cal:60},{name:'Broccoli',cal:50}] },
    { title:'Dinner',        icon:'🌙', subtitle:'~900 kcal', items:[{name:'Beef / tuna pasta',cal:480},{name:'Garlic bread (×2)',cal:180},{name:'Caesar salad',cal:150},{name:'Whole milk',cal:150}] },
    { title:'Snacks & Shake',icon:'🥛', subtitle:'~550 kcal', items:[{name:'Whey protein shake',cal:200},{name:'Peanut butter (3 tbsp)',cal:285},{name:'Rice cakes (×2)',cal:70}] },
  ]},
};

/* ── STATE ─────────────────────────────────────────────────── */
let calorieItems = [];
let workoutState = {};
let currentDietGoal = 'loss';

/* ── UTILS ─────────────────────────────────────────────────── */
function showToast(msg, ms=2800){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),ms);
}
function lsSet(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch(e){} }
function lsGet(k,fb=null){ try{ const r=localStorage.getItem(k); return r!==null?JSON.parse(r):fb; }catch{return fb;} }
function fmt(n){ return Number(n).toLocaleString(); }
function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }

/* ── NAVIGATION ─────────────────────────────────────────────── */
function initNav(){
  const allBtns=document.querySelectorAll('.nav-btn');
  const allSecs=document.querySelectorAll('.section');
  allBtns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      const t=btn.dataset.section;
      allBtns.forEach(b=>b.classList.toggle('active',b.dataset.section===t));
      allSecs.forEach(s=>{
        const hit=s.id===`section-${t}`;
        s.classList.toggle('active',hit);
        if(hit){ s.classList.remove('fade-in'); void s.offsetWidth; s.classList.add('fade-in'); }
      });
    });
  });
}

/* ── THEME ──────────────────────────────────────────────────── */
function initTheme(){
  const btn=document.getElementById('themeToggle');
  const icon=btn.querySelector('.theme-icon');
  const html=document.documentElement;
  const saved=lsGet('theme','dark');
  html.dataset.theme=saved;
  icon.textContent=saved==='dark'?'🌙':'☀️';
  btn.addEventListener('click',()=>{
    const dark=html.dataset.theme==='dark';
    html.dataset.theme=dark?'light':'dark';
    icon.textContent=dark?'☀️':'🌙';
    lsSet('theme',html.dataset.theme);
  });
}

/* ── PROFILE ────────────────────────────────────────────────── */
function initProfile(){
  const fields={
    name:document.getElementById('profileName'),
    age:document.getElementById('profileAge'),
    weight:document.getElementById('profileWeight'),
    height:document.getElementById('profileHeight'),
    goal:document.getElementById('profileGoal'),
  };
  const goalPills=document.querySelectorAll('[data-goal]');
  const saveBtn=document.getElementById('saveProfile');
  const feedback=document.getElementById('profileFeedback');

  goalPills.forEach(btn=>{
    btn.addEventListener('click',()=>{
      goalPills.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      fields.goal.value=btn.dataset.goal;
      updateAvatarEmoji(btn.dataset.goal);
    });
  });

  const saved=lsGet('profile');
  if(saved){
    fields.name.value=saved.name||'';
    fields.age.value=saved.age||'';
    fields.weight.value=saved.weight||'';
    fields.height.value=saved.height||'';
    fields.goal.value=saved.goal||'loss';
    goalPills.forEach(b=>b.classList.toggle('active',b.dataset.goal===(saved.goal||'loss')));
    updateAvatarEmoji(saved.goal||'loss');
    renderStats(saved);
  }

  saveBtn.addEventListener('click',()=>{
    const data={
      name:fields.name.value.trim(),
      age:fields.age.value,
      weight:fields.weight.value,
      height:fields.height.value,
      goal:fields.goal.value,
    };
    if(!data.name){ showToast('⚠️ Please enter your name'); return; }
    if(!data.weight||+data.weight<20){ showToast('⚠️ Enter a valid weight'); return; }
    lsSet('profile',data);
    renderStats(data);
    syncDietGoal(data.goal);
    // Sync calorie target
    const tInput=document.getElementById('calTarget');
    if(tInput){ tInput.value=GOAL_CALORIES[data.goal]||2000; lsSet('calTarget',+tInput.value); updateCalorieBar(); }
    feedback.textContent='✅ Profile saved!';
    setTimeout(()=>{ feedback.textContent=''; },3000);
    showToast('Profile saved successfully 🎉');
  });
}

function updateAvatarEmoji(goal){
  const map={loss:'🏃',maintain:'🧘',gain:'🏋️'};
  document.getElementById('avatarEmoji').textContent=map[goal]||'👤';
}

function renderStats(profile){
  const goalLabel=GOAL_LABELS[profile.goal]||'—';
  const target=GOAL_CALORIES[profile.goal]||2000;
  let bmiText='—';
  if(profile.weight&&profile.height){
    const bmi=calcBMIValue(+profile.height,+profile.weight);
    bmiText=bmi.toFixed(1)+' · '+getBMICategory(bmi).label;
  }
  document.getElementById('statGoal').textContent=goalLabel;
  document.getElementById('statWeight').textContent=profile.weight?profile.weight+' kg':'—';
  document.getElementById('statTarget').textContent=fmt(target)+' kcal';
  document.getElementById('statBmi').textContent=bmiText;
  document.getElementById('statsRow').style.display='grid';
}

/* ── BMI ────────────────────────────────────────────────────── */
function initBMI(){
  const saved=lsGet('profile');
  if(saved){
    if(saved.height) document.getElementById('bmiHeight').value=saved.height;
    if(saved.weight) document.getElementById('bmiWeight').value=saved.weight;
  }
  document.getElementById('calcBmi').addEventListener('click',()=>{
    const h=+document.getElementById('bmiHeight').value;
    const w=+document.getElementById('bmiWeight').value;
    if(!h||!w||h<50||h>280||w<20||w>300){ showToast('⚠️ Enter valid height and weight'); return; }
    const bmi=calcBMIValue(h,w);
    renderBMIResult(bmi,getBMICategory(bmi));
  });
}

function calcBMIValue(hcm,wkg){ const hm=hcm/100; return wkg/(hm*hm); }

function getBMICategory(bmi){
  if(bmi<18.5) return {label:'Underweight',cls:'under',pct:15};
  if(bmi<25)   return {label:'Normal',     cls:'normal',pct:45};
  if(bmi<30)   return {label:'Overweight', cls:'over',  pct:72};
                return {label:'Obese',      cls:'obese', pct:92};
}

function renderBMIResult(bmi,info){
  const card=document.getElementById('bmiResultCard');
  card.style.display='block';
  card.classList.remove('fade-in'); void card.offsetWidth; card.classList.add('fade-in');
  document.getElementById('bmiNumber').textContent=bmi.toFixed(1);
  const badge=document.getElementById('bmiBadge');
  badge.textContent=info.label; badge.className='bmi-badge '+info.cls;
  const pct=clamp(info.pct,5,97)/100;
  document.getElementById('gaugeFill').style.strokeDashoffset=251-251*pct;
  const deg=-90+180*pct;
  document.getElementById('gaugeNeedle').style.transform=`rotate(${deg}deg)`;
}

/* ── WORKOUT ────────────────────────────────────────────────── */
function initWorkout(){
  workoutState=lsGet('workoutState',{});
  renderWorkoutGrid();
}

function renderWorkoutGrid(){
  const grid=document.getElementById('workoutGrid');
  grid.innerHTML='';
  Object.entries(WORKOUTS).forEach(([day,data])=>{
    if(!workoutState[day]) workoutState[day]={};
    const card=document.createElement('div');
    card.className='day-card';
    const allDone=data.exercises.every(ex=>workoutState[day][ex]);
    if(allDone) card.classList.add('completed');
    card.innerHTML=`
      <div class="day-header">
        <span class="day-name">${data.label}</span>
        <span class="day-badge">✓ Done</span>
      </div>
      <ul class="exercise-list" id="list-${day}"></ul>`;
    const ul=card.querySelector(`#list-${day}`);
    data.exercises.forEach(ex=>{
      const li=document.createElement('li');
      li.className='exercise-item'+(workoutState[day][ex]?' checked':'');
      li.innerHTML=`<span class="check-box">${workoutState[day][ex]?'✓':''}</span><span>${ex}</span>`;
      li.addEventListener('click',()=>toggleExercise(day,ex,li,card));
      ul.appendChild(li);
    });
    grid.appendChild(card);
  });
  updateWorkoutSummary();
}

function toggleExercise(day,ex,li,card){
  workoutState[day][ex]=!workoutState[day][ex];
  li.classList.toggle('checked',workoutState[day][ex]);
  li.querySelector('.check-box').textContent=workoutState[day][ex]?'✓':'';
  const allDone=WORKOUTS[day].exercises.every(e=>workoutState[day][e]);
  card.classList.toggle('completed',allDone);
  if(allDone) showToast(`💪 ${WORKOUTS[day].label} complete!`);
  lsSet('workoutState',workoutState);
  updateWorkoutSummary();
}

function updateWorkoutSummary(){
  let total=0,done=0;
  Object.entries(WORKOUTS).forEach(([day,data])=>{
    data.exercises.forEach(ex=>{ total++; if(workoutState[day]&&workoutState[day][ex]) done++; });
  });
  document.getElementById('wDone').textContent=done;
  document.getElementById('wTotal').textContent=total;
  const pct=total?Math.round((done/total)*100):0;
  document.getElementById('workoutBar').style.width=pct+'%';
}

/* ── DIET ───────────────────────────────────────────────────── */
function initDiet(){
  const pills=document.querySelectorAll('[data-diet]');
  const saved=lsGet('profile');
  if(saved&&saved.goal){ currentDietGoal=saved.goal; pills.forEach(p=>p.classList.toggle('active',p.dataset.diet===currentDietGoal)); }
  pills.forEach(pill=>{
    pill.addEventListener('click',()=>{
      pills.forEach(p=>p.classList.remove('active'));
      pill.classList.add('active');
      currentDietGoal=pill.dataset.diet;
      renderDiet(currentDietGoal);
    });
  });
  renderDiet(currentDietGoal);
}

function syncDietGoal(goal){
  currentDietGoal=goal;
  document.querySelectorAll('[data-diet]').forEach(p=>p.classList.toggle('active',p.dataset.diet===goal));
  renderDiet(goal);
}

function renderDiet(goal){
  const plan=DIET_PLANS[goal];
  const grid=document.getElementById('mealsGrid');
  grid.innerHTML='';
  plan.meals.forEach((meal,i)=>{
    const total=meal.items.reduce((s,it)=>s+it.cal,0);
    const card=document.createElement('div');
    card.className='meal-card'; card.style.animationDelay=`${i*0.08}s`;
    const itemsHTML=meal.items.map(it=>`
      <li class="meal-item">
        <span class="meal-item-name">${it.name}</span>
        <span class="meal-item-cal">${it.cal} kcal</span>
      </li>`).join('');
    card.innerHTML=`
      <div class="meal-header">
        <span class="meal-icon">${meal.icon}</span>
        <div><div class="meal-title">${meal.title}</div><div class="meal-subtitle">${meal.subtitle}</div></div>
      </div>
      <ul class="meal-items">${itemsHTML}</ul>
      <div class="meal-total"><span>Total</span><span class="meal-total-val">${fmt(total)} kcal</span></div>`;
    grid.appendChild(card);
  });
}

/* ── CALORIES ───────────────────────────────────────────────── */
function initCalories(){
  calorieItems=lsGet('calorieItems',[]);
  const tInput=document.getElementById('calTarget');
  const profile=lsGet('profile');
  if(profile&&profile.goal) tInput.value=GOAL_CALORIES[profile.goal]||2000;
  else tInput.value=lsGet('calTarget',2000);
  lsSet('calTarget',+tInput.value);
  tInput.addEventListener('input',()=>{ lsSet('calTarget',+tInput.value); updateCalorieBar(); });
  document.getElementById('addFood').addEventListener('click',addFood);
  document.getElementById('clearAll').addEventListener('click',clearAllFood);
  document.getElementById('foodName').addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('foodCal').focus(); });
  document.getElementById('foodCal').addEventListener('keydown',e=>{ if(e.key==='Enter') addFood(); });
  renderFoodList();
}

function addFood(){
  const nameEl=document.getElementById('foodName');
  const calEl=document.getElementById('foodCal');
  const name=nameEl.value.trim();
  const cal=+calEl.value;
  if(!name){ showToast('⚠️ Enter a food name'); nameEl.focus(); return; }
  if(!cal||cal<1){ showToast('⚠️ Enter valid calories'); calEl.focus(); return; }
  const item={id:Date.now(),name,cal};
  calorieItems.push(item);
  lsSet('calorieItems',calorieItems);
  nameEl.value=''; calEl.value=''; nameEl.focus();
  appendFoodItem(item);
  updateCalorieBar();
  showToast(`Added: ${name} (${fmt(cal)} kcal)`);
}

function appendFoodItem(item){
  const list=document.getElementById('foodList');
  const li=document.createElement('li');
  li.className='food-item'; li.dataset.id=item.id;
  li.innerHTML=`
    <span class="food-name">${item.name}</span>
    <span class="food-cal-badge">${fmt(item.cal)} kcal</span>
    <button class="food-delete" aria-label="Remove ${item.name}">✕</button>`;
  li.querySelector('.food-delete').addEventListener('click',()=>deleteFood(item.id,li));
  list.appendChild(li);
  toggleClearBtn();
}

function deleteFood(id,li){
  calorieItems=calorieItems.filter(i=>i.id!==id);
  lsSet('calorieItems',calorieItems);
  li.style.transition='opacity 0.25s,transform 0.25s';
  li.style.opacity='0'; li.style.transform='translateX(-16px)';
  setTimeout(()=>li.remove(),280);
  updateCalorieBar(); toggleClearBtn();
}

function clearAllFood(){
  if(!calorieItems.length) return;
  calorieItems=[]; lsSet('calorieItems',calorieItems);
  document.getElementById('foodList').innerHTML='';
  updateCalorieBar(); toggleClearBtn(); showToast('Food log cleared');
}

function renderFoodList(){ const list=document.getElementById('foodList'); list.innerHTML=''; calorieItems.forEach(item=>appendFoodItem(item)); updateCalorieBar(); toggleClearBtn(); }

function updateCalorieBar(){
  const target=+document.getElementById('calTarget').value||2000;
  const consumed=calorieItems.reduce((s,i)=>s+i.cal,0);
  const pct=Math.min(Math.round((consumed/target)*100),100);
  const remaining=Math.max(target-consumed,0);
  document.getElementById('calConsumed').textContent=fmt(consumed);
  document.getElementById('calRemaining').textContent=fmt(remaining);
  document.getElementById('calPct').textContent=pct+'%';
  const bar=document.getElementById('calBar');
  bar.style.width=pct+'%';
  if(pct>=100) bar.style.background='linear-gradient(90deg,#ff6b6b,#ff4040)';
  else if(pct>=85) bar.style.background='linear-gradient(90deg,#ffbe32,#ff8800)';
  else bar.style.background='linear-gradient(90deg,var(--accent-1),var(--accent-2))';
}

function toggleClearBtn(){ document.getElementById('clearWrap').style.display=calorieItems.length?'block':'none'; }

/* ── BOOT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  initTheme();
  initNav();
  initProfile();
  initBMI();
  initWorkout();
  initDiet();
  initCalories();
});
