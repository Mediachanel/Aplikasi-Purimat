import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID, createHash } from 'node:crypto';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { profileChanges, reapplyProfile } from './profileChanges.js';
import { pool, query } from './config/db.js';
import { saveFile, removeFile, sendStoredFile } from './services/fileStore.js';
import { ENV } from './config/env.js';
export const portal = express.Router();
const roles = ['KETUA', 'SEKRETARIS', 'BENDAHARA', 'WARGA'];
class HttpError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
const fail = (status: number, message: string): never => { throw new HttpError(status, message); };
const wrap = (fn: (req: Request, res: Response) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res)).catch(next); };
const allow = (...allowed: string[]) => (_req: Request, res: Response, next: NextFunction) => {
    if (!allowed.includes(res.locals.user.role))
        return next(new HttpError(403, 'Anda tidak memiliki akses ke layanan ini.'));
    next();
};
const txt = (v: unknown, max = 200, required = false): string => {
    if (v === undefined || v === null)
        v = '';
    if (typeof v !== 'string')
        return fail(400, 'Format data tidak valid.');
    const s = v.trim();
    if (s.length > max || (required && !s))
        return fail(400, 'Data wajib diisi dan tidak boleh melebihi batas panjang.');
    return s;
};
const num = (v: unknown, min = 1, max = 1e12) => {
    const n = Number(v);
    if (!Number.isSafeInteger(n) || n < min || n > max)
        return fail(400, 'Nilai angka tidak valid.');
    return n;
};
const uuid = (v: unknown): string => {
    const s = txt(v, 36, true);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))
        return fail(400, 'Identitas berkas tidak valid.');
    return s;
};
const day = (v: unknown, optional = false) => {
    if (optional && !v)
        return null;
    const s = txt(v, 10, true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s)
        return fail(400, 'Tanggal tidak valid.');
    return s;
};
const nik = (v: unknown) => {
    const s = txt(v, 16);
    if (s && !/^\d{16}$/.test(s))
        return fail(400, 'NIK harus terdiri dari 16 digit.');
    return s;
};
const ok = (res: Response, data: any, message?: string) => res.json({ success: true, data, ...(message ? { message } : {}) });
const sign = (u: any) => jwt.sign({ id: u.id, sessionVersion: u.session_version, purpose: 'session' }, ENV.JWT_SECRET, { algorithm: 'HS256', expiresIn: '90d' });
const viewUser = (u: any) => ({ id: u.id, username: u.username, role: u.role, residentId: u.resident_id, fullName: u.full_name || `${u.block_number} No. ${u.house_number}`, blockNumber: u.block_number, houseNumber: u.house_number, mustChangePassword: u.must_change_password });
const audit = async (c: any, u: any, action: string, entity: string, id: any) => c.query('INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4)', [u.id, action, entity, String(id)]);
const loginIpAttempts = new Map<string, { count: number; until: number }>();
// Constant work for unknown accounts prevents a simple account-existence timing oracle.
const dummyPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYJz6TtxfE6G8kjOVQ6o.IeD95L26mcK';
portal.post('/auth/login', wrap(async (req, res) => {
    const username = txt(req.body?.username, 100, true).toLowerCase();
    const password = txt(req.body?.password, 128, true);
    const now=Date.now(), ip=req.ip || 'unknown';
    for (const [key,value] of loginIpAttempts) if (value.until <= now) loginIpAttempts.delete(key);
    const ipState=loginIpAttempts.get(ip);
    if (ipState && ipState.count >= 120) fail(429, 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.');
    loginIpAttempts.set(ip, {count:(ipState?.count || 0)+1, until:ipState?.until || now+15*60*1000});
    const digest=createHash('sha256').update(username).digest('hex');
    const throttle=(await query('SELECT locked_until > NOW() AS locked FROM security_login_attempts WHERE account_digest=$1', [digest])).rows[0];
    if (throttle?.locked) fail(429, 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.');
    const { rows } = await query(`SELECT u.*,r.full_name,r.block_number,r.house_number FROM users u JOIN residents r ON r.id=u.resident_id WHERE u.username=$1 AND u.is_active=true`, [username]);
    const u=rows[0];
    const valid=await bcrypt.compare(password, u?.password_hash || dummyPasswordHash);
    if (!u || !valid) {
        await query(`INSERT INTO security_login_attempts(account_digest,attempts,window_until,locked_until)
          VALUES($1,1,NOW()+INTERVAL '15 minutes',NULL)
          ON CONFLICT(account_digest) DO UPDATE SET
            attempts=CASE WHEN security_login_attempts.window_until<=NOW() THEN 1 ELSE security_login_attempts.attempts+1 END,
            locked_until=CASE WHEN security_login_attempts.window_until<=NOW() THEN NULL WHEN security_login_attempts.attempts+1>=10 THEN security_login_attempts.window_until ELSE security_login_attempts.locked_until END,
            window_until=CASE WHEN security_login_attempts.window_until<=NOW() THEN NOW()+INTERVAL '15 minutes' ELSE security_login_attempts.window_until END`, [digest]);
        if (Math.random()<0.01) await query("DELETE FROM security_login_attempts WHERE window_until < NOW() - INTERVAL '1 hour'");
        fail(401, 'Username atau password salah.');
    }
    await query('DELETE FROM security_login_attempts WHERE account_digest=$1', [digest]);
    res.json({ success: true, token: sign(u), user: viewUser(u) });
}));
async function attachmentAccess(u: any, a: any) {
    if (a?.kind === 'KAS') {
        if (financeScope(u)) return;
        fail(403, 'Bukti transaksi kas hanya dapat diakses ketua dan bendahara.');
    }
    if (a && u.role === 'BENDAHARA' && a.kind === 'BUKTI' && (await query('SELECT 1 FROM payment_requests WHERE attachment_id=$1', [a.id])).rows.length)
        return;
    if (!a)
        fail(404, 'Berkas tidak ditemukan.');
    if (u.resident_id === a.resident_id || u.role === 'KETUA')
        return;
    if (u.role === 'SEKRETARIS' && ['KTP','KK'].includes(a.kind) && (a.uploaded_by === u.id || (await query('SELECT 1 FROM submission_files WHERE attachment_id=$1 UNION ALL SELECT 1 FROM verified_attachments WHERE attachment_id=$1 LIMIT 1', [a.id])).rows.length))
        return;
    fail(403, 'Berkas identitas tidak dapat diakses.');
}
const excelMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
async function sendCashExcel(res: Response, rows: any[], filename: string, report?: any) {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('Kas Purimas');
    sheet.columns = [{ width: 16 }, { width: 40 }, { width: 24 }, { width: 20 }, { width: 20 }, { width: 22 }];
    sheet.addRow([report ? 'Laporan Kas Purimas' : 'Buku Kas Purimas']);
    sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FFC7460D' } };
    if (report) {
        sheet.addRow(['Periode', report.period.from, report.period.to]);
        sheet.addRow(['Filter transaksi', report.period.type || 'Semua transaksi']);
        sheet.addRow(['Saldo awal', report.summary.opening]);
        sheet.addRow(['Debit / masuk', report.summary.income]);
        sheet.addRow(['Kredit / keluar', report.summary.expense]);
        sheet.addRow(['Saldo akhir', report.summary.closing]);
        for (let i = 4; i <= 7; i++) sheet.getCell(i, 2).numFmt = '#,##0';
    }
    sheet.addRow([]);
    const header = sheet.addRow(['Tanggal', 'Transaksi', 'Kategori', 'Debit (Rp)', 'Kredit (Rp)', 'Bukti']);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7460D' } };
    sheet.views = [{ state: 'frozen', ySplit: header.number }];
    for (const r of rows) {
        const date = typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10);
        const row = sheet.addRow([date, r.title, r.category, r.type === 'MASUK' ? Number(r.amount) : null, r.type === 'KELUAR' ? Number(r.amount) : null, r.attachment_name || r.receipt_code || '']);
        row.getCell(4).numFmt = row.getCell(5).numFmt = '#,##0';
    }
    res.set({ 'Content-Type': excelMime, 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store' });
    res.send(Buffer.from(await book.xlsx.writeBuffer()));
}
portal.get('/exports/report', wrap(async (req, res) => {
    let t: any;
    try { t = jwt.verify(txt(req.query.ticket, 2000, true), ENV.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return fail(401, 'Tautan laporan sudah berakhir.'); }
    const u = (await query('SELECT * FROM users WHERE id=$1 AND is_active=true', [t.userId])).rows[0];
    if (t.purpose !== 'cash-report' || !u || !financeScope(u) || u.session_version !== t.sessionVersion)
        return fail(403, 'Laporan tidak dapat diakses.');
    const data = await cashReport(reportFilters(t.filters));
    await sendCashExcel(res, data.rows, 'laporan-kas-purimas.xlsx', data);
}));
portal.get('/exports/cash', wrap(async (req, res) => {
    let t: any;
    try { t = jwt.verify(txt(req.query.ticket, 1000, true), ENV.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return fail(401, 'Tautan unduhan berakhir.'); }
    if (t.purpose !== 'cash-export') return fail(403, 'Tautan tidak valid.');
    const u = (await query('SELECT * FROM users WHERE id=$1 AND is_active=true', [t.userId])).rows[0];
    if (!u || !['KETUA', 'BENDAHARA'].includes(u.role) || u.session_version !== t.sessionVersion)
        return fail(403, 'Akses unduhan ditolak.');
    const rows = (await query('SELECT c.date::text AS date,c.title,c.type,c.category,c.amount,c.receipt_code,a.original_name AS attachment_name FROM cash_transactions c LEFT JOIN private_attachments a ON a.id=c.attachment_id ORDER BY c.date,c.id')).rows;
    await sendCashExcel(res, rows, 'kas-purimas.xlsx');
}));
portal.get('/exports/residents', wrap(async (req, res) => {
    let ticket: any;
    try { ticket = jwt.verify(txt(req.query.ticket, 2000, true), ENV.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { return fail(401, 'Tautan unduhan sudah berakhir.'); }
    const user = (await query('SELECT * FROM users WHERE id=$1 AND is_active=true', [ticket.userId])).rows[0];
    if (ticket.purpose !== 'residents-export' || !user || user.role !== 'SEKRETARIS' || user.must_change_password || user.session_version !== ticket.sessionVersion)
        return fail(403, 'Unduhan data warga tidak dapat diakses.');
    const rows = (await query(`SELECT r.block_number,r.house_number,r.full_name AS head_name,r.kk_number,r.kk_address,r.kk_issue_date::text AS kk_issue_date,
        f.full_name,f.nik,f.gender,f.birth_place,f.birth_date::text AS birth_date,f.occupation,f.relationship,f.kk_details
        FROM residents r JOIN family_members f ON f.resident_id=r.id WHERE r.is_active=true
        ORDER BY r.block_number,r.house_number::int,CASE WHEN f.relationship='Kepala Keluarga' THEN 0 ELSE 1 END,f.full_name,f.id`)).rows;
    const book = new ExcelJS.Workbook(), sheet = book.addWorksheet('Data KK');
    sheet.columns = [
        {width:24},{width:15},{width:15},{width:23},{width:34},{width:28},{width:12},{width:12},{width:22},{width:22},{width:22},{width:22},{width:14},{width:19},
        {width:8},{width:34},{width:23},{width:16},{width:23},{width:18},{width:18},{width:26},{width:28},{width:19},{width:23},{width:22},{width:23},{width:19},{width:21},{width:21},{width:28},{width:28}
    ];
    const header=sheet.addRow(['Perumahan','Blok','Nomor Rumah','Nomor KK','Nama Kepala Keluarga','Alamat KK','RT','RW','Desa / Kelurahan','Kecamatan','Kabupaten / Kota','Provinsi','Kode Pos','Tanggal Terbit KK',
        'No.','Nama Lengkap','NIK','Jenis Kelamin','Tempat Lahir','Tanggal Lahir','Agama','Pendidikan','Jenis Pekerjaan','Golongan Darah','Status Perkawinan','Tanggal Perkawinan','Hubungan Dalam Keluarga','Kewarganegaraan','Nomor Paspor','Nomor KITAP','Nama Ayah','Nama Ibu']);
    header.font={bold:true,color:{argb:'FFFFFFFF'}};
    header.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFC7460D'}};
    header.alignment={vertical:'middle',wrapText:true};header.height=32;
    sheet.views=[{state:'frozen',ySplit:1,xSplit:3}];sheet.autoFilter={from:'A1',to:'AF1'};
    let lastHouse='',memberNumber=0;
    for (const r of rows) {
        const key=`${r.block_number}-${r.house_number}`;memberNumber=key===lastHouse?memberNumber+1:1;lastHouse=key;
        const a=r.kk_address || {},d=r.kk_details || {};
        const value=(v:any)=>v===undefined||v===null?'':String(v);
        const dateText=(v:any)=>!v?'':typeof v==='string'?v.slice(0,10):new Date(v).toISOString().slice(0,10);
        sheet.addRow(['Purimas Tirtajaya',value(r.block_number),value(r.house_number),value(r.kk_number),value(r.head_name),value(a.address),value(a.rt),value(a.rw),value(a.village),value(a.district),value(a.city),value(a.province),value(a.postalCode),dateText(r.kk_issue_date),memberNumber,
          value(r.full_name),value(r.nik),value(r.gender),value(r.birth_place),dateText(r.birth_date),value(d.religion),value(d.education),value(r.occupation),value(d.bloodType),value(d.maritalStatus),dateText(d.marriageDate),value(r.relationship),value(d.citizenship),value(d.passportNumber),value(d.stayPermitNumber),value(d.fatherName),value(d.motherName)]);
    }
    await audit({query},user,'EKSPOR_DATA_WARGA','DATA_WARGA','seluruh-rumah');
    res.set({'Content-Type':excelMime,'Content-Disposition':'attachment; filename="data-warga-purimas.xlsx"','Cache-Control':'private, no-store'});
    res.send(Buffer.from(await book.xlsx.writeBuffer()));
}));
portal.get('/files/:id', wrap(async (req, res) => {
    let t: any;
    try {
        t = jwt.verify(txt(req.query.ticket, 1000, true), ENV.JWT_SECRET, { algorithms: ['HS256'] });
    }
    catch {
        fail(401, 'Tautan berkas sudah tidak berlaku. Buka kembali melalui aplikasi.');
    }
    if (t.purpose !== 'attachment' || t.fileId !== req.params.id)
        fail(403, 'Tautan berkas tidak valid.');
    const u = (await query('SELECT * FROM users WHERE id=$1 AND is_active=true', [t.userId])).rows[0];
    if (!u || u.session_version !== t.sessionVersion)
        fail(401, 'Sesi berakhir.');
    const a = (await query('SELECT * FROM private_attachments WHERE id=$1', [uuid(req.params.id)])).rows[0];
    await attachmentAccess(u, a);
    res.set({ 'Content-Type': a.mime_type, 'Cache-Control': 'private, no-store', 'Content-Disposition': `attachment; filename="${a.kind}-${a.id}.${a.storage_name.split('.').pop()}"` });
    await sendStoredFile(res, a.storage_name);
}));
portal.use((req, res, next) => {
    (async () => {
        const auth = req.get('authorization');
        if (!auth?.startsWith('Bearer '))
            fail(401, 'Silakan masuk terlebih dahulu.');
        let decoded: any;
        try {
            decoded = jwt.verify(auth!.slice(7), ENV.JWT_SECRET, { algorithms: ['HS256'] });
        }
        catch {
            fail(401, 'Sesi berakhir. Silakan masuk kembali.');
        }
        const { rows } = await query(`SELECT u.*,r.full_name,r.block_number,r.house_number FROM users u JOIN residents r ON r.id=u.resident_id WHERE u.id=$1 AND u.is_active=true`, [decoded.id]);
        const u = rows[0];
        if (!u || !roles.includes(u.role) || decoded.purpose !== 'session' || decoded.sessionVersion !== u.session_version)
            fail(401, 'Sesi berakhir. Silakan masuk kembali.');
        res.locals.user = u;
        if (u.must_change_password && !['/auth/me','/auth/password','/auth/logout'].includes(req.path))
            return res.status(403).json({success:false,code:'PASSWORD_CHANGE_REQUIRED',message:'Ganti password awal sebelum menggunakan aplikasi.'});
        next();
    })().catch(next);
});
portal.get('/auth/me', wrap(async (_req, res) => res.json({ success: true, data: viewUser(res.locals.user), token: sign(res.locals.user) })));
portal.post('/auth/password', wrap(async (req, res) => {
    const u = res.locals.user;
    const current = txt(req.body.currentPassword, 128, true), password = txt(req.body.newPassword, 128, true);
    if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72)
        fail(400, 'Password baru minimal 12 karakter dan maksimal 72 byte.');
    if (/^(.)\1+$/.test(password) || /^(?:123456|password|purimas)/i.test(password))
        fail(400, 'Pilih password yang tidak mudah ditebak.');
    if (!await bcrypt.compare(current, u.password_hash))
        fail(400, 'Password saat ini salah.');
    if (password === current)
        fail(400, 'Gunakan password baru yang berbeda.');
    const { rows } = await query('UPDATE users SET password_hash=$1,must_change_password=false,session_version=session_version+1 WHERE id=$2 RETURNING *', [await bcrypt.hash(password, 12), u.id]);
    res.json({ success: true, token: sign(rows[0]), message: 'Password berhasil diubah.' });
}));
portal.post('/auth/logout', wrap(async (_req,res) => {
    const u=res.locals.user;
    await query('UPDATE users SET session_version=session_version+1 WHERE id=$1',[u.id]);
    ok(res,{},'Sesi berhasil diakhiri.');
}));
async function profile(id: number, c: any = { query }) {
    const r = await c.query('SELECT id,full_name,block_number,house_number,phone_number,nik,kk_number,kk_address,kk_issue_date::text AS kk_issue_date,occupancy_status,revision FROM residents WHERE id=$1', [id]);
    if (!r.rows.length)
        fail(404, 'Data rumah tidak ditemukan.');
    const [f, v, a] = await Promise.all([c.query('SELECT * FROM family_members WHERE resident_id=$1 ORDER BY full_name', [id]), c.query('SELECT * FROM vehicles WHERE resident_id=$1 ORDER BY plate_number', [id]), c.query(`SELECT a.id,a.kind,a.member_ref,a.original_name,a.mime_type,a.size_bytes,a.created_at FROM private_attachments a JOIN verified_attachments v ON v.attachment_id=a.id WHERE v.resident_id=$1 ORDER BY a.created_at`, [id])]);
    return { ...r.rows[0], family: f.rows, vehicles: v.rows, attachments: a.rows };
}
portal.get('/residents/me', wrap(async (_req, res) => ok(res, await profile(res.locals.user.resident_id))));
portal.get('/residents', allow('KETUA', 'SEKRETARIS', 'BENDAHARA'), wrap(async (_req, res) => { const finance = res.locals.user.role === 'BENDAHARA'; const { rows } = await query(finance ? 'SELECT id,full_name,block_number,house_number FROM residents ORDER BY block_number,house_number::int' : `SELECT r.id,r.full_name,r.block_number,r.house_number,r.phone_number,r.occupancy_status,u.role,(SELECT COUNT(*) FROM family_members f WHERE f.resident_id=r.id)::int AS family_members_count,(SELECT COUNT(*) FROM vehicles v WHERE v.resident_id=r.id)::int AS vehicle_count FROM residents r JOIN users u ON u.resident_id=r.id ORDER BY r.block_number,r.house_number::int`); ok(res, rows); }));
portal.post('/residents/export-link', allow('SEKRETARIS'), wrap(async (_req,res)=>{
    const u=res.locals.user;
    const ticket=jwt.sign({purpose:'residents-export',userId:u.id,sessionVersion:u.session_version},ENV.JWT_SECRET,{expiresIn:'2m'});
    ok(res,{url:`/api/exports/residents?ticket=${ticket}`});
}));
portal.get('/residents/:id', wrap(async (req, res) => {
    const id = num(req.params.id);
    if (!['KETUA', 'SEKRETARIS'].includes(res.locals.user.role) && id !== res.locals.user.resident_id)
        fail(403, 'Data pribadi hanya dapat diakses pemilik, ketua, dan sekretaris.');
    ok(res, await profile(id));
}));
function cleanProfile(p: any) {
    if (!p || typeof p !== 'object')
        fail(400, 'Data perubahan wajib diisi.');
    const family = p.family, vehicles = p.vehicles;
    if (!Array.isArray(family) || family.length > 30 || !Array.isArray(vehicles) || vehicles.length > 30)
        fail(400, 'Data keluarga atau kendaraan tidak valid.');
    const ids = new Set<string>();
    const makeId = (v: any) => {
        const id = v ? uuid(v) : randomUUID();
        if (ids.has(id))
            fail(400, 'Identitas anggota atau kendaraan ganda.');
        ids.add(id);
        return id;
    };
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    if (p.kkIssueDate && day(p.kkIssueDate)! > today) fail(400, 'Tanggal terbit KK tidak boleh di masa depan.');
    for (const f of family) { if ((f.birthDate && day(f.birthDate)! > today) || (f.marriageDate && day(f.marriageDate)! > today)) fail(400, 'Tanggal lahir atau perkawinan tidak boleh di masa depan.'); }
    const phone = txt(p.phoneNumber, 30);
    if (phone && !/^\+?[0-9 ()-]{8,30}$/.test(phone))
        fail(400, 'Nomor telepon tidak valid.');
    return { fullName: txt(p.fullName, 150, true), phoneNumber: phone, nik: nik(p.nik), kkNumber: nik(p.kkNumber), kkIssueDate: p.kkIssueDate === undefined ? undefined : day(p.kkIssueDate, true), kkAddress: { address:txt(p.kkAddress?.address,300), rt:txt(p.kkAddress?.rt,10), rw:txt(p.kkAddress?.rw,10), village:txt(p.kkAddress?.village,100), district:txt(p.kkAddress?.district,100), city:txt(p.kkAddress?.city,100), province:txt(p.kkAddress?.province,100), postalCode:txt(p.kkAddress?.postalCode,10) }, occupancyStatus: ['Pemilik Tetap', 'Pengontrak / Penyewa'].includes(p.occupancyStatus) ? p.occupancyStatus : fail(400, 'Pilih status hunian.'), family: family.map((f: any) => ({ id: makeId(f.id), fullName: txt(f.fullName, 150, true), nik: nik(f.nik), relationship: txt(f.relationship, 50, true), gender: txt(f.gender, 30), birthPlace: txt(f.birthPlace, 100), birthDate: day(f.birthDate, true), occupation: txt(f.occupation, 100), religion: txt(f.religion, 60), education: txt(f.education, 100), maritalStatus: txt(f.maritalStatus, 50), marriageDate: day(f.marriageDate, true), citizenship: txt(f.citizenship, 60), passportNumber: txt(f.passportNumber, 50), stayPermitNumber: txt(f.stayPermitNumber, 50), fatherName: txt(f.fatherName, 150), motherName: txt(f.motherName, 150), bloodType: txt(f.bloodType, 10) })), vehicles: vehicles.map((v: any) => ({ id: makeId(v.id), plateNumber: txt(v.plateNumber, 20, true).toUpperCase(), vehicleType: txt(v.vehicleType, 50, true), brand: txt(v.brand, 100), color: txt(v.color, 50) })) };
}
async function saveResidentProfile(c: any, residentId: number, p: any) {
await c.query('UPDATE residents SET full_name=$1,phone_number=$2,nik=$3,occupancy_status=$4,family_members_count=$5,vehicle_count=$6,revision=revision+1,updated_at=NOW(),kk_number=COALESCE($8,kk_number),kk_address=COALESCE($9,kk_address),kk_issue_date=CASE WHEN $11::boolean THEN $10::date ELSE kk_issue_date END WHERE id=$7', [p.fullName, p.phoneNumber || null, p.nik, p.occupancyStatus, p.family.length, p.vehicles.length, residentId, p.kkNumber ?? null, p.kkAddress ? JSON.stringify(p.kkAddress) : null, p.kkIssueDate ?? null, p.kkIssueDate !== undefined]);
const existingFamily = await c.query('SELECT id,kk_details FROM family_members WHERE resident_id=$1', [residentId]);
const oldDetails = new Map(existingFamily.rows.map((row: any) => [row.id, row.kk_details]));
await c.query('DELETE FROM family_members WHERE resident_id=$1', [residentId]);
await c.query('DELETE FROM vehicles WHERE resident_id=$1', [residentId]);
for (const f of p.family)
    await c.query('INSERT INTO family_members(id,resident_id,full_name,nik,relationship,gender,birth_place,birth_date,occupation,kk_details) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [f.id, residentId, f.fullName, f.nik, f.relationship, f.gender, f.birthPlace, f.birthDate, f.occupation, JSON.stringify(f.religion === undefined ? (oldDetails.get(f.id) || {}) : { religion:f.religion || '', education:f.education || '', maritalStatus:f.maritalStatus || '', marriageDate:f.marriageDate || null, citizenship:f.citizenship || '', passportNumber:f.passportNumber || '', stayPermitNumber:f.stayPermitNumber || '', fatherName:f.fatherName || '', motherName:f.motherName || '', bloodType:f.bloodType || '' })]);
for (const v of p.vehicles)
    await c.query('INSERT INTO vehicles(id,resident_id,plate_number,vehicle_type,brand,color) VALUES($1,$2,$3,$4,$5,$6)', [v.id, residentId, v.plateNumber, v.vehicleType, v.brand, v.color]);
}
portal.post('/residents/:id/profile', allow('SEKRETARIS'), wrap(async (req, res) => {
    const residentId = num(req.params.id), u = res.locals.user, p = cleanProfile(req.body.payload);
    const revision = num(req.body.baseRevision, 0);
    if (!Array.isArray(req.body.attachmentIds) || req.body.attachmentIds.length > 40) fail(400, 'Daftar lampiran tidak valid.');
    const ids = [...new Set<string>(req.body.attachmentIds.map(uuid))];
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        const current = await c.query('SELECT revision FROM residents WHERE id=$1 FOR UPDATE', [residentId]);
        if (!current.rows.length) fail(404, 'Data rumah tidak ditemukan.');
        if (current.rows[0].revision !== revision) fail(409, 'Data sudah berubah. Muat ulang sebelum menyimpan.');
        if ((await c.query("SELECT 1 FROM submissions WHERE resident_id=$1 AND type='PERUBAHAN_DATA' AND status='MENUNGGU'", [residentId])).rowCount)
            fail(409, 'Ada perubahan data warga yang menunggu verifikasi. Periksa pengajuan tersebut terlebih dahulu.');
        if (ids.length) {
            const attachments = await c.query('SELECT id,member_ref,kind FROM private_attachments WHERE id=ANY($1::uuid[]) AND resident_id=$2', [ids, residentId]);
            if (attachments.rowCount !== ids.length || attachments.rows.some((a: any) => !['KTP','KK'].includes(a.kind))) fail(403, 'Lampiran tidak sesuai dengan rumah ini.');
            const familyIds = new Set(p.family.map((f: any) => f.id));
            if (attachments.rows.some((a: any) => a.member_ref && !familyIds.has(a.member_ref))) fail(400, 'Lampiran KTP harus terkait anggota keluarga yang tersimpan.');
        }
        await saveResidentProfile(c, residentId, p);
        await c.query('DELETE FROM verified_attachments WHERE resident_id=$1', [residentId]);
        for (const id of ids) await c.query('INSERT INTO verified_attachments(resident_id,attachment_id) VALUES($1,$2)', [residentId, id]);
        await audit(c, u, 'UBAH', 'DATA_WARGA', residentId);
        await c.query('COMMIT');
        ok(res, { id: residentId }, 'Data warga berhasil disimpan.');
    } catch (e) { await c.query('ROLLBACK'); throw e; }
    finally { c.release(); }
}));
portal.post('/submissions', wrap(async (req, res) => {
    const u = res.locals.user, type = txt(req.body.type, 30, true);
    if (!['PERUBAHAN_DATA', 'ADMINISTRASI'].includes(type))
        fail(400, 'Jenis pengajuan tidak valid.');
    const data = type === 'PERUBAHAN_DATA' ? cleanProfile(req.body.payload) : { category: txt(req.body.payload?.category, 100, true), purpose: txt(req.body.payload?.purpose, 4000, true) };
    const retryOf = req.body.retryOf == null ? null : num(req.body.retryOf);
    const title = type === 'PERUBAHAN_DATA' ? 'Perubahan data keluarga' : txt(req.body.title, 200, true);
    if (!Array.isArray(req.body.attachmentIds) || req.body.attachmentIds.length > 40)
        fail(400, 'Daftar lampiran tidak valid.');
    const ids = [...new Set<string>(req.body.attachmentIds.map(uuid))];
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        const r = await c.query('SELECT revision FROM residents WHERE id=$1 FOR UPDATE', [u.resident_id]);
        if (retryOf !== null) {
            const previous=(await c.query('SELECT * FROM submissions WHERE id=$1',[retryOf])).rows[0];
            if (!previous || previous.resident_id!==u.resident_id || previous.submitted_by!==u.id) fail(403,'Pengajuan ini bukan milik Anda.');
            if (type!=='PERUBAHAN_DATA' || previous.type!==type || previous.status!=='DITOLAK') fail(409,'Hanya perubahan data yang ditolak dapat diperbaiki dan diajukan lagi.');
            if ((await c.query('SELECT 1 FROM submissions WHERE retry_of=$1',[retryOf])).rowCount) fail(409,'Usulan ini sudah diajukan kembali. Buka pengajuan terbarunya.');
        }
        if (type === 'PERUBAHAN_DATA' && num(req.body.baseRevision, 0) !== r.rows[0].revision)
            fail(409, 'Data sudah berubah. Muat ulang sebelum mengajukan.');
        if (ids.length) {
            const a = await c.query('SELECT id,member_ref,kind FROM private_attachments WHERE id=ANY($1::uuid[]) AND resident_id=$2', [ids, u.resident_id]);
            if (a.rows.some((x: any) => !['KTP','KK'].includes(x.kind)))
                fail(400, 'Hanya lampiran KTP atau KK yang dapat disertakan dalam pengajuan identitas.');
            if (a.rowCount !== ids.length)
                fail(403, 'Lampiran bukan milik rumah Anda.');
            if (type === 'PERUBAHAN_DATA') {
                const familyIds = new Set((data as any).family.map((f: any) => f.id));
                if (a.rows.some((x: any) => x.member_ref && !familyIds.has(x.member_ref)))
                    fail(400, 'Lampiran KTP harus terkait anggota keluarga yang diajukan.');
            }
        }
        const baseline = type==='PERUBAHAN_DATA' ? await profile(u.resident_id,c) : null;
        const insert = await c.query('INSERT INTO submissions(resident_id,submitted_by,type,title,payload,base_revision,base_profile,retry_of) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [u.resident_id, u.id, type, title, JSON.stringify(data), r.rows[0].revision, baseline ? JSON.stringify(baseline) : null, retryOf]);
        for (const id of ids)
            await c.query('INSERT INTO submission_files VALUES($1,$2)', [insert.rows[0].id, id]);
        await audit(c, u, 'AJUKAN', type, insert.rows[0].id);
        await c.query('COMMIT');
        ok(res, insert.rows[0], 'Pengajuan dikirim ke sekretaris.');
    }
    catch (e: any) {
        await c.query('ROLLBACK');
        if (e.code === '23505')
            fail(409, 'Masih ada perubahan data yang menunggu verifikasi.');
        throw e;
    }
    finally {
        c.release();
    }
}));
portal.get('/submissions', wrap(async (_req, res) => { const u = res.locals.user, review = ['KETUA', 'SEKRETARIS'].includes(u.role); const { rows } = await query(`SELECT s.id,s.resident_id,s.submitted_by,s.type,s.title,s.payload,s.base_revision,s.status,s.reviewer_id,s.review_note,s.reviewed_at,s.created_at,s.retry_of,(SELECT child.id FROM submissions child WHERE child.retry_of=s.id ORDER BY child.id DESC LIMIT 1) AS resubmitted_id,r.full_name,r.block_number,r.house_number,reviewer.username AS reviewer_name FROM submissions s JOIN residents r ON r.id=s.resident_id LEFT JOIN users reviewer ON reviewer.id=s.reviewer_id ${review ? '' : 'WHERE s.resident_id=$1'} ORDER BY s.created_at DESC`, review ? [] : [u.resident_id]); ok(res, rows); }));
portal.get('/submissions/:id', wrap(async (req, res) => {
    const u = res.locals.user;
    const { rows } = await query('SELECT * FROM submissions WHERE id=$1', [num(req.params.id)]);
    const s = rows[0];
    if (!s)
        fail(404, 'Pengajuan tidak ditemukan.');
    if (!['KETUA', 'SEKRETARIS'].includes(u.role) && s.resident_id !== u.resident_id)
        fail(403, 'Pengajuan tidak dapat diakses.');
    const attachments = await query('SELECT a.id,a.kind,a.member_ref,a.original_name,a.mime_type,a.size_bytes FROM private_attachments a JOIN submission_files f ON f.attachment_id=a.id WHERE f.submission_id=$1', [s.id]);
    const currentProfile=await profile(s.resident_id);
    const baseline=s.base_profile || (currentProfile.revision===s.base_revision ? currentProfile : null);
    const resubmittedId=(await query('SELECT id FROM submissions WHERE retry_of=$1 ORDER BY id DESC LIMIT 1',[s.id])).rows[0]?.id || null;
    const canRetry=s.type==='PERUBAHAN_DATA' && s.status==='DITOLAK' && s.submitted_by===u.id && !resubmittedId;
    const retryDraft=canRetry ? (baseline ? reapplyProfile(baseline,s.payload,currentProfile,attachments.rows) : {payload:null,attachments:currentProfile.attachments}) : null;
    const {base_profile: _baseline,...view}=s;
    ok(res, { ...view,currentProfile,attachments:attachments.rows,changes:s.type==='PERUBAHAN_DATA' && baseline ? profileChanges(baseline,s.payload,attachments.rows) : null,canRetry,resubmitted_id:resubmittedId,retryDraft,baselineUnavailable:!baseline,profileChanged:currentProfile.revision!==s.base_revision });
}));
portal.post('/submissions/:id/review', allow('SEKRETARIS'), wrap(async (req, res) => {
    const u = res.locals.user, status = txt(req.body.status, 20, true), note = txt(req.body.reviewNote, 4000, true);
    if (!['DISETUJUI', 'DITOLAK'].includes(status))
        fail(400, 'Keputusan tidak valid.');
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        const r = await c.query('SELECT * FROM submissions WHERE id=$1 FOR UPDATE', [num(req.params.id)]), s = r.rows[0];
        if (!s)
            fail(404, 'Pengajuan tidak ditemukan.');
        if (s.status !== 'MENUNGGU')
            fail(409, 'Pengajuan sudah diproses.');
        if (status === 'DISETUJUI' && s.type === 'PERUBAHAN_DATA') {
            const p = s.payload;
            const current = await c.query('SELECT revision FROM residents WHERE id=$1 FOR UPDATE', [s.resident_id]);
            if (current.rows[0].revision !== s.base_revision)
                fail(409, 'Data telah berubah. Tolak pengajuan ini dan minta warga mengirim ulang.');
            await saveResidentProfile(c, s.resident_id, p);
            await c.query('DELETE FROM verified_attachments WHERE resident_id=$1', [s.resident_id]);
            await c.query('INSERT INTO verified_attachments SELECT $1,attachment_id FROM submission_files WHERE submission_id=$2', [s.resident_id, s.id]);
        }
        if (status === 'DISETUJUI' && s.type === 'ADMINISTRASI') {
            const content = txt(req.body.contentBody, 12000, true), fileNumber = txt(req.body.fileNumber, 100, true);
            await c.query('INSERT INTO documents(title,category,file_number,description,content_body,resident_id,submission_id) VALUES($1,$2,$3,$4,$5,$6,$7)', [s.title, s.payload.category, fileNumber, note, content, s.resident_id, s.id]);
        }
        await c.query('UPDATE submissions SET status=$1,reviewer_id=$2,review_note=$3,reviewed_at=NOW() WHERE id=$4', [status, u.id, note, s.id]);
        await audit(c, u, status, s.type, s.id);
        await c.query('COMMIT');
        ok(res, { id: s.id, status }, 'Keputusan verifikasi disimpan.');
    }
    catch (e) {
        await c.query('ROLLBACK');
        throw e;
    }
    finally {
        c.release();
    }
}));
portal.post('/attachments', express.raw({ type: ['image/jpeg', 'image/png', 'application/pdf'], limit: '8mb' }), wrap(async (req, res) => {
    const u = res.locals.user, bytes = req.body;
    if (!Buffer.isBuffer(bytes) || !bytes.length)
        fail(400, 'Pilih berkas JPG, PNG, atau PDF maksimal 8 MB.');
    const kind = txt(req.get('x-file-kind'), 10, true);
    if (!['KTP', 'KK', 'BUKTI', 'KAS'].includes(kind))
        fail(400, 'Pilih jenis berkas yang sesuai.');
    if (kind === 'KAS' && u.role !== 'BENDAHARA') fail(403, 'Hanya bendahara dapat mengunggah bukti transaksi kas.');
    const targetHeader = req.get('x-resident-id');
    if (targetHeader && (u.role !== 'SEKRETARIS' || !['KTP','KK'].includes(kind))) fail(403, 'Tidak dapat mengunggah berkas untuk rumah lain.');
    const residentId = targetHeader ? num(targetHeader) : u.resident_id;
    if (targetHeader && !(await query('SELECT 1 FROM residents WHERE id=$1', [residentId])).rowCount) fail(404, 'Data rumah tidak ditemukan.');
    const memberRef = req.get('x-member-ref') ? uuid(req.get('x-member-ref')) : null;
    const mime = req.get('content-type')?.split(';')[0];
    if (kind === 'KAS' && (!['image/jpeg','application/pdf'].includes(mime || '') || memberRef)) fail(400, 'Bukti transaksi kas harus JPG atau PDF tanpa kaitan anggota keluarga.');
    const valid = mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : mime === 'application/pdf' ? bytes.subarray(0, 5).toString() === '%PDF-' : false;
    if (!valid)
        fail(400, 'Isi berkas tidak sesuai jenis berkas.');
    let original;
    try {
        original = decodeURIComponent(req.get('x-file-name') || 'dokumen');
    }
    catch {
        fail(400, 'Nama berkas tidak valid.');
    }
    const id = randomUUID(), name = id + (mime === 'image/jpeg' ? '.jpg' : mime === 'image/png' ? '.png' : '.pdf');
    await saveFile(name, bytes, mime!);
    try {
        await query('INSERT INTO private_attachments(id,resident_id,uploaded_by,kind,member_ref,original_name,storage_name,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, residentId, u.id, kind, memberRef, path.basename(txt(original, 200, true)), name, mime, bytes.length]);
        ok(res, { id, kind, member_ref: memberRef, original_name: original, mime_type: mime, size_bytes: bytes.length }, 'Berkas berhasil diunggah.');
    }
    catch (e) {
        await removeFile(name).catch(() => { });
        throw e;
    }
}));
portal.post('/attachments/:id/link', wrap(async (req, res) => { const u = res.locals.user; const a = (await query('SELECT * FROM private_attachments WHERE id=$1', [uuid(req.params.id)])).rows[0]; await attachmentAccess(u, a); await audit({ query }, u, 'LIHAT_BERKAS', 'LAMPIRAN', a.id); const ticket = jwt.sign({ purpose: 'attachment', fileId: a.id, userId: u.id, sessionVersion: u.session_version }, ENV.JWT_SECRET, { expiresIn: '2m' }); ok(res, { url: `/api/files/${a.id}?ticket=${ticket}`, mimeType: a.mime_type }); }));
portal.get('/attachments/:id', wrap(async (req, res) => {
    const u = res.locals.user;
    const { rows } = await query('SELECT * FROM private_attachments WHERE id=$1', [uuid(req.params.id)]);
    const a = rows[0];
    if (!a)
        fail(404, 'Berkas tidak ditemukan.');
    await attachmentAccess(u, a);
    await audit({ query }, u, 'LIHAT_BERKAS', 'LAMPIRAN', a.id);
    res.set({ 'Content-Type': a.mime_type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': `attachment; filename="${a.kind}-${a.id}.${a.storage_name.split('.').pop()}"` });
    await sendStoredFile(res, a.storage_name);
}));
portal.post('/cash/export-link', allow('KETUA', 'BENDAHARA'), wrap(async (_req, res) => { const u = res.locals.user; const ticket = jwt.sign({ purpose: 'cash-export', userId: u.id, sessionVersion: u.session_version }, ENV.JWT_SECRET, { expiresIn: '2m' }); ok(res, { url: `/api/exports/cash?ticket=${ticket}` }); }));
portal.get('/cash', allow('KETUA', 'BENDAHARA'), wrap(async (_req, res) => ok(res, (await query('SELECT c.*,a.original_name AS attachment_name FROM cash_transactions c LEFT JOIN private_attachments a ON a.id=c.attachment_id ORDER BY c.date DESC,c.id DESC')).rows)));
portal.get('/cash/summary', allow('KETUA', 'BENDAHARA'), wrap(async (_req, res) => ok(res, await cashSummary())));
async function cashSummary() { const { rows } = await query(`SELECT COALESCE(SUM(amount) FILTER(WHERE type='MASUK'),0)::text AS income,COALESCE(SUM(amount) FILTER(WHERE type='KELUAR'),0)::text AS expense,MAX(date)::text AS as_of FROM cash_transactions`); const setting = await query("SELECT value FROM portal_settings WHERE key='finance_initialized'"); const initialized = setting.rows[0]?.value === true; return { totalIncome: Number(rows[0].income), totalExpense: Number(rows[0].expense), currentBalance: initialized ? Number(rows[0].income) - Number(rows[0].expense) : null, asOf: rows[0].as_of, initialized }; }
async function cashEvidence(c: any, attachmentId: string, actor: any) {
    const file=(await c.query('SELECT * FROM private_attachments WHERE id=$1 FOR UPDATE',[attachmentId])).rows[0];
    if (!file || file.kind!=='KAS' || file.uploaded_by!==actor.id) fail(403,'Gunakan bukti transaksi kas yang Anda unggah sendiri.');
    if (!['image/jpeg','application/pdf'].includes(file.mime_type)) fail(400,'Bukti transaksi kas harus JPG atau PDF.');
    return file;
}
function isDuesCash(row: any) { return row.bill_id != null || row.category.trim().toLowerCase()==='iuran warga'; }
portal.post('/cash', allow('BENDAHARA'), wrap(async (req, res) => {
    const u=res.locals.user,type=txt(req.body.type,10,true),category=txt(req.body.category,100,true);
    if (!['MASUK','KELUAR'].includes(type)) fail(400,'Jenis kas harus MASUK atau KELUAR.');
    if (isDuesCash({category})) fail(400,'Catat iuran warga melalui menu Pembayaran agar tagihan dan kas tetap sesuai.');
    if (!(await cashSummary()).initialized) fail(409,'Tetapkan saldo awal terlebih dahulu.');
    if (!req.body.attachmentId) fail(400,'Unggah bukti transaksi JPG atau PDF terlebih dahulu.');
    const attachmentId=uuid(req.body.attachmentId),amount=num(req.body.amount),title=txt(req.body.title,200,true),description=txt(req.body.description,4000),transactionDate=day(req.body.date);
    const c=await pool.connect();
    try {
        await c.query('BEGIN');
        await cashEvidence(c,attachmentId,u);
        if ((await c.query('SELECT 1 FROM cash_transactions WHERE attachment_id=$1',[attachmentId])).rowCount) fail(409,'Bukti ini sudah dipakai pada transaksi kas. Muat ulang Buku Kas sebelum mencoba lagi.');
        const result=await c.query(`INSERT INTO cash_transactions(type,category,amount,title,description,date,month_year,recorded_by,attachment_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[type,category,amount,title,description,transactionDate,new Date(transactionDate!+'T12:00:00Z').toLocaleDateString('id-ID',{month:'long',year:'numeric'}),u.username,attachmentId]);
        await audit(c,u,'CATAT_KAS','KAS',result.rows[0].id);
        await audit(c,u,'LAMPIRKAN_BUKTI_KAS','LAMPIRAN_KAS',`${result.rows[0].id}:${attachmentId}`);
        await c.query('COMMIT');
        ok(res,result.rows[0],'Transaksi kas dan bukti berhasil disimpan.');
    } catch (err) { await c.query('ROLLBACK'); throw err; }
    finally { c.release(); }
}));
portal.post('/cash/:id/proof', allow('BENDAHARA'), wrap(async (req,res)=>{
    const id=num(req.params.id,1,2147483647),attachmentId=uuid(req.body.attachmentId),u=res.locals.user,c=await pool.connect();
    try {
        await c.query('BEGIN');
        const row=(await c.query('SELECT * FROM cash_transactions WHERE id=$1 FOR UPDATE',[id])).rows[0];
        if (!row) fail(404,'Transaksi kas tidak ditemukan.');
        if (isDuesCash(row)) fail(400,'Bukti iuran warga dikelola melalui menu Pembayaran.');
        await cashEvidence(c,attachmentId,u);
        if ((await c.query('SELECT 1 FROM cash_transactions WHERE attachment_id=$1 AND id<>$2',[attachmentId,id])).rowCount) fail(409,'Bukti ini sudah digunakan oleh transaksi kas lain.');
        if (row.attachment_id!==attachmentId) {
            await c.query('UPDATE cash_transactions SET attachment_id=$1 WHERE id=$2',[attachmentId,id]);
            await audit(c,u,row.attachment_id?'GANTI_BUKTI_KAS':'TAMBAH_BUKTI_KAS','KAS',id);
            await audit(c,u,'LAMPIRKAN_BUKTI_KAS','LAMPIRAN_KAS',`${id}:${attachmentId}`);
        }
        await c.query('COMMIT');ok(res,{id,attachment_id:attachmentId},'Bukti transaksi berhasil disimpan. Nominal kas tetap.');
    } catch (err) { await c.query('ROLLBACK'); throw err; }
    finally { c.release(); }
}));
portal.post('/cash/opening-balance', allow('BENDAHARA'), wrap(async (req, res) => {
    const u = res.locals.user, amount = num(req.body.amount, 0), asOf = day(req.body.date), reference = txt(req.body.reference, 100, true);
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        await c.query("SELECT pg_advisory_xact_lock(13003)");
        const done = await c.query("SELECT value FROM portal_settings WHERE key='finance_initialized'");
        if (done.rows[0]?.value === true)
            fail(409, 'Saldo awal telah ditetapkan. Koreksi dicatat sebagai transaksi kas.');
        const existing = await c.query('SELECT 1 FROM cash_transactions LIMIT 1');
        if (existing.rows.length)
            fail(409, 'Sudah ada transaksi kas. Rekonsiliasi transaksi sebelum menetapkan saldo awal.');
        if (amount > 0)
            await c.query(`INSERT INTO cash_transactions(type,category,amount,title,description,date,month_year,recorded_by,receipt_code) VALUES('MASUK','Saldo Awal',$1,'Saldo awal terverifikasi',$2,$3,$4,$5,$6)`, [amount, txt(req.body.description, 4000), asOf, new Date(asOf! + 'T12:00:00Z').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), u.username, reference]);
        await c.query("INSERT INTO portal_settings(key,value) VALUES('finance_initialized','true') ON CONFLICT(key) DO UPDATE SET value='true'");
        await c.query("INSERT INTO portal_settings(key,value) VALUES('finance_as_of',$1) ON CONFLICT(key) DO UPDATE SET value=$1", [JSON.stringify(asOf)]);
        await audit(c, u, 'TETAPKAN_SALDO_AWAL', 'KAS', asOf);
        await c.query('COMMIT');
        ok(res, { amount, date: asOf }, 'Saldo awal disimpan berdasarkan data yang diverifikasi.');
    }
    catch (e) {
        await c.query('ROLLBACK');
        throw e;
    }
    finally {
        c.release();
    }
}));
function financeScope(u: any) { return ['KETUA', 'BENDAHARA'].includes(u.role); }
portal.get('/bills', wrap(async (_req, res) => {
    const u = res.locals.user;
    ok(res, (await query('SELECT bills.*,(SELECT i.payment_request_id FROM payment_request_items i WHERE i.bill_id=bills.id AND i.active LIMIT 1) AS pending_payment_id FROM bills ' + (financeScope(u) ? '' : 'WHERE resident_id=$1 ') + 'ORDER BY year DESC,month_index DESC,resident_id', financeScope(u) ? [] : [u.resident_id])).rows);
}));
async function reminderDay() {
    const row = (await query("SELECT value FROM portal_settings WHERE key='iuran_due_day'")).rows[0];
    const day = Number(row?.value);
    return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}
function billDueDate(b: any, fallback: number | null): string | null {
    const raw = String(b.due_date || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const parsed = new Date(raw + 'T00:00:00Z');
        return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw ? raw : null;
    }
    const dayOfMonth = /^\d{1,2}$/.test(raw) ? Number(raw) : raw ? null : fallback;
    if (!dayOfMonth || dayOfMonth > 31 || b.month_index < 1 || b.month_index > 12) return null;
    const lastDay = new Date(Date.UTC(b.year, b.month_index, 0)).getUTCDate();
    return `${b.year}-${String(b.month_index).padStart(2,'0')}-${String(Math.min(dayOfMonth,lastDay)).padStart(2,'0')}`;
}
portal.get('/bills/reminder-settings', allow('BENDAHARA'), wrap(async (_req,res) => ok(res,{dueDay:await reminderDay()})));
portal.post('/bills/reminder-settings', allow('BENDAHARA'), wrap(async (req,res) => {
    const dueDay = num(req.body.dueDay,1,31);
    await query("INSERT INTO portal_settings(key,value) VALUES('iuran_due_day',$1) ON CONFLICT(key) DO UPDATE SET value=$1",[JSON.stringify(dueDay)]);
    await audit({query},res.locals.user,'ATUR_JATUH_TEMPO','PENGATURAN','iuran_due_day');
    ok(res,{dueDay},'Tanggal jatuh tempo disimpan.');
}));
portal.get('/bills/reminders', allow('BENDAHARA'), wrap(async (_req,res) => {
    const dueDay = await reminderDay();
    const today = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
    const bills = (await query(`SELECT b.id,b.resident_id,b.year,b.month_index,b.month_name,b.amount,b.due_date,r.full_name,r.block_number,r.house_number,r.phone_number,
      (SELECT i.payment_request_id FROM payment_request_items i WHERE i.bill_id=b.id AND i.active LIMIT 1) AS pending_payment_id
      FROM bills b JOIN residents r ON r.id=b.resident_id WHERE b.status<>'LUNAS' AND r.is_active=true ORDER BY b.year,b.month_index,b.id`)).rows;
    const houses = new Map<number,any>();
    let unknownDueCount = 0, pendingCount = 0;
    for (const b of bills) {
        const dueDate = billDueDate(b,dueDay);
        if (!dueDate) { unknownDueCount++; continue; }
        if (dueDate >= today) continue;
        if (b.pending_payment_id) { pendingCount++; continue; }
        let h = houses.get(b.resident_id);
        if (!h) { h={residentId:b.resident_id,fullName:b.full_name,blockNumber:b.block_number,houseNumber:b.house_number,phoneNumber:b.phone_number,amount:0,bills:[]}; houses.set(b.resident_id,h); }
        h.amount += Number(b.amount); h.bills.push({id:b.id,monthName:b.month_name,amount:Number(b.amount),dueDate});
    }
    const rows=[...houses.values()].sort((a,b)=>`${a.blockNumber} ${a.houseNumber}`.localeCompare(`${b.blockNumber} ${b.houseNumber}`,'id',{numeric:true}));
    ok(res,{dueDay,today,unknownDueCount,pendingCount,rows,amount:rows.reduce((sum,h)=>sum+h.amount,0),account:await paymentSettings()});
}));
portal.get('/payment-notifications', allow('BENDAHARA'), wrap(async (_req,res) => {
    const row=(await query("SELECT COUNT(*)::int AS pending,COALESCE(MAX(id),0)::text AS latest FROM payment_requests WHERE status='MENUNGGU'")).rows[0];
    ok(res,{pending:row.pending,latest:Number(row.latest)});
}));
portal.post('/bills/generate-year', allow('BENDAHARA'), wrap(async (req, res) => {
    const year = num(req.body.year, 2020, 2200), amount = num(req.body.amount);
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        let generatedCount = 0;
        for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
            const monthName = new Date(Date.UTC(year, monthIndex - 1, 1)).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            const r = await c.query(`INSERT INTO bills(resident_id,resident_name,house_unit,month_name,month_index,year,amount,status,bank_name) SELECT id,COALESCE(NULLIF(full_name,''),block_number||' No. '||house_number),block_number||' No. '||house_number,$1,$2,$3,$4,'BELUM_BAYAR','' FROM residents WHERE is_active=true ON CONFLICT(resident_id,year,month_index) DO NOTHING RETURNING id`, [monthName, monthIndex, year, amount]);
            generatedCount += r.rowCount || 0;
        }
        await audit(c, res.locals.user, 'BUAT_TAGIHAN_TAHUNAN', 'TAHUN', year);
        await c.query('COMMIT');
        ok(res, { generatedCount }, `${generatedCount} tagihan baru untuk tahun ${year} dibuat. Tagihan yang sudah ada tetap dipertahankan.`);
    } catch (e) { await c.query('ROLLBACK'); throw e; }
    finally { c.release(); }
}));
portal.post('/bills/generate-monthly', allow('BENDAHARA'), wrap(async (req, res) => {
    const monthIndex = num(req.body.monthIndex, 1, 12), year = num(req.body.year, 2020, 2200), amount = num(req.body.amount);
    const monthName = new Date(year, monthIndex - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        const r = await c.query(`INSERT INTO bills(resident_id,resident_name,house_unit,month_name,month_index,year,amount,status,bank_name) SELECT id,COALESCE(NULLIF(full_name,''),block_number||' No. '||house_number),block_number||' No. '||house_number,$1,$2,$3,$4,'BELUM_BAYAR','' FROM residents WHERE is_active=true ON CONFLICT(resident_id,year,month_index) DO NOTHING RETURNING id`, [monthName, monthIndex, year, amount]);
        await audit(c, res.locals.user, 'BUAT_TAGIHAN', 'BULAN', `${year}-${monthIndex}`);
        await c.query('COMMIT');
        ok(res, { generatedCount: r.rowCount }, `${r.rowCount} tagihan dibuat.`);
    }
    catch (e) {
        await c.query('ROLLBACK');
        throw e;
    }
    finally {
        c.release();
    }
}));
async function recordManualPayment(u: any, body: any, legacyId?: number) {
    const ids = legacyId ? [legacyId] : body.billIds ?? [], future = legacyId ? [] : body.futureMonths ?? [];
    if (!Array.isArray(ids) || !Array.isArray(future) || (!ids.length && !future.length) || ids.length + future.length > 36 || future.length > 12)
        fail(400, 'Pilih 1–36 bulan iuran.');
    const billIds = [...new Set<number>(ids.map((v: any) => num(v)))].sort((a,b)=>a-b);
    if (billIds.length !== ids.length) fail(400, 'Tagihan tidak boleh dipilih dua kali.');
    const futureMonths = future.map((v:any)=>{
        const year=num(v.year,2020,2200), monthIndex=num(v.monthIndex,1,12), amount=num(v.amount);
        const month=upcomingMonths().find(m=>m.year===year && m.monthIndex===monthIndex);
        if (!month) return fail(400,'Pilih bulan dalam 12 bulan mendatang.');
        return {...month,amount};
    });
    if (new Set(futureMonths.map((m:any)=>`${m.year}-${m.monthIndex}`)).size !== futureMonths.length) fail(400,'Bulan iuran tidak boleh dipilih dua kali.');
    const paidDate=day(legacyId ? body.paidAt : body.paidDate), reference=txt(legacyId ? body.transactionRef : body.reference,100,true);
    if (paidDate! > new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'})) fail(400,'Tanggal pembayaran tidak boleh di masa depan.');
    let channel=txt(legacyId ? body.paymentChannel : body.channel,50,true);
    if (channel==='Tunai') channel='TUNAI';
    if (channel==='Transfer Bank') channel='TRANSFER';
    if (!['TUNAI','TRANSFER'].includes(channel)) fail(400,'Pilih metode pembayaran.');
    const c=await pool.connect();
    try {
        await c.query('BEGIN');
        let residentId = legacyId ? null : num(body.residentId);
        if (legacyId) {
            const initial=(await c.query('SELECT resident_id FROM bills WHERE id=$1',[legacyId])).rows[0];
            if (!initial) fail(404,'Tagihan tidak ditemukan.');
            residentId=initial.resident_id;
        }
        let rate: number | null = null;
        if (futureMonths.length) {
            const rateRow=(await c.query("SELECT value FROM portal_settings WHERE key='advance_monthly_rate' FOR SHARE")).rows[0];
            rate=Number(rateRow?.value);
            if (!Number.isSafeInteger(rate) || rate!<1 || futureMonths.some((m:any)=>m.amount!==rate)) fail(409,'Nominal iuran di muka telah berubah. Muat ulang pilihan pembayaran.');
        }
        const resident=(await c.query('SELECT * FROM residents WHERE id=$1 AND is_active=true FOR NO KEY UPDATE',[residentId])).rows[0];
        if (!resident) fail(404,'Data rumah tidak ditemukan.');
        if (!(await c.query("SELECT value FROM portal_settings WHERE key='finance_initialized'")).rows[0]?.value) fail(409,'Tetapkan saldo awal sebelum mencatat pembayaran.');
        for (const m of futureMonths) {
            const result=await c.query(`INSERT INTO bills(resident_id,resident_name,house_unit,month_name,month_index,year,amount,status,bank_name) VALUES($1,$2,$3,$4,$5,$6,$7,'BELUM_BAYAR','') ON CONFLICT(resident_id,year,month_index) DO NOTHING RETURNING id`,[residentId,resident.full_name || `${resident.block_number} No. ${resident.house_number}`,`${resident.block_number} No. ${resident.house_number}`,m.monthName,m.monthIndex,m.year,rate]);
            if (!result.rowCount) fail(409,'Tagihan bulan tersebut sudah diterbitkan. Muat ulang pilihan pembayaran.');
            billIds.push(result.rows[0].id);
        }
        billIds.sort((a,b)=>a-b);
        const bills=(await c.query('SELECT * FROM bills WHERE id=ANY($1::int[]) ORDER BY id FOR UPDATE',[billIds])).rows;
        if (bills.length!==billIds.length || bills.some((b:any)=>b.resident_id!==residentId)) fail(403,'Tagihan harus milik rumah yang dipilih.');
        if (bills.some((b:any)=>b.status==='LUNAS')) fail(409,'Sebagian tagihan sudah lunas.');
        if ((await c.query('SELECT 1 FROM payment_request_items WHERE bill_id=ANY($1::int[]) AND active LIMIT 1',[billIds])).rows.length) fail(409,'Ada konfirmasi warga yang menunggu. Periksa terlebih dahulu melalui menu Pembayaran.');
        const amount=bills.reduce((sum:number,b:any)=>sum+Number(b.amount),0);
        const payment=(await c.query(`INSERT INTO payment_requests(resident_id,submitted_by,amount,channel,paid_date,reference,status,note,reviewed_by,reviewed_at) VALUES($1,$2,$3,$4,$5,$6,'DISETUJUI','Pembayaran dicatat langsung oleh bendahara.',$2,NOW()) RETURNING id`,[residentId,u.id,amount,channel,paidDate,reference])).rows[0];
        for (const b of bills) {
            await c.query('INSERT INTO payment_request_items(payment_request_id,bill_id,active) VALUES($1,$2,false)',[payment.id,b.id]);
            await c.query("UPDATE bills SET status='LUNAS',paid_at=$1,payment_channel=$2,transaction_ref=$3 WHERE id=$4",[paidDate,channel,reference,b.id]);
            await c.query("INSERT INTO cash_transactions(type,category,amount,title,description,date,month_year,recorded_by,receipt_code,bill_id) VALUES('MASUK','Iuran Warga',$1,$2,$3,$4,$5,$6,$7,$8)",[b.amount,`Iuran ${b.month_name} - ${b.house_unit}`,`Pencatatan manual ${channel} #${payment.id}`,paidDate,b.month_name,u.username,reference,b.id]);
        }
        await audit(c,u,'CATAT_PEMBAYARAN_MANUAL','PEMBAYARAN',payment.id);
        await c.query('COMMIT');
        return {id:payment.id,amount,months:bills.length};
    } catch(e) { await c.query('ROLLBACK'); throw e; }
    finally { c.release(); }
}
portal.post('/bills/:id/pay', allow('BENDAHARA'), wrap(async (req,res)=>{
    const result=await recordManualPayment(res.locals.user,req.body,num(req.params.id));
    ok(res,result,'Pembayaran dan penerimaan kas tercatat.');
}));
portal.post('/payments/manual', allow('BENDAHARA'), wrap(async (req,res)=>{
    const result=await recordManualPayment(res.locals.user,req.body);
    ok(res,result,'Pembayaran manual dan penerimaan kas tercatat.');
}));
portal.post('/bills/import', allow('BENDAHARA'), wrap(async (req, res) => {
    const items = req.body.rows;
    if (!Array.isArray(items) || !items.length || items.length > 2000)
        fail(400, 'Impor harus berisi 1–2000 baris.');
    const normalized = items.map((r: any) => {
        const username = txt(r.username, 100, true).toLowerCase();
        if (!/^blok_[ab](?:[1-9]|1[0-3])$/.test(username))
            fail(400, 'Username rumah tidak valid.');
        if (!['LUNAS', 'BELUM_BAYAR'].includes(r.status))
            fail(400, 'Status iuran harus LUNAS atau BELUM_BAYAR.');
        return { username, year: num(r.year, 2020, 2200), month: num(r.month, 1, 12), amount: num(r.amount), status: r.status, paidAt: r.status === 'LUNAS' ? day(r.paidAt, true) : null, reference: txt(r.reference, 100, r.status === 'LUNAS') };
    });
    const keys = new Set(normalized.map((r: any) => `${r.username}:${r.year}:${r.month}`));
    if (keys.size !== items.length)
        fail(400, 'Ada baris tagihan ganda dalam berkas.');
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        await c.query('SELECT pg_advisory_xact_lock(13004)');
        for (const r of normalized) {
            const resident = (await c.query('SELECT r.* FROM residents r JOIN users u ON u.resident_id=r.id WHERE u.username=$1', [r.username])).rows[0];
            if (!resident)
                fail(400, `Akun ${r.username} tidak ditemukan.`);
            const existing = await c.query('SELECT id FROM bills WHERE resident_id=$1 AND year=$2 AND month_index=$3', [resident.id, r.year, r.month]);
            if (existing.rows.length)
                fail(409, `Tagihan ${r.username} bulan ${r.month}/${r.year} sudah ada. Tidak ada data yang diubah.`);
            const name = new Date(r.year, r.month - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            await c.query(`INSERT INTO bills(resident_id,resident_name,house_unit,month_name,month_index,year,amount,status,paid_at,transaction_ref,payment_channel,bank_name) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'')`, [resident.id, resident.full_name || `${resident.block_number} No. ${resident.house_number}`, `${resident.block_number} No. ${resident.house_number}`, name, r.month, r.year, r.amount, r.status, r.paidAt, r.reference, r.status === 'LUNAS' ? 'Impor riwayat terverifikasi' : null]);
        }
        await audit(c, res.locals.user, 'IMPOR_RIWAYAT_IURAN', 'TAGIHAN', items.length);
        await c.query('COMMIT');
        ok(res, { imported: items.length }, 'Riwayat iuran diimpor. Saldo kas tidak berubah.');
    }
    catch (e) {
        await c.query('ROLLBACK');
        throw e;
    }
    finally {
        c.release();
    }
}));
portal.get('/documents', wrap(async (_req, res) => { const u = res.locals.user, all = ['KETUA', 'SEKRETARIS'].includes(u.role); ok(res, (await query('SELECT * FROM documents ' + (all ? '' : 'WHERE resident_id=$1 ') + 'ORDER BY issue_date DESC,id DESC', all ? [] : [u.resident_id])).rows); }));
portal.get('/announcements', wrap(async (_req, res) => ok(res, (await query('SELECT * FROM announcements ORDER BY is_pinned DESC,created_at DESC')).rows)));
portal.post('/announcements', allow('KETUA'), wrap(async (req, res) => { const r = await query('INSERT INTO announcements(title,content,category,author,is_pinned) VALUES($1,$2,$3,$4,$5) RETURNING *', [txt(req.body.title, 255, true), txt(req.body.content, 8000, true), txt(req.body.category, 50, true), res.locals.user.username, req.body.isPinned === true]); ok(res, r.rows[0], 'Pengumuman diterbitkan.'); }));
async function paymentSettings() { return (await query("SELECT value FROM portal_settings WHERE key='payment_account'")).rows[0]?.value || null; }
portal.get('/payment-settings', wrap(async (_req, res) => ok(res, await paymentSettings())));
portal.post('/payment-settings', allow('BENDAHARA'), wrap(async (req, res) => { const data = { bankName: txt(req.body.bankName, 100, true), accountNumber: txt(req.body.accountNumber, 40, true), accountName: txt(req.body.accountName, 150, true) }; if (!/^\d[\d -]{4,39}$/.test(data.accountNumber))
    fail(400, 'Nomor rekening tidak valid.'); await query("INSERT INTO portal_settings(key,value) VALUES('payment_account',$1) ON CONFLICT(key) DO UPDATE SET value=$1", [JSON.stringify(data)]); await audit({ query }, res.locals.user, 'ATUR_REKENING', 'PENGATURAN', 'payment_account'); ok(res, data, 'Rekening penerima disimpan.'); }));
async function transparency() { const cash = await cashSummary(); const categories = (await query("SELECT category,SUM(amount)::text AS amount FROM cash_transactions WHERE type='KELUAR' GROUP BY category ORDER BY SUM(amount) DESC")).rows; return { cash, categories }; }
portal.get('/transparency', wrap(async (_req, res) => ok(res, await transparency())));
function upcomingMonths() {
    const today = new Date().toLocaleDateString('en-CA', { timeZone:'Asia/Jakarta' });
    const [year,month] = today.split('-').map(Number);
    return Array.from({length:12},(_,i) => {
        const d = new Date(Date.UTC(year,month+i,1));
        return { year:d.getUTCFullYear(), monthIndex:d.getUTCMonth()+1, monthName:d.toLocaleDateString('id-ID',{month:'long',year:'numeric',timeZone:'UTC'}) };
    });
}
async function advanceRate(c: any = {query}) {
    const row=(await c.query("SELECT value FROM portal_settings WHERE key='advance_monthly_rate'")).rows[0];
    const amount=Number(row?.value);
    return Number.isSafeInteger(amount) && amount>0 && amount<=1e12 ? amount : null;
}
portal.get('/bills/advance-settings', allow('BENDAHARA'), wrap(async (_req,res)=>ok(res,{amount:await advanceRate()})));
portal.post('/bills/advance-settings', allow('BENDAHARA'), wrap(async (req,res)=>{
    const amount=num(req.body.amount);
    await query("INSERT INTO portal_settings(key,value) VALUES('advance_monthly_rate',$1) ON CONFLICT(key) DO UPDATE SET value=$1",[JSON.stringify(amount)]);
    await audit({query},res.locals.user,'ATUR_IURAN_DIMUKA','PENGATURAN','advance_monthly_rate');
    ok(res,{amount},'Nominal iuran di muka disimpan.');
}));
portal.get('/bills/advance-options', allow('WARGA','SEKRETARIS','KETUA','BENDAHARA'), wrap(async (req,res)=>{
    const amount=await advanceRate();
    const u=res.locals.user;
    const requested=req.query.residentId ? num(req.query.residentId) : u.resident_id;
    if (requested!==u.resident_id && u.role!=='BENDAHARA') fail(403,'Hanya bendahara dapat melihat pilihan rumah lain.');
    if (!(await query('SELECT 1 FROM residents WHERE id=$1 AND is_active=true',[requested])).rowCount) fail(404,'Data rumah tidak ditemukan.');
    const existing=(await query('SELECT year,month_index FROM bills WHERE resident_id=$1',[requested])).rows;
    const occupied=new Set(existing.map(r=>`${r.year}-${r.month_index}`));
    const months=amount ? upcomingMonths().filter(m=>!occupied.has(`${m.year}-${m.monthIndex}`)).map(m=>({...m,amount})) : [];
    ok(res,{amount,months});
}));
portal.get('/payments', allow('KETUA', 'BENDAHARA', 'WARGA', 'SEKRETARIS'), wrap(async (_req, res) => { const u = res.locals.user; const scope = financeScope(u) ? '' : 'WHERE p.resident_id=$1'; const rows = (await query(`SELECT p.*,r.block_number,r.house_number,r.full_name,COALESCE(json_agg(json_build_object('id',b.id,'month_name',b.month_name,'amount',b.amount) ORDER BY b.year,b.month_index) FILTER(WHERE b.id IS NOT NULL),'[]') AS bills FROM payment_requests p JOIN residents r ON r.id=p.resident_id LEFT JOIN payment_request_items i ON i.payment_request_id=p.id LEFT JOIN bills b ON b.id=i.bill_id ${scope} GROUP BY p.id,r.id ORDER BY p.created_at DESC`, financeScope(u) ? [] : [u.resident_id])).rows; ok(res, rows); }));
portal.post('/payments', allow('WARGA', 'SEKRETARIS', 'KETUA', 'BENDAHARA'), wrap(async (req, res) => { const u = res.locals.user; const ids = req.body.billIds ?? [], future = req.body.futureMonths ?? []; if (!Array.isArray(ids) || !Array.isArray(future) || !ids.length && !future.length || ids.length + future.length > 36 || future.length > 12)
    fail(400, 'Pilih 1–36 bulan iuran.'); const billIds = [...new Set<number>(ids.map((v: any) => num(v)))].sort((a, b) => a - b);
    const options = upcomingMonths(); const futureMonths = future.map((v:any) => { const year=num(v.year,2020,2200), monthIndex=num(v.monthIndex,1,12), amount=num(v.amount); const match=options.find(m=>m.year===year && m.monthIndex===monthIndex); if (!match) return fail(400,'Pilih bulan dalam 12 bulan mendatang.'); return {...match,amount}; });
    if (new Set(futureMonths.map((m:any)=>`${m.year}-${m.monthIndex}`)).size !== futureMonths.length) fail(400,'Bulan iuran tidak boleh dipilih dua kali.'); const channel = txt(req.body.channel, 20, true), paidDate = day(req.body.paidDate), reference = txt(req.body.reference, 100); if (!['TRANSFER', 'TUNAI'].includes(channel))
    fail(400, 'Pilih metode pembayaran.'); if (paidDate! > new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
    fail(400, 'Tanggal pembayaran tidak boleh di masa depan.'); const attachmentId = req.body.attachmentId ? uuid(req.body.attachmentId) : null; if (channel === 'TRANSFER' && (!attachmentId || !await paymentSettings()))
    fail(400, 'Transfer memerlukan rekening tujuan resmi dan bukti pembayaran.'); const c = await pool.connect(); try {
    await c.query('BEGIN');
    if (futureMonths.length) {
        const rateRow=(await c.query("SELECT value FROM portal_settings WHERE key='advance_monthly_rate' FOR SHARE")).rows[0];
        const rate=Number(rateRow?.value);
        if (!Number.isSafeInteger(rate) || rate < 1 || futureMonths.some((m:any)=>m.amount!==rate)) fail(409,'Nominal iuran di muka telah berubah. Muat ulang pilihan pembayaran.');
        const resident=(await c.query('SELECT * FROM residents WHERE id=$1 AND is_active=true FOR NO KEY UPDATE',[u.resident_id])).rows[0];
        if (!resident) fail(404,'Data rumah tidak ditemukan.');
        for (const m of futureMonths) {
            const result=await c.query(`INSERT INTO bills(resident_id,resident_name,house_unit,month_name,month_index,year,amount,status,bank_name) VALUES($1,$2,$3,$4,$5,$6,$7,'BELUM_BAYAR','') ON CONFLICT(resident_id,year,month_index) DO NOTHING RETURNING id`,[u.resident_id,resident.full_name || `${resident.block_number} No. ${resident.house_number}`,`${resident.block_number} No. ${resident.house_number}`,m.monthName,m.monthIndex,m.year,rate]);
            if (!result.rowCount) fail(409,'Tagihan bulan tersebut sudah diterbitkan. Muat ulang pilihan pembayaran.');
            billIds.push(result.rows[0].id);
        }
        billIds.sort((a,b)=>a-b);
    }
    const bills = (await c.query('SELECT * FROM bills WHERE id=ANY($1::int[]) ORDER BY id FOR UPDATE', [billIds])).rows;
    if (bills.length !== billIds.length || bills.some(b => b.resident_id !== u.resident_id))
        fail(403, 'Hanya tagihan rumah Anda yang dapat dibayar.');
    if (bills.some(b => b.status === 'LUNAS'))
        fail(409, 'Sebagian tagihan sudah lunas.');
    if ((await c.query('SELECT 1 FROM payment_request_items WHERE bill_id=ANY($1::int[]) AND active LIMIT 1', [billIds])).rows.length)
        fail(409, 'Tagihan ini masih menunggu konfirmasi bendahara.');
    if (attachmentId) {
        const a = (await c.query('SELECT * FROM private_attachments WHERE id=$1', [attachmentId])).rows[0];
        if (!a || a.resident_id !== u.resident_id || a.kind !== 'BUKTI')
            fail(403, 'Bukti pembayaran bukan milik Anda.');
    }
    const amount = bills.reduce((s, b) => s + Number(b.amount), 0);
    const p = (await c.query('INSERT INTO payment_requests(resident_id,submitted_by,amount,channel,paid_date,reference,attachment_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *', [u.resident_id, u.id, amount, channel, paidDate, reference, attachmentId])).rows[0];
    for (const id of billIds)
        await c.query('INSERT INTO payment_request_items(payment_request_id,bill_id) VALUES($1,$2)', [p.id, id]);
    await audit(c, u, 'AJUKAN_PEMBAYARAN', 'PEMBAYARAN', p.id);
    await c.query('COMMIT');
    ok(res, p, 'Konfirmasi dikirim. Bendahara akan memeriksa pembayaran Anda.');
}
catch (e: any) {
    await c.query('ROLLBACK');
    if (e.code === '23505')
        fail(409, 'Tagihan ini masih menunggu konfirmasi bendahara.');
    throw e;
}
finally {
    c.release();
} }));
portal.post('/payments/:id/review', allow('BENDAHARA'), wrap(async (req, res) => { const u = res.locals.user, status = txt(req.body.status, 20, true), note = txt(req.body.note, 2000, status === 'DITOLAK'); if (!['DISETUJUI', 'DITOLAK'].includes(status))
    fail(400, 'Keputusan tidak valid.'); const c = await pool.connect(); try {
    await c.query('BEGIN');
    const p = (await c.query('SELECT * FROM payment_requests WHERE id=$1 FOR UPDATE', [num(req.params.id)])).rows[0];
    if (!p)
        fail(404, 'Pembayaran tidak ditemukan.');
    if (p.status !== 'MENUNGGU')
        fail(409, 'Pembayaran sudah diperiksa.');
    const bills = (await c.query('SELECT b.* FROM bills b JOIN payment_request_items i ON i.bill_id=b.id WHERE i.payment_request_id=$1 ORDER BY b.id FOR UPDATE OF b', [p.id])).rows;
    if (status === 'DISETUJUI') {
        if (!(await c.query("SELECT value FROM portal_settings WHERE key='finance_initialized'")).rows[0]?.value)
            fail(409, 'Saldo awal belum ditetapkan.');
        if (bills.some(b => b.status === 'LUNAS'))
            fail(409, 'Tagihan sudah dibayar. Tolak konfirmasi ini agar tidak mencatat dua kali.');
        for (const b of bills) {
            const ref = p.reference || `PAY-${p.id}`;
            await c.query("UPDATE bills SET status='LUNAS',paid_at=$1,payment_channel=$2,transaction_ref=$3 WHERE id=$4", [p.paid_date, p.channel, ref, b.id]);
            await c.query("INSERT INTO cash_transactions(type,category,amount,title,description,date,month_year,recorded_by,receipt_code,bill_id) VALUES('MASUK','Iuran Warga',$1,$2,$3,$4,$5,$6,$7,$8)", [b.amount, `Iuran ${b.month_name} - ${b.house_unit}`, `Konfirmasi ${p.channel} #${p.id}`, p.paid_date, b.month_name, u.username, ref, b.id]);
        }
    }
    await c.query('UPDATE payment_requests SET status=$1,note=$2,reviewed_by=$3,reviewed_at=NOW() WHERE id=$4', [status, note, u.id, p.id]);
    await c.query('UPDATE payment_request_items SET active=false WHERE payment_request_id=$1', [p.id]);
    await audit(c, u, status, 'PEMBAYARAN', p.id);
    await c.query('COMMIT');
    ok(res, { id: p.id, status }, status === 'DISETUJUI' ? 'Pembayaran disetujui. Iuran dan saldo kas diperbarui.' : 'Pembayaran ditolak. Warga dapat mengirim ulang.');
}
catch (e) {
    await c.query('ROLLBACK');
    throw e;
}
finally {
    c.release();
} }));
function reportFilters(body: any) { const from = day(body.from), to = day(body.to); if (from! > to! || Date.parse(to!) - Date.parse(from!) > 3660 * 86400000)
    fail(400, 'Rentang tanggal laporan tidak valid.'); const type = txt(body.type, 10); if (type && !['MASUK', 'KELUAR'].includes(type))
    fail(400, 'Jenis transaksi tidak valid.'); return { from, to, type }; }
async function cashReport(filters: any) {
    const { from, to, type } = filters;
    // One database snapshot keeps opening balance and period movements consistent.
    const rows = (await query('SELECT c.*,c.date::text AS date,a.original_name AS attachment_name FROM cash_transactions c LEFT JOIN private_attachments a ON a.id=c.attachment_id WHERE c.date<=$1 ORDER BY c.date,c.id', [to])).rows;
    const opening = rows.filter(r => r.date < from).reduce((sum, r) => sum + (r.type === 'MASUK' ? 1 : -1) * Number(r.amount), 0);
    const period = rows.filter(r => r.date >= from);
    const income = period.filter(r => r.type === 'MASUK').reduce((sum, r) => sum + Number(r.amount), 0);
    const expense = period.filter(r => r.type === 'KELUAR').reduce((sum, r) => sum + Number(r.amount), 0);
    return { period: filters, summary: { opening, income, expense, closing: opening + income - expense }, rows: period.filter(r => !type || r.type === type) };
}
portal.get('/reports/cash', allow('KETUA', 'BENDAHARA'), wrap(async (req, res) => ok(res, await cashReport(reportFilters(req.query)))));
portal.post('/reports/cash/export-link', allow('KETUA', 'BENDAHARA'), wrap(async (req, res) => { const u = res.locals.user, filters = reportFilters(req.body); const ticket = jwt.sign({ purpose: 'cash-report', userId: u.id, sessionVersion: u.session_version, filters }, ENV.JWT_SECRET, { expiresIn: '2m' }); ok(res, { url: `/api/exports/report?ticket=${ticket}` }); }));
async function demographics() {
    // Only verified family_members count as people; residents represent houses.
    const { rows } = await query(`SELECT f.gender, f.birth_date, f.kk_details, r.block_number,
      CASE WHEN f.birth_date IS NOT NULL AND f.birth_date <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date
        THEN EXTRACT(YEAR FROM age((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date, f.birth_date))::int END AS age
      FROM family_members f JOIN residents r ON r.id=f.resident_id WHERE r.is_active=true`);
    const houses = await query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE EXISTS(SELECT 1 FROM family_members f WHERE f.resident_id=r.id))::int AS completed FROM residents r WHERE is_active=true`);
    const counts = (values: string[]) => Object.entries(values.reduce((a: Record<string, number>, value) => { const key=value?.trim() || 'Belum diisi'; a[key]=(a[key]||0)+1; return a; }, {})).map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count || a.label.localeCompare(b.label));
    const gender = counts(rows.map(r=>r.gender));
    const ageGroups = ['0–5','6–17','18–59','60+','Belum diisi'].map(label=>({label,count:rows.filter(r=>r.age==null?label==='Belum diisi':r.age<=5?label==='0–5':r.age<=17?label==='6–17':r.age<=59?label==='18–59':label==='60+').length}));
    return { total: rows.length, houses: houses.rows[0].total, completedHouses: houses.rows[0].completed, gender, ageGroups, education:counts(rows.map(r=>r.kk_details?.education)), occupation:counts((await query("SELECT f.occupation FROM family_members f JOIN residents r ON r.id=f.resident_id WHERE r.is_active=true")).rows.map(r=>r.occupation)), asOf: new Date().toISOString() };
}
portal.get('/demographics', wrap(async (_req,res)=>ok(res,await demographics())));
portal.get('/dashboard', wrap(async (_req, res) => { const u = res.locals.user; const data: any = await transparency(); data.demographics = await demographics(); data.announcements = (await query('SELECT * FROM announcements ORDER BY is_pinned DESC,created_at DESC LIMIT 3')).rows; data.profile = await profile(u.resident_id); data.paymentPending = Number((await query("SELECT count(*) FROM payment_requests WHERE status='MENUNGGU'" + (financeScope(u) ? '' : ' AND resident_id=$1'), financeScope(u) ? [] : [u.resident_id])).rows[0].count); const all = financeScope(u), scope = all ? '' : 'WHERE resident_id=$1'; data.bills = (await query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE status='LUNAS')::int AS paid,COUNT(*) FILTER(WHERE status<>'LUNAS')::int AS unpaid,COALESCE(SUM(amount) FILTER(WHERE status='LUNAS'),0)::text AS "amountPaid",COALESCE(SUM(amount) FILTER(WHERE status<>'LUNAS'),0)::text AS overdue FROM bills ${scope}`, all ? [] : [u.resident_id])).rows[0]; data.bills.rate = data.bills.total ? Math.round(data.bills.paid / data.bills.total * 1000) / 10 : 0; data.submissions = (await query("SELECT COUNT(*) FILTER(WHERE status='MENUNGGU')::int AS pending,COUNT(*) FILTER(WHERE status='DISETUJUI')::int AS approved,COUNT(*) FILTER(WHERE status='DITOLAK')::int AS rejected FROM submissions" + (['KETUA', 'SEKRETARIS'].includes(u.role) ? '' : ' WHERE resident_id=$1'), ['KETUA', 'SEKRETARIS'].includes(u.role) ? [] : [u.resident_id])).rows[0]; if (all)
    data.households = Number((await query('SELECT count(*) FROM residents')).rows[0].count); ok(res, data); }));
portal.get('/users', allow('KETUA', 'SEKRETARIS'), wrap(async (_req, res) => ok(res, (await query("SELECT u.id,u.username,u.role,u.is_active,u.must_change_password,r.full_name,r.block_number,r.house_number FROM users u JOIN residents r ON r.id=u.resident_id WHERE ($1='KETUA' OR u.role='WARGA') ORDER BY r.block_number,r.house_number::int", [res.locals.user.role])).rows)));
portal.post('/users/:id/reset-password', allow('KETUA', 'SEKRETARIS'), wrap(async (req, res) => {
    const id = num(req.params.id), actor = res.locals.user;
    const passwordHash = await bcrypt.hash('purimas', 12);
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        const target = (await c.query('SELECT id,username,role,is_active FROM users WHERE id=$1 FOR UPDATE', [id])).rows[0];
        if (!target) fail(404, 'Akun warga tidak ditemukan.');
        if (target.role !== 'WARGA') fail(403, 'Reset ini hanya untuk akun warga.');
        if (!target.is_active) fail(400, 'Akun warga sedang nonaktif.');
        await c.query('UPDATE users SET password_hash=$1,must_change_password=true,session_version=session_version+1 WHERE id=$2', [passwordHash, id]);
        await c.query('DELETE FROM security_login_attempts WHERE account_digest=$1', [createHash('sha256').update(target.username).digest('hex')]);
        await audit(c, actor, 'RESET_PASSWORD', 'USER', id);
        await c.query('COMMIT');
        ok(res, { id, username: target.username, mustChangePassword: true }, 'Password warga direset ke purimas. Warga perlu membuat password pribadi saat masuk kembali.');
    } catch (err) {
        await c.query('ROLLBACK');
        throw err;
    } finally { c.release(); }
}));
portal.get('/audit', allow('KETUA'), wrap(async (_req, res) => ok(res, (await query('SELECT e.*,u.username FROM audit_events e LEFT JOIN users u ON u.id=e.actor_id ORDER BY e.id DESC LIMIT 200')).rows)));
portal.use((_req, _res, next) => next(new HttpError(404, 'Layanan tidak ditemukan.')));
portal.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || (err.code === '23505' ? 409 : err.code === '23503' ? 400 : 500);
    const message = err.code === '23505' ? 'Data sudah digunakan. Periksa kembali data yang dimasukkan.' : err.code === '23503' ? 'Data terkait tidak ditemukan.' : status >= 500 ? 'Layanan sedang mengalami gangguan. Silakan coba kembali.' : err.message || 'Permintaan tidak valid.';
    if (status >= 500)
        console.error('Portal request failed:', err.code || err.name);
    res.status(status).json({ success: false, message });
});
