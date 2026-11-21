import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8302';
if (base !== 'http://127.0.0.1:8302') throw Error('Use isolated auth test server only.');
const password = 'RumahUji-2026!';
async function call(path, token, body, status = 200) {
 const r = await fetch(base+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const d=await r.json();assert.equal(r.status,status,path+': '+JSON.stringify(d));return d;
}
const login=(username,pw='purimas',status=200)=>call('auth/login',null,{username,password:pw},status);
const setup=async username=>{const d=await login(username);return d.user.mustChangePassword?(await call('auth/password',d.token,{currentPassword:'purimas',newPassword:password})).token:d.token;};
const chair=await setup('blok_a8'),secretary=await setup('blok_a10'),treasurer=await setup('blok_b1');
const citizenLogin=await login('blok_a2');const citizenId=citizenLogin.user.id;
const citizen=(await call('auth/password',citizenLogin.token,{currentPassword:'purimas',newPassword:password})).token;
const payload=jwt.decode(citizen);assert.equal(payload.exp-payload.iat,90*86400);
const restored=await call('auth/me',citizen);assert.equal(restored.data.id,citizenId);assert.equal(jwt.decode(restored.token).exp-jwt.decode(restored.token).iat,90*86400);
const testKey='4b184df8e7bf4f92a654f824d93e9c0da222c1b6dc88faf96dbc48636f8f707b';
const aged=jwt.sign({id:citizenId,sessionVersion:payload.sessionVersion,purpose:'session',iat:Math.floor(Date.now()/1000)-60*86400},testKey,{expiresIn:'90d'});
const renewed=await call('auth/me',aged);assert.ok(jwt.decode(renewed.token).exp-jwt.decode(aged).exp>59*86400);
const expired=jwt.sign({id:citizenId,sessionVersion:payload.sessionVersion,purpose:'session'},testKey,{expiresIn:-1});await call('auth/me',expired,undefined,401);
const secretaryUsers=(await call('users',secretary)).data;assert.equal(secretaryUsers.length,21);assert.ok(secretaryUsers.every(u=>u.role==='WARGA'));assert.equal((await call('users',chair)).data.length,24);
for(const token of [citizen,treasurer]){await call('users',token,undefined,403);await call(`users/${citizenId}/reset-password`,token,{},403);}
for(const actor of [chair,secretary]){
 await call(`users/${jwt.decode(chair).id}/reset-password`,actor,{},403);
 await call('users/999999/reset-password',actor,{},404);await call('users/invalid/reset-password',actor,{},400);
}
for(let i=0;i<10;i++)await login('blok_a2','wrong',401);await login('blok_a2',password,429);
await call(`users/${citizenId}/reset-password`,secretary,{});
await call('auth/me',citizen,undefined,401);await call('auth/me',renewed.token,undefined,401);await login('blok_a2',password,401);
const reset=await login('blok_a2');assert.ok(reset.user.mustChangePassword);await call('dashboard',reset.token,undefined,403);
const changed=(await call('auth/password',reset.token,{currentPassword:'purimas',newPassword:password})).token;await call('dashboard',changed);
await call(`users/${citizenId}/reset-password`,chair,{});await call('auth/me',changed,undefined,401);
const again=await login('blok_a2');assert.ok(again.user.mustChangePassword);
const audit=(await call('audit',chair)).data.filter(a=>a.action==='RESET_PASSWORD'&&a.entity_id===String(citizenId));assert.equal(audit.length,2);
await call('auth/logout',again.token,{});await call('auth/me',again.token,undefined,401);
console.log('PASS: 90-day renewable session, expiry, reset permissions, admin protection, default password, mandatory change, lockout recovery, old-session revocation, audit, logout.');
