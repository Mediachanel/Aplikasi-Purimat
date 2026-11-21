import assert from 'node:assert/strict';
const host='http://127.0.0.1:8302';const tokens={},users={};
async function call(role,path,body,status=200){const r=await fetch(host+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const d=await r.json();assert.equal(r.status,status,`${role} ${path}: ${JSON.stringify(d)}`);return d.data??d;}
for(const [role,username] of Object.entries({secretary:'blok_a10',citizen:'blok_a1',treasurer:'blok_b1',chair:'blok_a8'})){const d=await call(null,'auth/login',{username,password:'purimas'});tokens[role]=d.token;users[role]=d.user;if(d.user.mustChangePassword)tokens[role]=(await call(role,'auth/password',{currentPassword:'purimas',newPassword:'MenuUji-2026!'})).token;}
await call('treasurer','cash/opening-balance',{amount:0,date:'2026-01-01',reference:'TEST-OPENING'});
await call('treasurer','bills/generate-year',{year:2026,amount:150000});await call('treasurer','bills/advance-settings',{amount:150000});await call('treasurer','payment-settings',{bankName:'Bank Uji',accountNumber:'1234567890',accountName:'Uji Terisolasi'});
const bills=await call('secretary','bills');assert.equal(bills.length,12);assert(bills.every(b=>b.resident_id===users.secretary.residentId));const foreign=(await call('citizen','bills'))[0];
for(const path of ['dashboard','payments','transparency','announcements','documents','residents/me','submissions','bills/advance-options','payment-settings','residents','users'])await call('secretary',path);
assert.equal((await call('secretary','users')).filter(u=>u.role==='WARGA').length,21);
await call('secretary',`bills/advance-options?residentId=${users.citizen.residentId}`,undefined,403);
for(const path of ['cash','reports/cash','bills/reminders','payment-notifications','bills/advance-settings'])await call('secretary',path,undefined,403);
for(const [path,body] of [['bills/generate-year',{year:2027,amount:150000}],['payments/manual',{}],['payment-settings',{}],['announcements',{}],['cash',{}],['bills/advance-settings',{amount:1}]])await call('secretary',path,body,403);
const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'}),pay={channel:'TUNAI',paidDate:today,reference:'UJI-MENU'};
await call('secretary','payments',{...pay,billIds:[foreign.id]},403);
const other=await call('citizen','payments',{...pay,billIds:[foreign.id]});assert.equal((await call('secretary','payments')).length,0);
const upload=await fetch(host+'/api/attachments',{method:'POST',headers:{Authorization:'Bearer '+tokens.secretary,'Content-Type':'application/pdf','X-File-Kind':'BUKTI','X-File-Name':'bukti.pdf'},body:Buffer.from('%PDF-1.4\n%%EOF')});assert.equal(upload.status,200);const proof=(await upload.json()).data;
await call('secretary',`attachments/${proof.id}/link`,{});await call('citizen',`attachments/${proof.id}/link`,{},403);
const future=(await call('secretary','bills/advance-options')).months[0];assert(future);
const before=(await call('secretary','transparency')).cash.currentBalance;
const own=await call('secretary','payments',{...pay,channel:'TRANSFER',attachmentId:proof.id,billIds:[bills[0].id],futureMonths:[{year:future.year,monthIndex:future.monthIndex,amount:future.amount}]});assert.equal(Number(own.amount),300000);
const payments=await call('secretary','payments');assert.equal(payments.length,1);assert.equal(payments[0].id,own.id);assert(payments.every(p=>p.resident_id===users.secretary.residentId));assert(!payments.some(p=>p.id===other.id));assert.equal((await call('secretary','transparency')).cash.currentBalance,before);
await call('secretary',`payments/${own.id}/review`,{status:'DISETUJUI'},403);await call('treasurer',`payments/${own.id}/review`,{status:'DISETUJUI'});
assert.equal((await call('secretary','payments'))[0].status,'DISETUJUI');assert.equal(Number((await call('secretary','transparency')).cash.currentBalance),Number(before)+300000);
assert.equal((await call('secretary','dashboard')).bills.paid,2);
console.log('PASS: secretary resident services, own-house bills/payments/advance/proof, payment submission and treasurer review, privacy, existing admin access, no finance management privileges.');
