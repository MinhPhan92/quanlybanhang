-- =====================================================
-- Migration: Create PaymentTransaction table
-- Date: 2026-01-04
-- Description: Add table for mock QR payment gateway transactions
-- =====================================================

-- Create PaymentTransaction table for mock payment gateway
CREATE TABLE IF NOT EXISTS PaymentTransaction (
    TransactionId VARCHAR(50) PRIMARY KEY,          -- Unique transaction ID (TXN_YYYYMMDD_XXXXXXXX)
    MaDonHang INT UNSIGNED,                          -- Foreign key to DonHang (UNSIGNED to match DonHang.MaDonHang)
    Amount DECIMAL(12, 2) NOT NULL,                  -- Payment amount (locked to order total)
    Status VARCHAR(20) DEFAULT 'CREATED',            -- CREATED, SUCCESS, FAILED, CANCELED
    Signature VARCHAR(255),                          -- Hash signature for verification
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang) ON UPDATE CASCADE ON DELETE CASCADE,
    
    INDEX idx_order (MaDonHang),
    INDEX idx_status (Status),
    INDEX idx_created (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE PaymentTransaction COMMENT = 'Mock QR Payment Gateway transactions - for testing/demo purposes';
