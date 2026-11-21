import assert from 'node:assert/strict';
const base='http://127.0.0.1:8302/api/',tokens={};
async function call(role,path,body,expected=200){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const d=await r.json();assert.equal(r.status,expected,`${role} ${path}: ${JSON.stringify(d)}`);return d.data??d;}
for(const [role,username] of Object.entries({treasurer:'blok_b1',citizen:'blok_a3',other:'blok_a4',secretary:'blok_a10',chair:'blok_a8'}))tokens[role]=(await call(null,'auth/login',{username,password:'purimas'})).token;
assert.equal((await call('citizen','bills/advance-options')).amount,null);
await call('citizen','bills/advance-settings',{amount:150000},403);
await call('treasurer','bills/advance-settings',{amount:150000});
await call('treasurer','payment-settings',{bankName:'Bank Uji',accountNumber:'1234567890',accountName:'Pengujian'});
const before=await call('citizen','bills');const outstanding=before.find(b=>b.status!=='LUNAS');const options=(await call('citizen','bills/advance-options')).months;
assert(options.length>=2);const f=options.slice(0,2).map(m=>({year:m.year,monthIndex:m.monthIndex,amount:m.amount}));
const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});const basePayment={billIds:[outstanding.id],futureMonths:f,channel:'TUNAI',paidDate:today,reference:'UJI'};
await call('citizen','payments',{...basePayment,futureMonths:[{...f[0],amount:1}]},409);
await call('citizen','payments',{...basePayment,futureMonths:[f[0],f[0]]},400);
await call('citizen','payments',{...basePayment,futureMonths:[{year:2199,monthIndex:1,amount:150000}]},400);
assert.equal((await call('citizen','bills')).length,before.length);
const upload=await fetch(base+'attachments',{method:'POST',headers:{Authorization:'Bearer '+tokens.citizen,'Content-Type':'application/pdf','X-File-Kind':'BUKTI','X-File-Name':'bukti.pdf'},body:Buffer.from('%PDF-1.4\n%%EOF')});assert.equal(upload.status,200);const proof=(await upload.json()).data;
const initial=(await call('citizen','transparency')).cash.currentBalance;
const payment=await call('citizen','payments',{...basePayment,channel:'TRANSFER',attachmentId:proof.id});assert.equal(Number(payment.amount),450000);assert.equal((await call('citizen','transparency')).cash.currentBalance,initial);
let bills=await call('citizen','bills');assert.equal(bills.length,before.length+2);for(const month of f){const bill=bills.find(b=>b.year===month.year&&b.month_index===month.monthIndex);assert.equal(bill.status,'BELUM_BAYAR');assert(bill.pending_payment_id);}
assert.equal((await call('citizen','bills/advance-options')).months.length,options.length-2);
await call('citizen','payments',{...basePayment,channel:'TRANSFER',attachmentId:proof.id},409);
assert.equal((await call('other','bills')).length,12);
const record=(await call('treasurer','payments')).find(p=>p.id===payment.id);assert.equal(record.bills.length,3);assert.equal((await call('treasurer','payment-notifications')).pending,1);
await call('secretary',`payments/${payment.id}/review`,{status:'DISETUJUI'},403);
await call('treasurer',`payments/${payment.id}/review`,{status:'DISETUJUI'});
await call('treasurer',`payments/${payment.id}/review`,{status:'DISETUJUI'},409);
bills=await call('citizen','bills');for(const month of f)assert.equal(bills.find(b=>b.year===month.year&&b.month_index===month.monthIndex).status,'LUNAS');assert.equal((await call('citizen','transparency')).cash.currentBalance,initial+450000);
const cash=await call('treasurer','cash');assert.equal(cash.filter(x=>String(x.description).includes('#'+payment.id)).length,3);
console.log('PASS: future options, rate and ownership checks, proof, pending, approval, cash posting and duplicate prevention.');
