import assert from 'node:assert/strict';
const base='http://127.0.0.1:8302/api/',tokens={};
async function raw(role,path,body){return fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});}
async function call(role,path,body,expected=200){const r=await raw(role,path,body);const d=await r.json();assert.equal(r.status,expected,`${role} ${path}: ${JSON.stringify(d)}`);return d.data??d;}
for(const [role,username] of Object.entries({treasurer:'blok_b1',citizen:'blok_a3',other:'blok_a4',secretary:'blok_a10',chair:'blok_a8'}))tokens[role]=(await call(null,'auth/login',{username,password:'purimas'})).token;
await call('treasurer','bills/advance-settings',{amount:150000});
const p=await call('citizen','residents/me'), others=await call('other','residents/me');
const bills=(await call('citizen','bills')).filter(b=>b.status!=='LUNAS');assert(bills.length>=4);
await call('other',`bills/advance-options?residentId=${p.id}`,undefined,403);
const options=(await call('treasurer',`bills/advance-options?residentId=${p.id}`)).months;assert(options.length>0);const next=options[0], future={year:next.year,monthIndex:next.monthIndex,amount:next.amount};
const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
const payload={residentId:p.id,billIds:[bills[1].id],futureMonths:[future],channel:'TRANSFER',paidDate:today,reference:'BUKTI-UJI-001'};
await call('citizen','payments/manual',payload,403);await call('chair','payments/manual',payload,403);await call('secretary','payments/manual',payload,403);
await call('treasurer','payments/manual',{...payload,paidDate:'2199-01-01'},400);
await call('treasurer','payments/manual',{...payload,residentId:others.id},403);
await call('treasurer','payments/manual',{...payload,futureMonths:[{...future,amount:1}]},409);
assert.equal((await call('citizen','bills')).length,12);
const pending=await call('citizen','payments',{billIds:[bills[0].id],channel:'TUNAI',paidDate:today,reference:'PENDING-UJI'});
await call('treasurer','payments/manual',{...payload,billIds:[bills[0].id]},409);
assert.equal((await call('citizen','bills')).length,12);
const initial=(await call('citizen','transparency')).cash.currentBalance;
const manual=await call('treasurer','payments/manual',payload);assert.equal(Number(manual.amount),300000);assert.equal(manual.months,2);
const current=await call('citizen','bills');assert.equal(current.find(b=>b.id===bills[1].id).status,'LUNAS');assert.equal(current.find(b=>b.year===future.year&&b.month_index===future.monthIndex).status,'LUNAS');
assert.equal((await call('citizen','transparency')).cash.currentBalance,initial+300000);
const history=(await call('citizen','payments')).find(x=>x.id===manual.id);assert.equal(history.status,'DISETUJUI');assert.equal(history.bills.length,2);assert.match(history.note,/langsung oleh bendahara/);
assert.equal((await call('treasurer','payment-notifications')).pending,1);await call('treasurer','payments/manual',payload,409);
const cash=await call('treasurer','cash');assert.equal(cash.filter(x=>x.receipt_code==='BUKTI-UJI-001').length,2);
const race={residentId:p.id,billIds:[bills[2].id],futureMonths:[],channel:'TUNAI',paidDate:today,reference:'UJI-RACE'};
const replies=await Promise.all([raw('treasurer','payments/manual',race),raw('treasurer','payments/manual',race)]);assert.deepEqual(replies.map(r=>r.status).sort(),[200,409]);
await call('treasurer',`bills/${bills[3].id}/pay`,{paidAt:today,paymentChannel:'Tunai',transactionRef:'LEGACY-UJI'});
assert((await call('citizen','payments')).some(x=>x.reference==='LEGACY-UJI'&&x.status==='DISETUJUI'));
const otherBills=await call('other','bills'); const raceBill=otherBills.find(b=>b.status==='BELUM_BAYAR'&&!b.pending_payment_id);
const simultaneous=await Promise.all([
 raw('other','payments',{billIds:[raceBill.id],channel:'TUNAI',paidDate:today,reference:'UJI-WARGA'}),
 raw('treasurer','payments/manual',{residentId:others.id,billIds:[raceBill.id],channel:'TUNAI',paidDate:today,reference:'UJI-BENDAHARA'})
]);
assert.deepEqual(simultaneous.map(r=>r.status).sort(),[200,409]);
console.log('PASS: manual multi-month and advance payments, cash, citizen history, pending lock, roles, rollback, duplicate and legacy path.');
