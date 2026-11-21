import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:8302/api/', tokens = {};
async function call(role, path, body, expected = 200) {
  const r = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(tokens[role] ? { Authorization: 'Bearer ' + tokens[role] } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const json = await r.json(); assert.equal(r.status, expected, `${role} ${path}: ${JSON.stringify(json)}`); return json.data ?? json;
}
for (const [role, username] of Object.entries({ secretary:'blok_a10', citizen:'blok_a1', other:'blok_a2', treasurer:'blok_b1', chair:'blok_a8' })) { const d=await call(null, 'auth/login', { username, password:'purimas' }); tokens[role]=d.token; if(d.user.mustChangePassword) tokens[role]=(await call(role,'auth/password',{currentPassword:'purimas',newPassword:'RumahUji-2026!'})).token; }
const resident = await call('citizen', 'residents/me');
assert.equal((await call('secretary','residents')).length, 24);
assert.equal((await call('secretary',`residents/${resident.id}`)).id, resident.id);
await call('citizen','residents',undefined,403);
await call('other',`residents/${resident.id}`,undefined,403);
await call('treasurer',`residents/${resident.id}`,undefined,403);
const payload = {fullName:'Data uji', phoneNumber:'', nik:'', kkNumber:'1234567890123456', kkAddress:{address:'Alamat uji'}, occupancyStatus:'Pemilik Tetap', family:[{fullName:'Kepala uji',relationship:'Kepala Keluarga',gender:'Laki-laki',birthDate:'1980-01-01',education:'SLTA/sederajat'}], vehicles:[{plateNumber:'B 1234 XX',vehicleType:'Motor'}]};
const save = {baseRevision: resident.revision, payload, attachmentIds:[]};
await call('chair',`residents/${resident.id}/profile`,save,403);
await call('citizen',`residents/${resident.id}/profile`,save,403);
await call('secretary',`residents/${resident.id}/profile`,save);
await call('secretary',`residents/${resident.id}/profile`,save,409);
let updated = await call('citizen','residents/me');
assert.equal(updated.full_name,'Data uji'); assert.equal(updated.family.length,1); assert.equal(updated.vehicles.length,1); assert.equal((await call('chair','dashboard')).demographics.total,1);
const upload = await fetch(base+'attachments',{method:'POST',headers:{Authorization:'Bearer '+tokens.secretary,'Content-Type':'application/pdf','X-File-Kind':'KK','X-File-Name':'kk.pdf','X-Resident-Id':String(resident.id)},body:Buffer.from('%PDF-1.4\n%%EOF')});assert.equal(upload.status,200);const file = (await upload.json()).data;
const row = updated.family[0], vehicle = updated.vehicles[0];
const amended = {...payload,family:[{...payload.family[0],id:row.id}],vehicles:[{...payload.vehicles[0],id:vehicle.id}]};
await call('secretary',`residents/${resident.id}/profile`,{baseRevision:updated.revision,payload:amended,attachmentIds:[file.id]});
await call('secretary',`attachments/${file.id}/link`,{});
await call('treasurer',`attachments/${file.id}/link`,{},403);
await call('other',`attachments/${file.id}/link`,{},403);
updated = await call('citizen','residents/me'); assert.equal(updated.attachments[0].id,file.id);
const sub = await call('citizen','submissions',{type:'PERUBAHAN_DATA',baseRevision:updated.revision,payload:amended,attachmentIds:[file.id]});
await call('secretary',`residents/${resident.id}/profile`,{baseRevision:updated.revision,payload:amended,attachmentIds:[file.id]},409);
await call('secretary',`submissions/${sub.id}/review`,{status:'DISETUJUI',reviewNote:'Uji'});
assert.equal((await call('citizen','residents/me')).family[0].full_name,'Kepala uji');
console.log('PASS: secretary list, edit, upload and verified files; role restrictions, revision conflicts and resident approval.');
