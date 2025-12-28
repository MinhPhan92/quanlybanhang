-- Seed real products for demo (SanPham) - ensure SoLuongTonKho > 0
-- Note: adjust MaDanhMuc values to match your existing DanhMuc IDs.

INSERT INTO `SanPham` (`TenSP`, `GiaSP`, `SoLuongTonKho`, `MoTa`, `MaDanhMuc`, `IsDelete`)
VALUES
('Nồi cơm điện Smart', 1250000, 20, '{\"image\":\"/rice-cooker.png\",\"color\":\"white\",\"capacity\":\"1.8L\"}', 1, 0),
('Lò vi sóng Inverter', 2350000, 15, '{\"image\":\"/microwave-oven.png\",\"power\":\"900W\",\"mode\":\"inverter\"}', 1, 0),
('Máy hút bụi Robot', 4990000, 8, '{\"image\":\"/robotic-vacuum-cleaner.jpg\",\"battery\":\"5200mAh\"}', 1, 0),
('Máy rửa chén Automatic', 8990000, 6, '{\"image\":\"/automatic-dishwasher.jpg\",\"capacity\":\"12 sets\"}', 1, 0),
('Tủ lạnh 2 cánh', 11990000, 5, '{\"image\":\"/double-door-refrigerator.jpg\",\"capacity\":\"450L\"}', 1, 0),
('Máy giặt cửa trước', 7990000, 7, '{\"image\":\"/front-load-washing-machine.jpg\",\"capacity\":\"9kg\"}', 1, 0);


