// Compare normalized form values by stable member/vehicle IDs, never by row order.
const houseFields = { fullName:'Nama kepala keluarga', nik:'NIK kepala keluarga', phoneNumber:'Nomor HP', kkNumber:'Nomor KK', kkIssueDate:'Tanggal terbit KK', occupancyStatus:'Status hunian' };
const addressFields = { address:'Alamat pada KK', rt:'RT', rw:'RW', village:'Desa / Kelurahan', district:'Kecamatan', city:'Kabupaten / Kota', province:'Provinsi', postalCode:'Kode pos' };
const familyFields = { fullName:'Nama lengkap', nik:'NIK', relationship:'Hubungan', gender:'Jenis kelamin', birthPlace:'Tempat lahir', birthDate:'Tanggal lahir', occupation:'Pekerjaan', religion:'Agama / kepercayaan', education:'Pendidikan', maritalStatus:'Status perkawinan', marriageDate:'Tanggal perkawinan', citizenship:'Kewarganegaraan', passportNumber:'Nomor paspor', stayPermitNumber:'Nomor izin tinggal', fatherName:'Nama ayah', motherName:'Nama ibu', bloodType:'Golongan darah' };
const vehicleFields = { plateNumber:'Nomor polisi', vehicleType:'Jenis kendaraan', brand:'Merek', color:'Warna' };
const value = (v: any) => v == null ? '' : String(v).trim();
const dateValue = (v: any) => v ? (v instanceof Date ? v.toISOString() : String(v)).slice(0,10) : '';
export function profileDraft(p: any) {
    return { fullName:p.full_name || '', nik:p.nik || '', phoneNumber:p.phone_number || '', kkNumber:p.kk_number || '', kkIssueDate:dateValue(p.kk_issue_date), kkAddress:{...p.kk_address}, occupancyStatus:p.occupancy_status || '',
        family:p.family.map((f: any) => ({...f.kk_details,id:f.id,fullName:f.full_name,nik:f.nik,relationship:f.relationship,gender:f.gender,birthPlace:f.birth_place,birthDate:dateValue(f.birth_date),occupation:f.occupation,marriageDate:dateValue(f.kk_details?.marriageDate)})),
        vehicles:p.vehicles.map((v: any) => ({id:v.id,plateNumber:v.plate_number,vehicleType:v.vehicle_type,brand:v.brand,color:v.color})) };
}
function fields(before: any, after: any, labels: Record<string,string>, kind = 'changed') {
    return Object.entries(labels).flatMap(([key,label]) => {
        // Missing keys in older submissions preserve their existing values on approval.
        if (kind === 'changed' && after[key] === undefined) return [];
        const oldValue=value(before[key]), newValue=value(after[key]);
        if (oldValue === newValue) return [];
        return [{key,label,before:oldValue,after:newValue}];
    });
}
export function profileChanges(base: any, proposed: any, attachments: any[]) {
    const before=profileDraft(base), changes: any[]=[];
    const add=(title:string, kind:string, rows:any[], extra:any={}) => { if (rows.length) changes.push({title,kind,fields:rows,...extra}); };
    add('Identitas keluarga','changed',fields(before,proposed,houseFields));
    add('Alamat pada KK','changed',fields(before.kkAddress || {},proposed.kkAddress || {},addressFields));
    for (const [key,labels,title,name] of [['family',familyFields,'Anggota keluarga','fullName'],['vehicles',vehicleFields,'Kendaraan','plateNumber']] as const) {
        const oldMap=new Map<string,any>(before[key].map((row:any)=>[row.id,row]));
        const newMap=new Map<string,any>((proposed[key] || []).map((row:any)=>[row.id,row]));
        for (const [id,row] of newMap) {
            const old=oldMap.get(id), kind=old?'changed':'added';
            add(`${title} · ${row[name] || old?.[name] || '—'}`,kind,fields(old || {},row,labels,kind),{collection:key,id});
        }
        for (const [id,row] of oldMap) if (!newMap.has(id)) add(`${title} · ${row[name] || '—'}`,'removed',fields(row,{},labels,'removed'),{collection:key,id});
    }
    const oldFiles=new Map<string,any>((base.attachments || []).map((a:any)=>[a.id,a]));
    const newFiles=new Map<string,any>(attachments.map(a=>[a.id,a]));
    for (const [id,file] of newFiles) if (!oldFiles.has(id)) add('Lampiran','added',[{key:'attachment',label:file.kind,before:'',after:file.original_name}],{attachment:file});
    for (const [id,file] of oldFiles) if (!newFiles.has(id)) add('Lampiran','removed',[{key:'attachment',label:file.kind,before:file.original_name,after:''}]);
    return changes;
}
export function reapplyProfile(base: any, proposed: any, latest: any, attachments: any[]) {
    const before=profileDraft(base), merged:any=profileDraft(latest);
    for (const key of Object.keys(houseFields)) if (proposed[key] !== undefined && value(proposed[key])!==value((before as any)[key])) merged[key]=proposed[key];
    for (const key of Object.keys(addressFields)) if (proposed.kkAddress?.[key] !== undefined && value(proposed.kkAddress[key])!==value(before.kkAddress[key])) merged.kkAddress[key]=proposed.kkAddress[key];
    for (const [key,labels] of [['family',familyFields],['vehicles',vehicleFields]] as const) {
        const oldMap=new Map<string,any>(before[key].map((row:any)=>[row.id,row]));
        const newMap=new Map<string,any>((proposed[key] || []).map((row:any)=>[row.id,row]));
        merged[key]=merged[key].filter((row:any)=>!oldMap.has(row.id)||newMap.has(row.id));
        for (const [id,row] of newMap) {
            const old=oldMap.get(id), index=merged[key].findIndex((r:any)=>r.id===id);
            if (!old) { if (index<0) merged[key].push(row); else merged[key][index]={...merged[key][index],...row}; }
            else {
                const edits=fields(old,row,labels);
                if (!edits.length) continue;
                if (index<0) merged[key].push(row);
                else for (const change of edits) merged[key][index][change.key]=row[change.key];
            }
        }
    }
    const oldIds=new Set((base.attachments || []).map((a:any)=>a.id)), newIds=new Set(attachments.map(a=>a.id));
    const files=latest.attachments.filter((a:any)=>!oldIds.has(a.id)||newIds.has(a.id));
    for (const file of attachments) if (!oldIds.has(file.id)&&!files.some((a:any)=>a.id===file.id)) files.push(file);
    return {payload:merged,attachments:files};
}
