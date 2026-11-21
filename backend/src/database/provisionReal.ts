import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
// Explicit one-time operation, never executed automatically on startup.
// The production database must be backed up before --replace-demo is used.
const replaceDemo = process.argv.includes('--replace-demo');
const c = await pool.connect();
try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(130013)');
    if ((await c.query("SELECT 1 FROM portal_settings WHERE key='households_provisioned'")).rows.length)
        throw Error('Households already provisioned; refusing to reset data.');
    const users = (await c.query('SELECT username FROM users')).rows.map(r => r.username).sort();
    const count = Number((await c.query('SELECT COUNT(*) FROM residents')).rows[0].count);
    if (count || users.length) {
        if (!replaceDemo || count !== 5 || JSON.stringify(users) !== JSON.stringify(['bendahara_rt', 'ketua_rt', 'sri_wahyuni']))
            throw Error('Existing data differs from known demo. Review before provisioning.');
        const expected = ['Bpk. Hendra Gunawan', 'Ibu Sri Wahyuni', 'Bpk. Bambang Sutrisno', 'Bpk. Rizky Ramadhan', 'Bpk. Agung Prasetyo'];
        const names = (await c.query('SELECT full_name FROM residents ORDER BY id')).rows.map(r => r.full_name);
        if (JSON.stringify(names) !== JSON.stringify(expected))
            throw Error('Resident records differ from demo. Refusing to replace.');
        await c.query('TRUNCATE audit_events,submission_files,verified_attachments,submissions,private_attachments,family_members,vehicles,forum_comments,forum_posts,facility_bookings,announcements,documents,cash_transactions,bills,users,residents RESTART IDENTITY CASCADE');
    }
    const hash = await bcrypt.hash('purimas', 12);
    for (const block of ['A', 'B'])
        for (let n = 1; n <= (block === 'A' ? 13 : 11); n++) {
            const username = `blok_${block.toLowerCase()}${n}`;
            const role = username === 'blok_a8' ? 'KETUA' : username === 'blok_b10' ? 'SEKRETARIS' : username === 'blok_b1' ? 'BENDAHARA' : 'WARGA';
            const r = await c.query("INSERT INTO residents(full_name,block_number,house_number,phone_number,encrypted_nik,occupancy_status,family_members_count,vehicle_count,role) VALUES('',$1,$2,NULL,'','',0,0,$3) RETURNING id", [`Blok ${block}`, String(n), role]);
            await c.query('INSERT INTO users(resident_id,username,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,true)', [r.rows[0].id, username, hash, role]);
        }
    await c.query("INSERT INTO portal_settings VALUES('households_provisioned','true'),('finance_initialized','false')");
    await c.query('COMMIT');
    console.log('24 household accounts provisioned; no personal identities, bills or balances fabricated.');
}
catch (e) {
    await c.query('ROLLBACK');
    throw e;
}
finally {
    c.release();
    await pool.end();
}
