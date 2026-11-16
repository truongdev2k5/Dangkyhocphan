-- CreateTable
CREATE TABLE `buoi_hoc_nhom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_mon_hoc` VARCHAR(20) NOT NULL,
    `id_hoc_ky` INTEGER NOT NULL,
    `ma_chu_tri` VARCHAR(20) NULL,
    `chu_de` VARCHAR(150) NOT NULL,
    `bat_dau` DATETIME(3) NOT NULL,
    `ket_thuc` DATETIME(3) NOT NULL,
    `link_meet` VARCHAR(512) NOT NULL,
    `phien_lich` INTEGER NOT NULL DEFAULT 1,
    `huy_luc` DATETIME(3) NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `buoi_hoc_nhom_mon_ky_gio_idx`(`ma_mon_hoc`, `id_hoc_ky`, `bat_dau`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quan_tam_hoc_nhom` (
    `id_buoi` INTEGER NOT NULL,
    `ma_sinh_vien` VARCHAR(20) NOT NULL,

    INDEX `quan_tam_hoc_nhom_ma_sinh_vien_idx`(`ma_sinh_vien`),
    PRIMARY KEY (`id_buoi`, `ma_sinh_vien`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thong_bao_hoc_nhom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_buoi` INTEGER NOT NULL,
    `ma_sinh_vien` VARCHAR(20) NOT NULL,
    `loai` ENUM('mo_phong', 'doi_lich', 'huy') NOT NULL,
    `phien_lich` INTEGER NOT NULL,
    `chu_de` VARCHAR(150) NOT NULL,
    `bat_dau` DATETIME(3) NOT NULL,
    `tao_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `doc_luc` DATETIME(3) NULL,

    INDEX `thong_bao_hoc_nhom_ma_sinh_vien_tao_luc_idx`(`ma_sinh_vien`, `tao_luc`),
    UNIQUE INDEX `thong_bao_hoc_nhom_buoi_sv_loai_phien_key`(`id_buoi`, `ma_sinh_vien`, `loai`, `phien_lich`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `buoi_hoc_nhom` ADD CONSTRAINT `buoi_hoc_nhom_ma_mon_hoc_fkey` FOREIGN KEY (`ma_mon_hoc`) REFERENCES `mon_hoc`(`ma_mon_hoc`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buoi_hoc_nhom` ADD CONSTRAINT `buoi_hoc_nhom_id_hoc_ky_fkey` FOREIGN KEY (`id_hoc_ky`) REFERENCES `hoc_ky`(`id_hoc_ky`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buoi_hoc_nhom` ADD CONSTRAINT `buoi_hoc_nhom_ma_chu_tri_fkey` FOREIGN KEY (`ma_chu_tri`) REFERENCES `sinh_vien`(`ma_sinh_vien`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quan_tam_hoc_nhom` ADD CONSTRAINT `quan_tam_hoc_nhom_id_buoi_fkey` FOREIGN KEY (`id_buoi`) REFERENCES `buoi_hoc_nhom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quan_tam_hoc_nhom` ADD CONSTRAINT `quan_tam_hoc_nhom_ma_sinh_vien_fkey` FOREIGN KEY (`ma_sinh_vien`) REFERENCES `sinh_vien`(`ma_sinh_vien`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thong_bao_hoc_nhom` ADD CONSTRAINT `thong_bao_hoc_nhom_id_buoi_fkey` FOREIGN KEY (`id_buoi`) REFERENCES `buoi_hoc_nhom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thong_bao_hoc_nhom` ADD CONSTRAINT `thong_bao_hoc_nhom_ma_sinh_vien_fkey` FOREIGN KEY (`ma_sinh_vien`) REFERENCES `sinh_vien`(`ma_sinh_vien`) ON DELETE CASCADE ON UPDATE CASCADE;
