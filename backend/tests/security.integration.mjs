import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
const host='http://127.0.0.1:8302',base=host+'/api/';
async function request(path,{token,body,method}={}){return fetch(base+path,{method:method|| (body===undefined?'GET':'POST'),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});}
async function post(path,body,token){return request(path,{body,token});}
const login=await post('auth/login',{username:'blok_a1',password:'purimas'});assert.equal(login.status,200);const initial=await login.json();assert(initial.user.mustChangePassword);const old=initial.token;
assert.equal((await request('auth/me',{token:old})).status,200);
for(const path of ['residents/me','dashboard','bills','demographics'])assert.equal((await request(path,{token:old})).status,403,path);
assert.equal((await post('auth/password',{currentPassword:'purimas',newPassword:'short'},old)).status,400);
assert.equal((await post('auth/password',{currentPassword:'purimas',newPassword:'password123456'},old)).status,400);
assert.equal((await post('auth/password',{currentPassword:'purimas',newPassword:'A'.repeat(73)},old)).status,400);
assert.equal((await post('auth/password',{currentPassword:'salah',newPassword:'RumahAman-26!'},old)).status,400);
const change=await post('auth/password',{currentPassword:'purimas',newPassword:'RumahAman-26!'},old);assert.equal(change.status,200);const current=(await change.json()).token;
assert.equal((await request('auth/me',{token:old})).status,401);assert.equal((await request('residents/me',{token:current})).status,200);
const secret='4b184df8e7bf4f92a654f824d93e9c0da222c1b6dc88faf96dbc48636f8f707b';const forgedTicket=jwt.sign({id:initial.user.id,sessionVersion:1,purpose:'attachment'},secret,{algorithm:'HS256',expiresIn:'1m'});assert.equal((await request('auth/me',{token:forgedTicket})).status,401);
const badAlg=jwt.sign({id:initial.user.id,sessionVersion:1,purpose:'session'},secret,{algorithm:'HS384',expiresIn:'1m'});assert.equal((await request('auth/me',{token:badAlg})).status,401);
assert.equal((await post('auth/logout',{},current)).status,200);assert.equal((await request('auth/me',{token:current})).status,401);
const headers=await fetch(host+'/',{headers:{Origin:'https://evil.example'}});assert.equal(headers.headers.get('access-control-allow-origin'),null);assert.equal(headers.headers.get('x-frame-options'),'DENY');assert.match(headers.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert(headers.headers.get('strict-transport-security'));
const malformed=await fetch(base+'auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"password":"PRIVATE_MARKER"'});assert.equal(malformed.status,400);assert(!(await malformed.text()).includes('PRIVATE_MARKER'));
for(let i=0;i<10;i++)assert.equal((await post('auth/login',{username:'blok_a5',password:'not-the-password'})).status,401);
assert.equal((await post('auth/login',{username:'blok_a5',password:'purimas'})).status,429);
console.log('PASS: first-login password gate, password policy, scoped JWT, logout revocation, security headers and account lockout.');
