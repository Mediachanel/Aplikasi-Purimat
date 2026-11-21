import assert from 'node:assert/strict';
const base='http://127.0.0.1:8302/api/',tokens={};
async function call(role,path,body,expected=200){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const d=await r.json();assert.equal(r.status,expected,`${role} ${path}: ${JSON.stringify(d)}`);return d.data??d;}
for(const [role,username] of Object.entries({treasurer:'blok_b1',citizen:'blok_a1',other:'blok_a2',secretary:'blok_a10'}))tokens[role]=(await call(null,'auth/login',{username,password:'purimas'})).token;
const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'}), [y,m]=today.split('-').map(Number);
function period(offset){const d=new Date(Date.UTC(y,m-1+offset,1));return {year:d.getUTCFullYear(),monthIndex:d.getUTCMonth()+1};}
const prev=period(-1),past=period(-2),future=period(1);
for(const p of [past,prev,future])await call('treasurer','bills/generate-monthly',{...p,amount:150000});
await call('citizen','bills/reminders',undefined,403);await call('secretary','payment-notifications',undefined,403);
let data=await call('treasurer','bills/reminders');assert.equal(data.dueDay,null);assert.equal(data.unknownDueCount,72);assert.equal(data.rows.length,0);
await call('citizen','bills/reminder-settings',{dueDay:5},403);await call('treasurer','bills/reminder-settings',{dueDay:32},400);
await call('treasurer','bills/reminder-settings',{dueDay:5});data=await call('treasurer','bills/reminders');assert.equal(data.rows.length,24);assert.equal(data.amount,24*2*150000);assert.equal(data.rows[0].bills.length,2);assert(data.rows[0].bills.every(b=>b.dueDate.endsWith('-05') && b.dueDate<today));
const mine=await call('citizen','bills');const bill=mine.find(b=>b.year===prev.year&&b.month_index===prev.monthIndex);
assert.equal((await call('treasurer','payment-notifications')).pending,0);
const payment=await call('citizen','payments',{billIds:[bill.id],channel:'TUNAI',paidDate:today,reference:'UJI'});
const alerts=await call('treasurer','payment-notifications');assert.equal(alerts.pending,1);assert.equal(alerts.latest,Number(payment.id));
data=await call('treasurer','bills/reminders');assert.equal(data.pendingCount,1);assert.equal(data.amount,24*2*150000-150000);assert(!data.rows.flatMap(x=>x.bills).some(b=>b.id===bill.id));
await call('treasurer',`payments/${payment.id}/review`,{status:'DITOLAK',note:'Pengujian'});assert.equal((await call('treasurer','payment-notifications')).pending,0);data=await call('treasurer','bills/reminders');assert.equal(data.pendingCount,0);assert(data.rows.flatMap(x=>x.bills).some(b=>b.id===bill.id));
console.log('PASS: deadlines, past/future filtering, pending verification, role restrictions and new payment alerts.');
