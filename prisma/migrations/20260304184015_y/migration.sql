-- CreateTable
CREATE TABLE `vai_tro` (
    `id_vai_tro` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_vai_tro` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `vai_tro_ten_vai_tro_key`(`ten_vai_tro`),
    PRIMARY KEY (`id_vai_tro`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tai_khoan` (
    `id_nguoi_dung` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_dang_nhap` VARCHAR(50) NOT NULL,
    `mat_khau` VARCHAR(255) NOT NULL,
    `id_vai_tro` INTEGER NOT NULL,
    `trang_thai` BOOLEAN NOT NULL DEFAULT true,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tai_khoan_ten_dang_nhap_key`(`ten_dang_nhap`),
    PRIMARY KEY (`id_nguoi_dung`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chuyen_nganh` (
    `ma_chuyen_nganh` VARCHAR(20) NOT NULL,
    `ten_chuyen_nganh` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`ma_chuyen_nganh`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mon_hoc` (
    `ma_mon_hoc` VARCHAR(20) NOT NULL,
    `ten_mon_hoc` VARCHAR(200) NOT NULL,
    `so_tin_chi` INTEGER NOT NULL,
    `la_mon_chung` TINYINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ma_mon_hoc`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sinh_vien` (
    `ma_sinh_vien` VARCHAR(20) NOT NULL,
    `id_nguoi_dung` INTEGER NULL,
    `ho_ten` VARCHAR(100) NOT NULL,
    `ma_chuyen_nganh` VARCHAR(20) NOT NULL,
    `so_dien_thoai` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sinh_vien_id_nguoi_dung_key`(`id_nguoi_dung`),
    PRIMARY KEY (`ma_sinh_vien`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `giang_vien` (
    `ma_giang_vien` VARCHAR(20) NOT NULL,
    `ho_ten` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `so_dien_thoai` VARCHAR(20) NULL,S
    `khoa` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ma_giang_vien`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hoc_ky` (
    `id_hoc_ky` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_hoc_ky` VARCHAR(50) NOT NULL,
    `nam_hoc` VARCHAR(20) NOT NULL,
    `ngay_bat_dau_dk` DATE NOT NULL,
    `ngay_ket_thuc_dk` DATE NOT NULL,
    `dang_kich_hoat` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_hoc_ky`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lop_hoc_phan` (
    `ma_lop_hoc` VARCHAR(20) NOT NULL,
    `ma_mon_hoc` VARCHAR(20) NOT NULL,
    `id_hoc_ky` INTEGER NOT NULL,
    `ma_giang_vien` VARCHAR(20) NULL,
    `phong_hoc` VARCHAR(50) NULL,
    `so_luong_toi_da` INTEGER NOT NULL,
    `so_luong_con_trong` INTEGER NOT NULL,
    `ngay_bat_dau` DATE NULL,
    `ngay_ket_thuc` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ma_lop_hoc`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lich_hoc_chi_tiet` (
    `id_lich_hoc` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_lop_hoc` VARCHAR(20) NOT NULL,
    `thu_trong_tuan` INTEGER NOT NULL,
    `gio_bat_dau` VARCHAR(8) NOT NULL,
    `gio_ket_thuc` VARCHAR(8) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_lich_hoc`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `danh_sach_dang_ky` (
    `id_dang_ky` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_sinh_vien` VARCHAR(20) NOT NULL,
    `ma_lop_hoc` VARCHAR(20) NOT NULL,
    `trang_thai` ENUM('cho_duyet', 'da_duyet', 'tu_choi', 'da_huy') NOT NULL DEFAULT 'cho_duyet',
    `ghi_chu_tu_choi` VARCHAR(255) NULL,
    `ngay_dang_ky` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `danh_sach_dang_ky_ma_sinh_vien_ma_lop_hoc_key`(`ma_sinh_vien`, `ma_lop_hoc`),
    PRIMARY KEY (`id_dang_ky`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lich_su_dang_ky` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_sinh_vien` VARCHAR(20) NULL,
    `ma_lop_hoc` VARCHAR(20) NULL,
    `trang_thai_cu` VARCHAR(20) NULL,
    `trang_thai_moi` VARCHAR(20) NULL,
    `thoi_diem` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cau_hinh_tin_chi` (
    `id_hoc_ky` INTEGER NOT NULL,
    `tin_chi_toi_da` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_hoc_ky`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tai_khoan` ADD CONSTRAINT `tai_khoan_id_vai_tro_fkey` FOREIGN KEY (`id_vai_tro`) REFERENCES `vai_tro`(`id_vai_tro`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sinh_vien` ADD CONSTRAINT `sinh_vien_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `tai_khoan`(`id_nguoi_dung`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sinh_vien` ADD CONSTRAINT `sinh_vien_ma_chuyen_nganh_fkey` FOREIGN KEY (`ma_chuyen_nganh`) REFERENCES `chuyen_nganh`(`ma_chuyen_nganh`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lop_hoc_phan` ADD CONSTRAINT `lop_hoc_phan_ma_mon_hoc_fkey` FOREIGN KEY (`ma_mon_hoc`) REFERENCES `mon_hoc`(`ma_mon_hoc`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lop_hoc_phan` ADD CONSTRAINT `lop_hoc_phan_id_hoc_ky_fkey` FOREIGN KEY (`id_hoc_ky`) REFERENCES `hoc_ky`(`id_hoc_ky`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lop_hoc_phan` ADD CONSTRAINT `lop_hoc_phan_ma_giang_vien_fkey` FOREIGN KEY (`ma_giang_vien`) REFERENCES `giang_vien`(`ma_giang_vien`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_hoc_chi_tiet` ADD CONSTRAINT `lich_hoc_chi_tiet_ma_lop_hoc_fkey` FOREIGN KEY (`ma_lop_hoc`) REFERENCES `lop_hoc_phan`(`ma_lop_hoc`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `danh_sach_dang_ky` ADD CONSTRAINT `danh_sach_dang_ky_ma_sinh_vien_fkey` FOREIGN KEY (`ma_sinh_vien`) REFERENCES `sinh_vien`(`ma_sinh_vien`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `danh_sach_dang_ky` ADD CONSTRAINT `danh_sach_dang_ky_ma_lop_hoc_fkey` FOREIGN KEY (`ma_lop_hoc`) REFERENCES `lop_hoc_phan`(`ma_lop_hoc`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_su_dang_ky` ADD CONSTRAINT `lich_su_dang_ky_ma_sinh_vien_fkey` FOREIGN KEY (`ma_sinh_vien`) REFERENCES `sinh_vien`(`ma_sinh_vien`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_su_dang_ky` ADD CONSTRAINT `lich_su_dang_ky_ma_lop_hoc_fkey` FOREIGN KEY (`ma_lop_hoc`) REFERENCES `lop_hoc_phan`(`ma_lop_hoc`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cau_hinh_tin_chi` ADD CONSTRAINT `cau_hinh_tin_chi_id_hoc_ky_fkey` FOREIGN KEY (`id_hoc_ky`) REFERENCES `hoc_ky`(`id_hoc_ky`) ON DELETE RESTRICT ON UPDATE CASCADE;
