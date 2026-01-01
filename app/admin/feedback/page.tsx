"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { reviewsApi, Review } from "@/app/lib/api/reviews";
import { complaintsApi, Complaint } from "@/app/lib/api/complaints";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Trash2,
  Edit,
  Search,
  Filter,
} from "lucide-react";
import styles from "./feedback.module.css";

export default function FeedbackPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"reviews" | "complaints">("reviews");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Complaints state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processData, setProcessData] = useState({
    TrangThai: "Processing" as "Pending" | "Processing" | "Resolved" | "Closed",
    PhanHoi: "",
  });

  useEffect(() => {
    if (!isLoading) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token || !isAuthenticated) {
        router.push("/login");
        return;
      }
      
      if (user && !["Admin", "Manager", "NhanVien"].includes(user.role || "")) {
        router.push("/");
        return;
      }
      
      loadData();
    }
  }, [isAuthenticated, isLoading, user, router, activeTab, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "reviews") {
        // Load all reviews for admin
        try {
          const data = await reviewsApi.getAll(1, 100);
          setReviews(data.reviews || []);
        } catch (err: any) {
          console.error("Error loading reviews:", err);
          setError(err.message || "Không thể tải danh sách đánh giá");
          setReviews([]);
        }
      } else {
        const data = await complaintsApi.getAll(statusFilter || undefined);
        setComplaints(data.complaints || []);
      }
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;

    try {
      await reviewsApi.deleteReview(reviewId);
      // Reload reviews after deletion
      if (activeTab === "reviews") {
        const data = await reviewsApi.getAll(1, 100);
        setReviews(data.reviews || []);
      }
    } catch (err: any) {
      alert(err.message || "Lỗi xóa đánh giá");
    }
  };

  const handleProcessComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      // Note: TrangThai and PhanHoi are not saved in database
      // Only NoiDung can be updated, but we'll still call the API for consistency
      // The backend will accept the request but only update NoiDung if provided
      await complaintsApi.update(selectedComplaint.MaKhieuNai, {
        NoiDung: selectedComplaint.NoiDung, // Keep existing content
        ...processData, // Include TrangThai and PhanHoi for API compatibility
      });
      alert("Lưu ý: Trạng thái và phản hồi không được lưu trong database. Chỉ nội dung khiếu nại có thể được cập nhật.");
      setShowProcessModal(false);
      setSelectedComplaint(null);
      setProcessData({ TrangThai: "Processing", PhanHoi: "" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật khiếu nại");
    }
  };

  const openProcessModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setProcessData({
      TrangThai: complaint.TrangThai,
      PhanHoi: complaint.PhanHoi || "",
    });
    setShowProcessModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Closed":
        return styles.statusResolved;
      case "Processing":
        return styles.statusProcessing;
      case "Pending":
        return styles.statusPending;
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Closed":
        return <CheckCircle size={16} />;
      case "Processing":
        return <Clock size={16} />;
      case "Pending":
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? "#fbbf24" : "none"}
        color="#fbbf24"
      />
    ));
  };

  if (loading && !reviews.length && !complaints.length) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Phản hồi & Khiếu nại</h1>
        <p className={styles.subtitle}>Quản lý đánh giá và khiếu nại từ khách hàng</p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={loadData} className={styles.retryButton}>
            Thử lại
          </button>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "reviews" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          <MessageSquare size={20} />
          Đánh giá sản phẩm
        </button>
        <button
          className={`${styles.tab} ${activeTab === "complaints" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("complaints")}
        >
          <MessageSquare size={20} />
          Khiếu nại ({complaints.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "reviews" ? (
          <div className={styles.reviewsSection}>
            {/* Reviews Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sản phẩm</th>
                    <th>Khách hàng</th>
                    <th>Đánh giá</th>
                    <th>Nội dung</th>
                    <th>Ngày đánh giá</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length > 0 ? (
                    reviews
                      .filter((r) =>
                        searchTerm
                          ? (r.TenSP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.TenKH?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.NoiDung?.toLowerCase().includes(searchTerm.toLowerCase()))
                          : true
                      )
                      .map((review) => (
                        <tr key={review.MaDanhGia}>
                          <td>{review.MaDanhGia}</td>
                          <td>
                            <a
                              href={`/shop/${review.MaSP}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.productLink}
                            >
                              {review.TenSP || `SP${review.MaSP}`}
                            </a>
                          </td>
                          <td>{review.TenKH || `KH${review.MaKH}`}</td>
                          <td>
                            <div className={styles.rating}>
                              {renderStars(review.DiemDanhGia)}
                              <span className={styles.ratingValue}>
                                {review.DiemDanhGia}/5
                              </span>
                            </div>
                          </td>
                          <td className={styles.contentCell}>
                            {review.NoiDung || "—"}
                          </td>
                          <td>{formatDate(review.NgayDanhGia)}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteReview(review.MaDanhGia)}
                              className={styles.deleteButton}
                              title="Xóa đánh giá"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={7} className={styles.emptyCell}>
                        {searchTerm
                          ? "Không tìm thấy đánh giá"
                          : "Chưa có đánh giá nào"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.complaintsSection}>
            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.searchBox}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm khiếu nại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.filterGroup}>
                <Filter size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Pending">Chờ xử lý</option>
                  <option value="Processing">Đang xử lý</option>
                  <option value="Resolved">Đã giải quyết</option>
                  <option value="Closed">Đã đóng</option>
                </select>
              </div>
            </div>

            {/* Complaints Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Tiêu đề</th>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length > 0 ? (
                    complaints
                      .filter((c) =>
                        searchTerm
                          ? c.TieuDe.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.NoiDung.toLowerCase().includes(searchTerm.toLowerCase())
                          : true
                      )
                      .map((complaint) => (
                        <tr key={complaint.MaKhieuNai}>
                          <td>{complaint.MaKhieuNai}</td>
                          <td>{complaint.TenKH || `KH${complaint.MaKH}`}</td>
                          <td className={styles.titleCell}>{complaint.TieuDe}</td>
                          <td className={styles.contentCell}>
                            {complaint.NoiDung.length > 50
                              ? `${complaint.NoiDung.substring(0, 50)}...`
                              : complaint.NoiDung}
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${getStatusColor(
                                complaint.TrangThai
                              )}`}
                            >
                              {getStatusIcon(complaint.TrangThai)}
                              {complaint.TrangThai}
                            </span>
                          </td>
                          <td>{formatDate(complaint.NgayTao)}</td>
                          <td>
                            <div className={styles.actionButtons}>
                              {complaint.TrangThai !== "Resolved" && complaint.TrangThai !== "Closed" && (
                                <button
                                  onClick={async () => {
                                    if (!confirm("Đánh dấu khiếu nại này là đã xử lý?")) return
                                    try {
                                      await complaintsApi.update(complaint.MaKhieuNai, {
                                        TrangThai: "Resolved",
                                      })
                                      alert("Đã đánh dấu khiếu nại là đã xử lý")
                                      loadData()
                                    } catch (err: any) {
                                      alert(err.message || "Lỗi cập nhật khiếu nại")
                                    }
                                  }}
                                  className={styles.processedButton}
                                  title="Đánh dấu đã xử lý"
                                >
                                  <CheckCircle size={16} />
                                  Đã xử lý
                                </button>
                              )}
                              <button
                                onClick={() => openProcessModal(complaint)}
                                className={styles.processButton}
                                title="Xử lý chi tiết"
                              >
                                <Edit size={16} />
                                Xử lý
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={7} className={styles.emptyCell}>
                        Không có khiếu nại nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Process Complaint Modal */}
      {showProcessModal && selectedComplaint && (
        <div className={styles.modalOverlay} onClick={() => setShowProcessModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Xử lý khiếu nại #{selectedComplaint.MaKhieuNai}</h2>
              <button
                onClick={() => setShowProcessModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h3>Thông tin khiếu nại</h3>
                <p>
                  <strong>Khách hàng:</strong> {selectedComplaint.TenKH || `KH${selectedComplaint.MaKH}`}
                </p>
                <p>
                  <strong>Tiêu đề:</strong> {selectedComplaint.TieuDe}
                </p>
                <p>
                  <strong>Nội dung:</strong> {selectedComplaint.NoiDung}
                </p>
                <p>
                  <strong>Ngày tạo:</strong> {formatDate(selectedComplaint.NgayTao)}
                </p>
              </div>

              <div className={styles.modalSection}>
                <label>
                  <strong>Trạng thái:</strong>
                  <select
                    value={processData.TrangThai}
                    onChange={(e) =>
                      setProcessData({
                        ...processData,
                        TrangThai: e.target.value as any,
                      })
                    }
                    className={styles.select}
                  >
                    <option value="Pending">Chờ xử lý</option>
                    <option value="Processing">Đang xử lý</option>
                    <option value="Resolved">Đã giải quyết</option>
                    <option value="Closed">Đã đóng</option>
                  </select>
                </label>
              </div>

              <div className={styles.modalSection}>
                <label>
                  <strong>Phản hồi:</strong>
                  <textarea
                    value={processData.PhanHoi}
                    onChange={(e) =>
                      setProcessData({ ...processData, PhanHoi: e.target.value })
                    }
                    rows={5}
                    className={styles.textarea}
                    placeholder="Nhập phản hồi cho khách hàng..."
                  />
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowProcessModal(false)}
                className={styles.cancelButton}
              >
                Hủy
              </button>
              <button onClick={handleProcessComplaint} className={styles.saveButton}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
