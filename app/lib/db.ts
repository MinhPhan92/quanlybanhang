import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123qaz",        // sửa nếu có
  database: "QuanLyBanHang",
  waitForConnections: true,
  connectionLimit: 10,
});