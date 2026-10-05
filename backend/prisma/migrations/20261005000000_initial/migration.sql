-- CreateEnum
CREATE TYPE "MA_VAI_TRO" AS ENUM ('BAN_THUOC', 'QUAN_LY_KHO', 'QUAN_LY');

-- CreateEnum
CREATE TYPE "TRANG_THAI_CHUNG_TU" AS ENUM ('NHAP', 'HOAN_TAT', 'DA_HUY');

-- CreateEnum
CREATE TYPE "TRANG_THAI_KIEM_KE" AS ENUM ('NHAP', 'CHO_DUYET', 'DA_DUYET', 'KIEM_TRA_LAI');

-- CreateTable
CREATE TABLE "NHAN_VIEN" (
    "ma_nv" SERIAL NOT NULL,
    "ho_ten" VARCHAR(100) NOT NULL,
    "sdt" VARCHAR(20),
    "dang_lam_viec" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NHAN_VIEN_pkey" PRIMARY KEY ("ma_nv")
);

-- CreateTable
CREATE TABLE "TAI_KHOAN" (
    "ma_tk" SERIAL NOT NULL,
    "ma_nv" INTEGER NOT NULL,
    "ten_dang_nhap" VARCHAR(50) NOT NULL,
    "mat_khau_hash" VARCHAR(255) NOT NULL,
    "hoat_dong" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TAI_KHOAN_pkey" PRIMARY KEY ("ma_tk")
);

-- CreateTable
CREATE TABLE "VAI_TRO" (
    "ma_vai_tro" SERIAL NOT NULL,
    "ten_vai_tro" "MA_VAI_TRO" NOT NULL,

    CONSTRAINT "VAI_TRO_pkey" PRIMARY KEY ("ma_vai_tro")
);

-- CreateTable
CREATE TABLE "TAI_KHOAN_VAI_TRO" (
    "ma_tk" INTEGER NOT NULL,
    "ma_vai_tro" INTEGER NOT NULL,

    CONSTRAINT "TAI_KHOAN_VAI_TRO_pkey" PRIMARY KEY ("ma_tk","ma_vai_tro")
);

-- CreateTable
CREATE TABLE "THUOC" (
    "ma_thuoc" SERIAL NOT NULL,
    "ten_thuoc" VARCHAR(200) NOT NULL,
    "hoat_chat" VARCHAR(200),
    "ham_luong" VARCHAR(100),
    "dang_bao_che" VARCHAR(100),
    "don_vi_tinh" VARCHAR(50) NOT NULL,
    "gia_ban" DECIMAL(14,2) NOT NULL,
    "can_don" BOOLEAN NOT NULL,
    "nguong_canh_bao" INTEGER NOT NULL,
    "dang_kinh_doanh" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "THUOC_pkey" PRIMARY KEY ("ma_thuoc")
);

-- CreateTable
CREATE TABLE "LO_THUOC" (
    "ma_lo" SERIAL NOT NULL,
    "ma_thuoc" INTEGER NOT NULL,
    "so_lo" VARCHAR(100) NOT NULL,
    "han_su_dung" DATE NOT NULL,
    "so_luong_ton" INTEGER NOT NULL DEFAULT 0,
    "version" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "LO_THUOC_pkey" PRIMARY KEY ("ma_lo")
);

-- CreateTable
CREATE TABLE "NHA_CUNG_CAP" (
    "ma_ncc" SERIAL NOT NULL,
    "ten_ncc" VARCHAR(200) NOT NULL,
    "sdt" VARCHAR(20),
    "dia_chi" VARCHAR(255),
    "hoat_dong" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NHA_CUNG_CAP_pkey" PRIMARY KEY ("ma_ncc")
);

-- CreateTable
CREATE TABLE "PHIEU_NHAP" (
    "ma_pn" SERIAL NOT NULL,
    "ma_ncc" INTEGER NOT NULL,
    "ma_nv" INTEGER NOT NULL,
    "tao_luc" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cap_nhat_luc" TIMESTAMPTZ(3) NOT NULL,
    "hoan_tat_luc" TIMESTAMPTZ(3),
    "tong_tien" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "trang_thai" "TRANG_THAI_CHUNG_TU" NOT NULL DEFAULT 'NHAP',

    CONSTRAINT "PHIEU_NHAP_pkey" PRIMARY KEY ("ma_pn")
);

-- CreateTable
CREATE TABLE "CT_PHIEU_NHAP" (
    "ma_ct_nhap" SERIAL NOT NULL,
    "ma_pn" INTEGER NOT NULL,
    "ma_thuoc" INTEGER NOT NULL,
    "so_lo_du_kien" VARCHAR(100) NOT NULL,
    "han_su_dung_du_kien" DATE NOT NULL,
    "ma_lo" INTEGER,
    "so_luong" INTEGER NOT NULL,
    "don_gia_nhap" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "CT_PHIEU_NHAP_pkey" PRIMARY KEY ("ma_ct_nhap")
);

-- CreateTable
CREATE TABLE "KHACH_HANG" (
    "ma_kh" SERIAL NOT NULL,
    "ho_ten" VARCHAR(100) NOT NULL,
    "sdt" VARCHAR(20),

    CONSTRAINT "KHACH_HANG_pkey" PRIMARY KEY ("ma_kh")
);

-- CreateTable
CREATE TABLE "DON_THUOC" (
    "ma_don" SERIAL NOT NULL,
    "ngay_ke" DATE NOT NULL,
    "nguoi_ke" VARCHAR(150) NOT NULL,
    "nguoi_benh" VARCHAR(255) NOT NULL,
    "nguoi_mua" VARCHAR(255),
    "anh_don" VARCHAR(500),
    "ma_nv_kiem_tra" INTEGER,
    "luc_kiem_tra" TIMESTAMPTZ(3),

    CONSTRAINT "DON_THUOC_pkey" PRIMARY KEY ("ma_don")
);

-- CreateTable
CREATE TABLE "CT_DON_THUOC" (
    "ma_ct_don" SERIAL NOT NULL,
    "ma_don" INTEGER NOT NULL,
    "ma_thuoc" INTEGER,
    "ten_thuoc_tren_don" VARCHAR(200) NOT NULL,
    "ham_luong_tren_don" VARCHAR(100),
    "don_vi_tren_don" VARCHAR(50) NOT NULL,
    "so_luong_ke" INTEGER NOT NULL,
    "huong_dan" VARCHAR(255),

    CONSTRAINT "CT_DON_THUOC_pkey" PRIMARY KEY ("ma_ct_don")
);

-- CreateTable
CREATE TABLE "HOA_DON" (
    "ma_hd" SERIAL NOT NULL,
    "ma_nv" INTEGER NOT NULL,
    "ma_kh" INTEGER,
    "ma_don" INTEGER,
    "tao_luc" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cap_nhat_luc" TIMESTAMPTZ(3) NOT NULL,
    "hoan_tat_luc" TIMESTAMPTZ(3),
    "ghi_chu_tu_van" TEXT,
    "tong_tien" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "trang_thai" "TRANG_THAI_CHUNG_TU" NOT NULL DEFAULT 'NHAP',

    CONSTRAINT "HOA_DON_pkey" PRIMARY KEY ("ma_hd")
);

-- CreateTable
CREATE TABLE "CT_HOA_DON" (
    "ma_ct_ban" SERIAL NOT NULL,
    "ma_hd" INTEGER NOT NULL,
    "ma_thuoc" INTEGER NOT NULL,
    "so_luong" INTEGER NOT NULL,
    "don_gia_ban" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "CT_HOA_DON_pkey" PRIMARY KEY ("ma_ct_ban")
);

-- CreateTable
CREATE TABLE "CT_XUAT_LO" (
    "ma_ct_xuat" SERIAL NOT NULL,
    "ma_ct_ban" INTEGER NOT NULL,
    "ma_lo" INTEGER NOT NULL,
    "so_luong_xuat" INTEGER NOT NULL,

    CONSTRAINT "CT_XUAT_LO_pkey" PRIMARY KEY ("ma_ct_xuat")
);

-- CreateTable
CREATE TABLE "PHIEU_KIEM_KE" (
    "ma_kk" SERIAL NOT NULL,
    "ma_nguoi_lap" INTEGER NOT NULL,
    "ma_nguoi_duyet" INTEGER,
    "tao_luc" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cap_nhat_luc" TIMESTAMPTZ(3) NOT NULL,
    "hoan_tat_luc" TIMESTAMPTZ(3),
    "trang_thai" "TRANG_THAI_KIEM_KE" NOT NULL DEFAULT 'NHAP',

    CONSTRAINT "PHIEU_KIEM_KE_pkey" PRIMARY KEY ("ma_kk")
);

-- CreateTable
CREATE TABLE "CT_KIEM_KE" (
    "ma_ct_kk" SERIAL NOT NULL,
    "ma_kk" INTEGER NOT NULL,
    "ma_lo" INTEGER NOT NULL,
    "so_luong_he_thong" INTEGER NOT NULL,
    "version_ghi_nhan" BIGINT NOT NULL,
    "ghi_nhan_luc" TIMESTAMPTZ(3) NOT NULL,
    "so_luong_thuc_te" INTEGER,
    "ly_do" VARCHAR(255),

    CONSTRAINT "CT_KIEM_KE_pkey" PRIMARY KEY ("ma_ct_kk")
);

-- CreateTable
CREATE TABLE "PHIEN_DANG_NHAP" (
    "ma_phien" SERIAL NOT NULL,
    "ma_tk" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "tao_luc" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "het_han_luc" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PHIEN_DANG_NHAP_pkey" PRIMARY KEY ("ma_phien")
);

-- CreateIndex
CREATE UNIQUE INDEX "TAI_KHOAN_ma_nv_key" ON "TAI_KHOAN"("ma_nv");

-- CreateIndex
CREATE UNIQUE INDEX "TAI_KHOAN_ten_dang_nhap_key" ON "TAI_KHOAN"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "VAI_TRO_ten_vai_tro_key" ON "VAI_TRO"("ten_vai_tro");

-- CreateIndex
CREATE INDEX "TAI_KHOAN_VAI_TRO_ma_vai_tro_idx" ON "TAI_KHOAN_VAI_TRO"("ma_vai_tro");

-- CreateIndex
CREATE INDEX "LO_THUOC_ma_thuoc_han_su_dung_idx" ON "LO_THUOC"("ma_thuoc", "han_su_dung");

-- CreateIndex
CREATE UNIQUE INDEX "LO_THUOC_ma_thuoc_so_lo_han_su_dung_key" ON "LO_THUOC"("ma_thuoc", "so_lo", "han_su_dung");

-- CreateIndex
CREATE INDEX "PHIEU_NHAP_ma_ncc_idx" ON "PHIEU_NHAP"("ma_ncc");

-- CreateIndex
CREATE INDEX "PHIEU_NHAP_ma_nv_idx" ON "PHIEU_NHAP"("ma_nv");

-- CreateIndex
CREATE INDEX "PHIEU_NHAP_trang_thai_hoan_tat_luc_idx" ON "PHIEU_NHAP"("trang_thai", "hoan_tat_luc");

-- CreateIndex
CREATE INDEX "CT_PHIEU_NHAP_ma_pn_idx" ON "CT_PHIEU_NHAP"("ma_pn");

-- CreateIndex
CREATE INDEX "CT_PHIEU_NHAP_ma_thuoc_idx" ON "CT_PHIEU_NHAP"("ma_thuoc");

-- CreateIndex
CREATE INDEX "CT_PHIEU_NHAP_ma_lo_idx" ON "CT_PHIEU_NHAP"("ma_lo");

-- CreateIndex
CREATE INDEX "DON_THUOC_ma_nv_kiem_tra_idx" ON "DON_THUOC"("ma_nv_kiem_tra");

-- CreateIndex
CREATE INDEX "CT_DON_THUOC_ma_don_idx" ON "CT_DON_THUOC"("ma_don");

-- CreateIndex
CREATE INDEX "CT_DON_THUOC_ma_thuoc_idx" ON "CT_DON_THUOC"("ma_thuoc");

-- CreateIndex
CREATE INDEX "HOA_DON_ma_nv_idx" ON "HOA_DON"("ma_nv");

-- CreateIndex
CREATE INDEX "HOA_DON_ma_kh_idx" ON "HOA_DON"("ma_kh");

CREATE INDEX "HOA_DON_ma_don_idx" ON "HOA_DON"("ma_don");

-- CreateIndex
CREATE INDEX "HOA_DON_trang_thai_hoan_tat_luc_idx" ON "HOA_DON"("trang_thai", "hoan_tat_luc");

-- CreateIndex
CREATE INDEX "CT_HOA_DON_ma_hd_idx" ON "CT_HOA_DON"("ma_hd");

-- CreateIndex
CREATE INDEX "CT_HOA_DON_ma_thuoc_idx" ON "CT_HOA_DON"("ma_thuoc");

-- CreateIndex
CREATE INDEX "CT_XUAT_LO_ma_lo_idx" ON "CT_XUAT_LO"("ma_lo");

-- CreateIndex
CREATE UNIQUE INDEX "CT_XUAT_LO_ma_ct_ban_ma_lo_key" ON "CT_XUAT_LO"("ma_ct_ban", "ma_lo");

-- CreateIndex
CREATE INDEX "PHIEU_KIEM_KE_ma_nguoi_lap_idx" ON "PHIEU_KIEM_KE"("ma_nguoi_lap");

-- CreateIndex
CREATE INDEX "PHIEU_KIEM_KE_ma_nguoi_duyet_idx" ON "PHIEU_KIEM_KE"("ma_nguoi_duyet");

-- CreateIndex
CREATE INDEX "PHIEU_KIEM_KE_trang_thai_hoan_tat_luc_idx" ON "PHIEU_KIEM_KE"("trang_thai", "hoan_tat_luc");

-- CreateIndex
CREATE INDEX "CT_KIEM_KE_ma_lo_idx" ON "CT_KIEM_KE"("ma_lo");

-- CreateIndex
CREATE UNIQUE INDEX "CT_KIEM_KE_ma_kk_ma_lo_key" ON "CT_KIEM_KE"("ma_kk", "ma_lo");

-- CreateIndex
CREATE UNIQUE INDEX "PHIEN_DANG_NHAP_token_hash_key" ON "PHIEN_DANG_NHAP"("token_hash");

-- CreateIndex
CREATE INDEX "PHIEN_DANG_NHAP_ma_tk_idx" ON "PHIEN_DANG_NHAP"("ma_tk");

-- CreateIndex
CREATE INDEX "PHIEN_DANG_NHAP_het_han_luc_idx" ON "PHIEN_DANG_NHAP"("het_han_luc");

-- AddForeignKey
ALTER TABLE "TAI_KHOAN" ADD CONSTRAINT "TAI_KHOAN_ma_nv_fkey" FOREIGN KEY ("ma_nv") REFERENCES "NHAN_VIEN"("ma_nv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TAI_KHOAN_VAI_TRO" ADD CONSTRAINT "TAI_KHOAN_VAI_TRO_ma_tk_fkey" FOREIGN KEY ("ma_tk") REFERENCES "TAI_KHOAN"("ma_tk") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TAI_KHOAN_VAI_TRO" ADD CONSTRAINT "TAI_KHOAN_VAI_TRO_ma_vai_tro_fkey" FOREIGN KEY ("ma_vai_tro") REFERENCES "VAI_TRO"("ma_vai_tro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LO_THUOC" ADD CONSTRAINT "LO_THUOC_ma_thuoc_fkey" FOREIGN KEY ("ma_thuoc") REFERENCES "THUOC"("ma_thuoc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PHIEU_NHAP" ADD CONSTRAINT "PHIEU_NHAP_ma_ncc_fkey" FOREIGN KEY ("ma_ncc") REFERENCES "NHA_CUNG_CAP"("ma_ncc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PHIEU_NHAP" ADD CONSTRAINT "PHIEU_NHAP_ma_nv_fkey" FOREIGN KEY ("ma_nv") REFERENCES "NHAN_VIEN"("ma_nv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_PHIEU_NHAP" ADD CONSTRAINT "CT_PHIEU_NHAP_ma_pn_fkey" FOREIGN KEY ("ma_pn") REFERENCES "PHIEU_NHAP"("ma_pn") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_PHIEU_NHAP" ADD CONSTRAINT "CT_PHIEU_NHAP_ma_thuoc_fkey" FOREIGN KEY ("ma_thuoc") REFERENCES "THUOC"("ma_thuoc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_PHIEU_NHAP" ADD CONSTRAINT "CT_PHIEU_NHAP_ma_lo_fkey" FOREIGN KEY ("ma_lo") REFERENCES "LO_THUOC"("ma_lo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DON_THUOC" ADD CONSTRAINT "DON_THUOC_ma_nv_kiem_tra_fkey" FOREIGN KEY ("ma_nv_kiem_tra") REFERENCES "NHAN_VIEN"("ma_nv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_DON_THUOC" ADD CONSTRAINT "CT_DON_THUOC_ma_don_fkey" FOREIGN KEY ("ma_don") REFERENCES "DON_THUOC"("ma_don") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_DON_THUOC" ADD CONSTRAINT "CT_DON_THUOC_ma_thuoc_fkey" FOREIGN KEY ("ma_thuoc") REFERENCES "THUOC"("ma_thuoc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOA_DON" ADD CONSTRAINT "HOA_DON_ma_nv_fkey" FOREIGN KEY ("ma_nv") REFERENCES "NHAN_VIEN"("ma_nv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOA_DON" ADD CONSTRAINT "HOA_DON_ma_kh_fkey" FOREIGN KEY ("ma_kh") REFERENCES "KHACH_HANG"("ma_kh") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HOA_DON" ADD CONSTRAINT "HOA_DON_ma_don_fkey" FOREIGN KEY ("ma_don") REFERENCES "DON_THUOC"("ma_don") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_HOA_DON" ADD CONSTRAINT "CT_HOA_DON_ma_hd_fkey" FOREIGN KEY ("ma_hd") REFERENCES "HOA_DON"("ma_hd") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_HOA_DON" ADD CONSTRAINT "CT_HOA_DON_ma_thuoc_fkey" FOREIGN KEY ("ma_thuoc") REFERENCES "THUOC"("ma_thuoc") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_XUAT_LO" ADD CONSTRAINT "CT_XUAT_LO_ma_ct_ban_fkey" FOREIGN KEY ("ma_ct_ban") REFERENCES "CT_HOA_DON"("ma_ct_ban") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_XUAT_LO" ADD CONSTRAINT "CT_XUAT_LO_ma_lo_fkey" FOREIGN KEY ("ma_lo") REFERENCES "LO_THUOC"("ma_lo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PHIEU_KIEM_KE" ADD CONSTRAINT "PHIEU_KIEM_KE_ma_nguoi_lap_fkey" FOREIGN KEY ("ma_nguoi_lap") REFERENCES "NHAN_VIEN"("ma_nv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PHIEU_KIEM_KE" ADD CONSTRAINT "PHIEU_KIEM_KE_ma_nguoi_duyet_fkey" FOREIGN KEY ("ma_nguoi_duyet") REFERENCES "NHAN_VIEN"("ma_nv") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_KIEM_KE" ADD CONSTRAINT "CT_KIEM_KE_ma_kk_fkey" FOREIGN KEY ("ma_kk") REFERENCES "PHIEU_KIEM_KE"("ma_kk") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CT_KIEM_KE" ADD CONSTRAINT "CT_KIEM_KE_ma_lo_fkey" FOREIGN KEY ("ma_lo") REFERENCES "LO_THUOC"("ma_lo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PHIEN_DANG_NHAP" ADD CONSTRAINT "PHIEN_DANG_NHAP_ma_tk_fkey" FOREIGN KEY ("ma_tk") REFERENCES "TAI_KHOAN"("ma_tk") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-local invariants are kept in PostgreSQL as a final guard for all writers.
ALTER TABLE "THUOC" ADD CONSTRAINT "THUOC_gia_ban_nonnegative_check" CHECK ("gia_ban" >= 0);
ALTER TABLE "THUOC" ADD CONSTRAINT "THUOC_nguong_canh_bao_nonnegative_check" CHECK ("nguong_canh_bao" >= 0);
ALTER TABLE "LO_THUOC" ADD CONSTRAINT "LO_THUOC_so_luong_ton_nonnegative_check" CHECK ("so_luong_ton" >= 0);
ALTER TABLE "LO_THUOC" ADD CONSTRAINT "LO_THUOC_version_nonnegative_check" CHECK ("version" >= 0);
ALTER TABLE "PHIEU_NHAP" ADD CONSTRAINT "PHIEU_NHAP_tong_tien_nonnegative_check" CHECK ("tong_tien" >= 0);
ALTER TABLE "PHIEU_NHAP" ADD CONSTRAINT "PHIEU_NHAP_completed_at_matches_status_check"
  CHECK (("trang_thai" = 'HOAN_TAT' AND "hoan_tat_luc" IS NOT NULL) OR ("trang_thai" IN ('NHAP', 'DA_HUY') AND "hoan_tat_luc" IS NULL));
ALTER TABLE "CT_PHIEU_NHAP" ADD CONSTRAINT "CT_PHIEU_NHAP_so_luong_positive_check" CHECK ("so_luong" > 0);
ALTER TABLE "CT_PHIEU_NHAP" ADD CONSTRAINT "CT_PHIEU_NHAP_don_gia_nonnegative_check" CHECK ("don_gia_nhap" >= 0);
ALTER TABLE "DON_THUOC" ADD CONSTRAINT "DON_THUOC_reviewer_pair_check"
  CHECK (("ma_nv_kiem_tra" IS NULL AND "luc_kiem_tra" IS NULL) OR ("ma_nv_kiem_tra" IS NOT NULL AND "luc_kiem_tra" IS NOT NULL));
ALTER TABLE "CT_DON_THUOC" ADD CONSTRAINT "CT_DON_THUOC_so_luong_positive_check" CHECK ("so_luong_ke" > 0);
ALTER TABLE "HOA_DON" ADD CONSTRAINT "HOA_DON_tong_tien_nonnegative_check" CHECK ("tong_tien" >= 0);
ALTER TABLE "HOA_DON" ADD CONSTRAINT "HOA_DON_completed_at_matches_status_check"
  CHECK (("trang_thai" = 'HOAN_TAT' AND "hoan_tat_luc" IS NOT NULL) OR ("trang_thai" IN ('NHAP', 'DA_HUY') AND "hoan_tat_luc" IS NULL));
ALTER TABLE "CT_HOA_DON" ADD CONSTRAINT "CT_HOA_DON_so_luong_positive_check" CHECK ("so_luong" > 0);
ALTER TABLE "CT_HOA_DON" ADD CONSTRAINT "CT_HOA_DON_don_gia_nonnegative_check" CHECK ("don_gia_ban" >= 0);
ALTER TABLE "CT_XUAT_LO" ADD CONSTRAINT "CT_XUAT_LO_so_luong_positive_check" CHECK ("so_luong_xuat" > 0);
ALTER TABLE "PHIEU_KIEM_KE" ADD CONSTRAINT "PHIEU_KIEM_KE_approval_matches_status_check"
  CHECK (("trang_thai" = 'DA_DUYET' AND "ma_nguoi_duyet" IS NOT NULL AND "hoan_tat_luc" IS NOT NULL) OR ("trang_thai" <> 'DA_DUYET' AND "ma_nguoi_duyet" IS NULL AND "hoan_tat_luc" IS NULL));
ALTER TABLE "CT_KIEM_KE" ADD CONSTRAINT "CT_KIEM_KE_system_quantity_nonnegative_check" CHECK ("so_luong_he_thong" >= 0);
ALTER TABLE "CT_KIEM_KE" ADD CONSTRAINT "CT_KIEM_KE_recorded_version_nonnegative_check" CHECK ("version_ghi_nhan" >= 0);
ALTER TABLE "CT_KIEM_KE" ADD CONSTRAINT "CT_KIEM_KE_actual_and_reason_check"
  CHECK ("so_luong_thuc_te" IS NULL OR ("so_luong_thuc_te" >= 0 AND ("so_luong_thuc_te" = "so_luong_he_thong" OR ("ly_do" IS NOT NULL AND btrim("ly_do") <> ''))));
ALTER TABLE "PHIEN_DANG_NHAP" ADD CONSTRAINT "PHIEN_DANG_NHAP_token_hash_hex_check"
  CHECK ("token_hash" ~ '^[0-9A-Fa-f]{64}$');

-- Prisma 6.12 cannot represent a partial unique index. Canceled draft invoices
-- keep their prescription link for history while allowing a replacement draft.
CREATE UNIQUE INDEX "HOA_DON_ma_don_chua_huy_key"
ON "HOA_DON" ("ma_don")
WHERE "ma_don" IS NOT NULL AND "trang_thai" <> 'DA_HUY';
