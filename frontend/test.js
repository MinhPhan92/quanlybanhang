// This file uses fetch API to test CRUD functions for all models.
// Run in browser console or Node.js (with node-fetch).
const fetch = require('node-fetch');
const BASE_URL = "http://localhost:8000";

// Helper for fetch requests
async function apiRequest(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(BASE_URL + endpoint, options);
    return res.json();
}

// KhachHang CRUD
async function testKhachHang() {
    // Create
    let kh = await apiRequest("/khachhang/", "POST", {
        TenKH: "Nguyen Van A",
        SdtKH: "0123456789",
        EmailKH: "a@example.com",
        DiaChiKH: "Hanoi"
    });
    console.log("Create KhachHang:", kh);

    // Read all
    let all = await apiRequest("/khachhang/");
    console.log("All KhachHang:", all);

    // Read one
    let one = await apiRequest(`/khachhang/${kh.MaKH}`);
    console.log("One KhachHang:", one);

    // Update
    let updated = await apiRequest(`/khachhang/${kh.MaKH}`, "PUT", { TenKH: "Nguyen Van B" });
    console.log("Updated KhachHang:", updated);

    // Delete
    let deleted = await apiRequest(`/khachhang/${kh.MaKH}`, "DELETE");
    console.log("Deleted KhachHang:", deleted);
}

// NhanVien CRUD
async function testNhanVien() {
    let nv = await apiRequest("/nhanvien/", "POST", {
        TenNV: "Le Thi B",
        ChucVu: "Quản lý",
        SdtNV: "0987654321"
    });
    console.log("Create NhanVien:", nv);

    let all = await apiRequest("/nhanvien/");
    console.log("All NhanVien:", all);

    let one = await apiRequest(`/nhanvien/${nv.MaNV}`);
    console.log("One NhanVien:", one);

    let updated = await apiRequest(`/nhanvien/${nv.MaNV}`, "PUT", { TenNV: "Le Thi C" });
    console.log("Updated NhanVien:", updated);

    let deleted = await apiRequest(`/nhanvien/${nv.MaNV}`, "DELETE");
    console.log("Deleted NhanVien:", deleted);
}

// DanhMuc CRUD
async function testDanhMuc() {
    let dm = await apiRequest("/danhmuc/", "POST", { TenDanhMuc: "Điện tử" });
    console.log("Create DanhMuc:", dm);

    let all = await apiRequest("/danhmuc/");
    console.log("All DanhMuc:", all);

    let one = await apiRequest(`/danhmuc/${dm.MaDanhMuc}`);
    console.log("One DanhMuc:", one);

    let updated = await apiRequest(`/danhmuc/${dm.MaDanhMuc}`, "PUT", { TenDanhMuc: "Gia dụng" });
    console.log("Updated DanhMuc:", updated);

    let deleted = await apiRequest(`/danhmuc/${dm.MaDanhMuc}`, "DELETE");
    console.log("Deleted DanhMuc:", deleted);
}

// SanPham CRUD
async function testSanPham() {
    // You need a DanhMuc first
    let dm = await apiRequest("/danhmuc/", "POST", { TenDanhMuc: "Thời trang" });
    let sp = await apiRequest("/sanpham/", "POST", {
        TenSP: "Áo thun",
        GiaSP: 100000,
        SoLuongTonKho: 50,
        MoTa: "Áo thun cotton",
        MaDanhMuc: dm.MaDanhMuc
    });
    console.log("Create SanPham:", sp);

    let all = await apiRequest("/sanpham/");
    console.log("All SanPham:", all);

    let one = await apiRequest(`/sanpham/${sp.MaSP}`);
    console.log("One SanPham:", one);

    let updated = await apiRequest(`/sanpham/${sp.MaSP}`, "PUT", { TenSP: "Áo sơ mi" });
    console.log("Updated SanPham:", updated);

    let deleted = await apiRequest(`/sanpham/${sp.MaSP}`, "DELETE");
    console.log("Deleted SanPham:", deleted);
}

// DonHang CRUD
async function testDonHang() {
    // You need KhachHang and NhanVien first
    let kh = await apiRequest("/khachhang/", "POST", {
        TenKH: "Pham Van D",
        SdtKH: "0111222333",
        EmailKH: "d@example.com",
        DiaChiKH: "HCM"
    });
    let nv = await apiRequest("/nhanvien/", "POST", {
        TenNV: "Tran Thi E",
        ChucVu: "Bán hàng",
        SdtNV: "0999888777"
    });
    let dh = await apiRequest("/donhang/", "POST", {
        NgayDat: "2025-10-13",
        TongTien: 0,
        TrangThai: "Mới",
        MaKH: kh.MaKH,
        MaNV: nv.MaNV
    });
    console.log("Create DonHang:", dh);

    let all = await apiRequest("/donhang/");
    console.log("All DonHang:", all);

    let one = await apiRequest(`/donhang/${dh.MaDonHang}`);
    console.log("One DonHang:", one);

    let updated = await apiRequest(`/donhang/${dh.MaDonHang}`, "PUT", { TrangThai: "Đã xác nhận" });
    console.log("Updated DonHang:", updated);

    let deleted = await apiRequest(`/donhang/${dh.MaDonHang}`, "DELETE");
    console.log("Deleted DonHang:", deleted);
}

// Run all tests
async function runAllTests() {
    await testKhachHang();
    await testNhanVien();
    await testDanhMuc();
    await testSanPham();
    await testDonHang();
}

runAllTests();