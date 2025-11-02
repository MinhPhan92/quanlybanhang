## AI Handover: Data and Endpoints

### Objective
T will build models for demand forecasting, recommendations, and anomaly detection. Below is the data exposure and access plan.

### Core Data Needed
- Purchase history: orders, items, timestamps, quantities, amounts, discounts.
- Product catalog: product attributes, category, price, current inventory.
- Customer signals (optional): anonymized customer or segment identifiers.

### Recommended Extracts
- Orders with items (joined):
  - Table: `DonHang`, `DonHang_SanPham`, `SanPham`
  - Fields: `MaDonHang`, `NgayDat`, `TrangThai`, `TongTien`, `MaKH`, `MaSP`, `SoLuong`, `DonGia`, `GiamGia`, `TenSP`, `MaDanhMuc`.
- Inventory snapshots:
  - Table: `SanPham`
  - Fields: `MaSP`, `SoLuongTonKho`, `GiaSP`.

### Available APIs
- Auth: `POST /api/auth/login` → returns JWT.
- Products:
  - `GET /api/sanpham` (paginated)
  - `GET /api/sanpham/{masp}`
- Orders:
  - `GET /api/donhang` (list)
  - `GET /api/donhang/{madonhang}`
  - `PUT /api/donhang/{madonhang}/status`
- Alerts:
  - `GET /api/alerts/low-stock`
- Config:
  - `GET /api/config`
  - `PUT /api/config/LOW_STOCK_THRESHOLD`

### Data Access Options
1. Batch export: Provide SQL views and scheduled CSV/Parquet dumps.
2. API pull: T calls APIs with service account token.
3. Direct DB read (read-only user): simplest for full history.

### Suggested SQL Views (for batch)
```sql
-- Orders with items
SELECT dh.MaDonHang, dh.NgayDat, dh.TrangThai, dh.TongTien,
       dh.MaKH, dsi.MaSP, dsi.SoLuong, dsi.DonGia, dsi.GiamGia,
       sp.TenSP, sp.MaDanhMuc
FROM DonHang dh
JOIN DonHang_SanPham dsi ON dsi.MaDonHang = dh.MaDonHang
JOIN SanPham sp ON sp.MaSP = dsi.MaSP;
```

### Security and Privacy
- Use service JWT with role `Admin` or dedicated `AI` role with read-only endpoints.
- Remove PII where not required; map to hashed identifiers if needed.

### Contact and Next Steps
- Confirm extract format and cadence (daily/hourly).
- Provide sample export covering last 90 days.
- Share Postman collection (`docs/PostmanCollection.json`) and credentials for staging.


