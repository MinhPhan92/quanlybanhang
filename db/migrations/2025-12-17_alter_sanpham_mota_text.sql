-- Migration: expand SanPham.MoTa to TEXT to avoid truncation (JSON attributes / long descriptions)
-- Target DB: MySQL / MariaDB
--
-- Run this on the competition database:
--   USE QuanLyBanHang;
--   SOURCE db/migrations/2025-12-17_alter_sanpham_mota_text.sql;

ALTER TABLE `SanPham`
  MODIFY COLUMN `MoTa` TEXT NULL;


