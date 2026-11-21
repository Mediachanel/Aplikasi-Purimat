// =============================================================================
// Tata letak tab spreadsheet agar mudah dibaca manusia (khususnya data KK).
// Hanya mengubah TAMPILAN di Google Sheets; struktur tabel database tidak berubah.
//
// Jenis kolom:
//   column  : kolom tabel apa adanya (label bebas)
//   json    : satu kunci dari kolom JSON dipecah menjadi kolom sendiri
//   derived : kolom bantu hasil hitung (mis. nomor rumah); hanya ditampilkan, diabaikan saat dimuat
// format 'dmy' menampilkan tanggal sebagai DD-MM-YYYY seperti di KK.
// =============================================================================
export type LayoutEntry =
  | { label: string; column: string; format?: 'dmy' }
  | { label: string; json: string; key: string; format?: 'dmy' }
  | { label: string; derived: string };

export interface TableLayout {
  /** Daftar kolom lengkap (kolom tabel yang tidak disebut otomatis ditambahkan di akhir). */
  entries?: LayoutEntry[];
  /** Pecah kolom JSON menjadi beberapa kolom, di posisi kolom aslinya. */
  expandJson?: Record<string, { label: string; key: string; format?: 'dmy' }[]>;
  /** Urutan baris (alias tabel: t). */
  orderBy?: string;
  /** Lebarkan kolom otomatis setelah ditulis. */
  autoResize?: boolean;
}

const familyOrder = `CASE t.relationship WHEN 'Kepala Keluarga' THEN 0 WHEN 'Suami' THEN 1 WHEN 'Istri' THEN 2 WHEN 'Anak' THEN 3 WHEN 'Orang Tua' THEN 4 ELSE 5 END, t.birth_date NULLS LAST, t.full_name`;
const house = (field: string) => `(SELECT r.${field} FROM residents r WHERE r.id = t.resident_id)`;

export const SHEET_LAYOUTS: Record<string, TableLayout> = {
  // Urutan kolom mengikuti Kartu Keluarga (kolom 1–17), dikelompokkan per rumah.
  family_members: {
    orderBy: `(SELECT r.block_number FROM residents r WHERE r.id = t.resident_id), (SELECT CASE WHEN r.house_number ~ '^[0-9]+$' THEN r.house_number::int END FROM residents r WHERE r.id = t.resident_id), ${familyOrder}`,
    autoResize: true,
    entries: [
      { label: 'Rumah', derived: `(SELECT r.block_number || ' No. ' || r.house_number FROM residents r WHERE r.id = t.resident_id)` },
      { label: 'No. KK', derived: house('kk_number') },
      { label: 'No', derived: `row_number() OVER (PARTITION BY t.resident_id ORDER BY ${familyOrder})` },
      { label: 'Nama Lengkap', column: 'full_name' },
      { label: 'NIK', column: 'nik' },
      { label: 'Jenis Kelamin', column: 'gender' },
      { label: 'Tempat Lahir', column: 'birth_place' },
      { label: 'Tanggal Lahir', column: 'birth_date', format: 'dmy' },
      { label: 'Agama', json: 'kk_details', key: 'religion' },
      { label: 'Pendidikan', json: 'kk_details', key: 'education' },
      { label: 'Jenis Pekerjaan', column: 'occupation' },
      { label: 'Golongan Darah', json: 'kk_details', key: 'bloodType' },
      { label: 'Status Perkawinan', json: 'kk_details', key: 'maritalStatus' },
      { label: 'Tanggal Perkawinan', json: 'kk_details', key: 'marriageDate', format: 'dmy' },
      { label: 'Status Hubungan Dalam Keluarga', column: 'relationship' },
      { label: 'Kewarganegaraan', json: 'kk_details', key: 'citizenship' },
      { label: 'No. Paspor', json: 'kk_details', key: 'passportNumber' },
      { label: 'No. KITAP', json: 'kk_details', key: 'stayPermitNumber' },
      { label: 'Nama Ayah', json: 'kk_details', key: 'fatherName' },
      { label: 'Nama Ibu', json: 'kk_details', key: 'motherName' },
      { label: 'id (sistem)', column: 'id' },
      { label: 'resident_id (sistem)', column: 'resident_id' }
    ]
  },
  // Alamat KK dipecah: alamat, RT, RW, desa/kelurahan, kecamatan, kab/kota, provinsi, kode pos.
  residents: {
    orderBy: `t.block_number, CASE WHEN t.house_number ~ '^[0-9]+$' THEN t.house_number::int END, t.house_number, t.id`,
    expandJson: {
      kk_address: [
        { label: 'kk_alamat', key: 'address' },
        { label: 'kk_rt', key: 'rt' },
        { label: 'kk_rw', key: 'rw' },
        { label: 'kk_desa_kelurahan', key: 'village' },
        { label: 'kk_kecamatan', key: 'district' },
        { label: 'kk_kabupaten_kota', key: 'city' },
        { label: 'kk_provinsi', key: 'province' },
        { label: 'kk_kode_pos', key: 'postalCode' }
      ]
    }
  }
};
