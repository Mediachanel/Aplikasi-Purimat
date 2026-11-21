// =============================================================================
// Penyimpanan berkas privat (KTP, KK, bukti bayar, bukti kas).
// - GOOGLE_DRIVE_FOLDER_ID diisi: berkas disimpan di subfolder Drive "berkas-privat"
//   dengan nama = storage_name (uuid.ext), tidak dibagikan ke siapa pun.
// - Tidak diisi / DB_MODE=memory|file: berkas disimpan di disk (UPLOAD_DIR), seperti semula.
// =============================================================================
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { Response } from 'express';
import { ENV } from '../config/env.js';
import { google } from '../config/google.js';

const localDir = process.env.UPLOAD_DIR || '/app/storage';
const useDrive = () => ENV.DB_MODE === 'sheets' && Boolean(ENV.GOOGLE_DRIVE_FOLDER_ID);
const SUBFOLDER = 'berkas-privat';
let folderId: Promise<string> | null = null;

function privateFolder(): Promise<string> {
  if (!folderId) {
    folderId = (async () => {
      const { drive } = google();
      const q = `name='${SUBFOLDER}' and mimeType='application/vnd.google-apps.folder' and '${ENV.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`;
      const found = await drive.files.list({ q, fields: 'files(id)', supportsAllDrives: true, includeItemsFromAllDrives: true });
      if (found.data.files?.[0]?.id) return found.data.files[0].id;
      const created = await drive.files.create({
        supportsAllDrives: true,
        fields: 'id',
        requestBody: { name: SUBFOLDER, mimeType: 'application/vnd.google-apps.folder', parents: [ENV.GOOGLE_DRIVE_FOLDER_ID] }
      });
      return created.data.id!;
    })().catch((e) => {
      folderId = null;
      throw e;
    });
  }
  return folderId;
}

async function findDriveFile(name: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|pdf)$/i.test(name)) return null;
  const { drive } = google();
  const res = await drive.files.list({
    q: `name='${name}' and '${await privateFolder()}' in parents and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });
  return res.data.files?.[0]?.id ?? null;
}

/** Simpan berkas baru. Gagal bila nama sudah ada (setara flag 'wx'). */
export async function saveFile(name: string, bytes: Buffer, mime: string): Promise<void> {
  if (!useDrive()) {
    await fs.mkdir(localDir, { recursive: true, mode: 0o700 });
    await fs.writeFile(path.join(localDir, name), bytes, { mode: 0o600, flag: 'wx' });
    return;
  }
  if (await findDriveFile(name)) throw new Error('Berkas dengan nama yang sama sudah ada.');
  await google().drive.files.create({
    supportsAllDrives: true,
    fields: 'id',
    requestBody: { name, parents: [await privateFolder()], mimeType: mime },
    media: { mimeType: mime, body: Readable.from([bytes]) }
  });
}

export async function removeFile(name: string): Promise<void> {
  if (!useDrive()) {
    await fs.unlink(path.join(localDir, name));
    return;
  }
  const id = await findDriveFile(name);
  if (id) await google().drive.files.delete({ fileId: id, supportsAllDrives: true });
}

/** Kirim isi berkas ke respons HTTP (header sudah diatur pemanggil). */
export async function sendStoredFile(res: Response, name: string): Promise<void> {
  if (!useDrive()) {
    res.sendFile(path.join(localDir, name));
    return;
  }
  const id = await findDriveFile(name);
  if (!id) {
    res.status(404).json({ success: false, message: 'Berkas tidak ditemukan di penyimpanan.' });
    return;
  }
  const r = await google().drive.files.get({ fileId: id, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' });
  await new Promise<void>((resolve, reject) => {
    (r.data as unknown as Readable).on('error', reject).pipe(res).on('finish', resolve).on('error', reject);
  });
}
