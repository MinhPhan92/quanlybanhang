-- Migration: Add HinhAnh column to SanPham table
-- Date: 2026-01-04
-- Description: Thêm cột HinhAnh để lưu trữ đường dẫn ảnh sản phẩm

-- Add HinhAnh column to SanPham table
ALTER TABLE SanPham
ADD COLUMN HinhAnh VARCHAR(500) NULL AFTER MoTa;

-- Optional: Update existing products with default placeholder image
-- UPDATE SanPham SET HinhAnh = '/placeholder.svg' WHERE HinhAnh IS NULL;
