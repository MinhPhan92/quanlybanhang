"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/contexts/ToastContext";
import { configApi, SystemConfig } from "@/app/lib/api/config";
import { Settings, Save, Building2, Mail, Phone, MapPin, Package, ShoppingCart, AlertTriangle, Loader2 } from "lucide-react";
import styles from "./settings.module.css";

interface ConfigField {
  key: string;
  label: string;
  description: string;
  type: "text" | "email" | "number" | "textarea";
  icon: React.ComponentType<{ size?: number }>;
  placeholder?: string;
  min?: number;
  max?: number;
}

const CONFIG_FIELDS: ConfigField[] = [
  {
    key: "company_name",
    label: "Tên công ty",
    description: "Tên công ty/cửa hàng hiển thị trên website",
    type: "text",
    icon: Building2,
    placeholder: "Nhập tên công ty",
  },
  {
    key: "company_address",
    label: "Địa chỉ công ty",
    description: "Địa chỉ đầy đủ của công ty",
    type: "textarea",
    icon: MapPin,
    placeholder: "Nhập địa chỉ công ty",
  },
  {
    key: "company_phone",
    label: "Số điện thoại",
    description: "Số điện thoại liên hệ",
    type: "text",
    icon: Phone,
    placeholder: "VD: 0123456789",
  },
  {
    key: "company_email",
    label: "Email liên hệ",
    description: "Email liên hệ chính thức",
    type: "email",
    icon: Mail,
    placeholder: "contact@example.com",
  },
  {
    key: "low_stock_threshold",
    label: "Ngưỡng cảnh báo tồn kho thấp",
    description: "Số lượng sản phẩm tối thiểu để cảnh báo tồn kho thấp",
    type: "number",
    icon: Package,
    placeholder: "10",
    min: 1,
    max: 1000,
  },
  {
    key: "order_auto_confirm",
    label: "Tự động xác nhận đơn hàng",
    description: "Tự động xác nhận đơn hàng mới (1 = Bật, 0 = Tắt)",
    type: "number",
    icon: ShoppingCart,
    placeholder: "0",
    min: 0,
    max: 1,
  },
  {
    key: "max_order_items",
    label: "Số lượng sản phẩm tối đa mỗi đơn",
    description: "Giới hạn số lượng sản phẩm có thể thêm vào một đơn hàng",
    type: "number",
    icon: ShoppingCart,
    placeholder: "50",
    min: 1,
    max: 1000,
  },
  {
    key: "maintenance_mode",
    label: "Chế độ bảo trì",
    description: "Bật chế độ bảo trì (1 = Bật, 0 = Tắt)",
    type: "number",
    icon: AlertTriangle,
    placeholder: "0",
    min: 0,
    max: 1,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [configs, setConfigs] = useState<SystemConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && user?.role !== "Admin") {
      router.push("/admin/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "Admin") {
      loadConfigs();
    }
  }, [user]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await configApi.getAll();
      setConfigs(data || {});
    } catch (err: any) {
      console.error("Error loading configs:", err);
      showToast("Không thể tải cấu hình hệ thống", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    // Validation
    const field = CONFIG_FIELDS.find((f) => f.key === key);
    if (!field) return;

    const error: string[] = [];

    if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error.push("Email không hợp lệ");
    }

    if (field.type === "number") {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        error.push("Giá trị phải là số");
      } else {
        if (field.min !== undefined && numValue < field.min) {
          error.push(`Giá trị tối thiểu là ${field.min}`);
        }
        if (field.max !== undefined && numValue > field.max) {
          error.push(`Giá trị tối đa là ${field.max}`);
        }
      }
    }

    if (error.length > 0) {
      setErrors((prev) => ({ ...prev, [key]: error[0] }));
      return;
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });

    try {
      setSaving(key);
      await configApi.update(key, value);
      setConfigs((prev) => ({ ...prev, [key]: value }));
      showToast(`Đã cập nhật ${field.label} thành công`, "success");
    } catch (err: any) {
      console.error("Error saving config:", err);
      showToast(`Không thể cập nhật ${field.label}`, "error");
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (key: string, value: string) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "Admin") {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Settings size={28} />
          Cấu hình hệ thống
        </h1>
        <p className={styles.subtitle}>Quản lý các thiết lập hệ thống (Chỉ dành cho Admin)</p>
      </div>

      <div className={styles.configGrid}>
        {CONFIG_FIELDS.map((field) => {
          const Icon = field.icon;
          const value = configs[field.key] || "";
          const isSaving = saving === field.key;
          const hasError = !!errors[field.key];

          return (
            <div key={field.key} className={styles.configCard}>
              <div className={styles.configHeader}>
                <div className={styles.configIcon}>
                  <Icon size={20} />
                </div>
                <div className={styles.configInfo}>
                  <h3 className={styles.configLabel}>{field.label}</h3>
                  <p className={styles.configDescription}>{field.description}</p>
                </div>
              </div>

              <div className={styles.configBody}>
                {field.type === "textarea" ? (
                  <textarea
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    onBlur={() => handleSave(field.key, value)}
                    placeholder={field.placeholder}
                    className={`${styles.configInput} ${hasError ? styles.inputError : ""}`}
                    rows={3}
                    disabled={isSaving}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    onBlur={() => handleSave(field.key, value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSave(field.key, value);
                      }
                    }}
                    placeholder={field.placeholder}
                    className={`${styles.configInput} ${hasError ? styles.inputError : ""}`}
                    min={field.min}
                    max={field.max}
                    disabled={isSaving}
                  />
                )}

                {errors[field.key] && (
                  <span className={styles.errorText}>{errors[field.key]}</span>
                )}

                <button
                  type="button"
                  onClick={() => handleSave(field.key, value)}
                  disabled={isSaving || hasError}
                  className={styles.saveButton}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.infoBox}>
        <AlertTriangle size={20} />
        <div>
          <strong>Lưu ý:</strong>
          <ul>
            <li>Các thay đổi sẽ được lưu tự động khi bạn nhấn nút "Lưu" hoặc rời khỏi trường nhập liệu</li>
            <li>Một số cấu hình có thể yêu cầu khởi động lại server để có hiệu lực</li>
            <li>Vui lòng kiểm tra kỹ trước khi lưu các thay đổi quan trọng</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
