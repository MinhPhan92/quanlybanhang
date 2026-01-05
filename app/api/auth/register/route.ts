import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/app/lib/db";

/**
 * Hash password theo chuẩn passlib: $pbkdf2-sha256$iterations$salt$hash
 */
function hashPassword(password: string): string {
  const ALGORITHM = "sha256";
  const ITERATIONS = 29000; // chuẩn passlib phổ biến
  const KEYLEN = 32;

  // passlib dùng salt dạng base64 không padding
  const salt = crypto
    .randomBytes(16)
    .toString("base64")
    .replace(/=+$/, "");

  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, ALGORITHM)
    .toString("base64")
    .replace(/=+$/, "");

  return `$pbkdf2-sha256$${ITERATIONS}$${salt}$${hash}`;
}

export async function POST(req: Request) {
  try {
    const {
      username,
      password,
      email,
      fullName,
      phone,
      address,
    } = await req.json();

    // Check user tồn tại
    const [exist]: any = await db.query(
      "SELECT MaTK FROM TaiKhoan WHERE Username = ?",
      [username]
    );

    if (exist.length > 0) {
      return NextResponse.json(
        { message: "Tên đăng nhập đã tồn tại" },
        { status: 409 }
      );
    }

    // Hash password bằng passlib pbkdf2-sha256
    const hashed = hashPassword(password);

    // Insert KhachHang
    const [kh]: any = await db.query(
      `INSERT INTO KhachHang (TenKH, SdtKH, EmailKH, DiaChiKH)
       VALUES (?, ?, ?, ?)` ,
      [fullName, phone, email, address]
    );

    // Insert TaiKhoan
    await db.query(
      `INSERT INTO TaiKhoan (Username, Pass, VaiTro, MaKH)
       VALUES (?, ?, 'KhachHang', ?)` ,
      [username, hashed, kh.insertId]
    );

    return NextResponse.json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500 }
    );
  }
}
