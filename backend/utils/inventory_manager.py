# =====================================================
# 📋 ORDER PROCESSING FLOW - STEP 6: INVENTORY MANAGEMENT
# =====================================================
# Inventory management utilities for handling stock updates safely.
# This module manages inventory changes when order status changes.
# Flow:
# 1. handle_inventory_change() - Called when order status is updated
# 2. Determines action based on status transition (reserve/release/confirm/cancel)
# 3. Updates product stock quantities atomically
# 4. Used by backend/routes/donhang.py update_order_status()
# =====================================================

from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.models import DonHang, DonHang_SanPham, SanPham
from typing import List, Dict, Tuple, Optional
import logging

class InventoryError(Exception):
    """Custom exception for inventory-related errors"""
    pass

class InventoryManager:
    """
    ORDER FLOW STEP 6: Handles inventory operations with transaction safety
    
    This class manages stock updates when orders change status.
    Critical operations:
    - Reserve stock when order is confirmed
    - Deduct stock when order is processing/shipped
    - Release stock when order is cancelled
    - All operations are atomic (within database transaction)
    """
    
    @staticmethod
    def _normalize_status(status: str) -> str:
        """
        Normalize Vietnamese status names to English for consistent processing.
        
        Args:
            status: Order status (can be Vietnamese or English)
            
        Returns:
            str: Normalized English status name
        """
        if not status:
            return status
        
        status_map = {
            # Vietnamese to English
            "Chờ thanh toán": "Pending",
            "Chờ xử lý": "Pending",
            "Đã xác nhận": "Confirmed",
            "Đang xử lý": "Processing",
            "Đã giao hàng": "Shipped",
            "Đã giao": "Delivered",
            "Đã hủy": "Cancelled",
            "Đã trả hàng": "Returned",
            # English variants
            "PENDING_PAYMENT": "Pending",
            "PAID": "Confirmed",
        }
        
        return status_map.get(status, status)
    
    # ORDER FLOW STEP 6.1: Handle inventory changes when order status changes
    # This is called from backend/routes/donhang.py update_order_status()
    # Determines what inventory action to take based on status transition
    @staticmethod
    def handle_inventory_change(
        db: Session, 
        order_id: int, 
        new_status: str, 
        old_status: str = None
    ) -> Tuple[bool, str]:
        """
        ORDER FLOW STEP 6.1.1: Handle inventory changes when order status changes
        
        This is the main inventory management function called when order status is updated.
        Uses database transactions to ensure data consistency.
        
        Inventory actions based on status transitions:
        - Pending → Confirmed/Processing: Reserve stock (subtract from available)
        - Processing → Shipped: Confirm stock deduction (already reserved)
        - Any → Cancelled: Release stock (add back to available)
        - Cancelled → Any: Reserve stock again (if order is reactivated)
        
        Args:
            db: Database session (transaction context)
            order_id: ID of the order
            new_status: New order status
            old_status: Previous order status (optional)
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        try:
            # Note: Don't call db.begin() - SQLAlchemy sessions are already transactional
            # The calling function will handle commit/rollback
            
            # Get order details
            order = db.query(DonHang).filter(DonHang.MaDonHang == order_id).first()
            if not order:
                raise InventoryError(f"Order {order_id} not found")
            
            # Get order items
            order_items = db.query(DonHang_SanPham).filter(
                DonHang_SanPham.MaDonHang == order_id
            ).all()
            
            if not order_items:
                raise InventoryError(f"No items found for order {order_id}")
            
            # Normalize status names for consistent processing
            normalized_old_status = InventoryManager._normalize_status(old_status) if old_status else None
            normalized_new_status = InventoryManager._normalize_status(new_status)
            
            # ORDER FLOW STEP 6.1.2: Determine inventory action based on status change
            # This analyzes the status transition and decides what to do with stock
            action = InventoryManager._determine_inventory_action(normalized_old_status, normalized_new_status)
            
            if action == "none":
                # No inventory change needed (e.g., status change that doesn't affect stock)
                return True, "No inventory change required"
            
            # ORDER FLOW STEP 6.1.3: Process inventory changes for each order item
            # Loop through all items in the order and update their stock
            for item in order_items:
                product = db.query(SanPham).filter(SanPham.MaSP == item.MaSP).first()
                if not product:
                    raise InventoryError(f"Product {item.MaSP} not found")
                
                if action == "reserve":
                    # ORDER FLOW STEP 6.1.4: Reserve stock (subtract from available)
                    # Used when order moves from Pending to Confirmed/Processing
                    # Stock is reserved but not yet deducted (can be released if order cancelled)
                    if product.SoLuongTonKho < item.SoLuong:
                        raise InventoryError(
                            f"Insufficient stock for product {product.TenSP}. "
                            f"Available: {product.SoLuongTonKho}, Required: {item.SoLuong}"
                        )
                    product.SoLuongTonKho -= item.SoLuong
                    
                elif action == "release":
                    # ORDER FLOW STEP 6.1.5: Release stock (add back to available)
                    # Used when order is cancelled or returned
                    # Restores stock that was previously reserved/deducted
                    product.SoLuongTonKho += item.SoLuong
                    
                elif action == "confirm":
                    # ORDER FLOW STEP 6.1.6: Deduct stock when order is confirmed
                    # This handles cases where order was created with "Chờ thanh toán" status
                    # and inventory wasn't reserved initially
                    # Check if stock was already deducted (in case order was created with Pending status)
                    # We need to deduct stock if it hasn't been deducted yet
                    if product.SoLuongTonKho < item.SoLuong:
                        raise InventoryError(
                            f"Insufficient stock for product {product.TenSP}. "
                            f"Available: {product.SoLuongTonKho}, Required: {item.SoLuong}"
                        )
                    product.SoLuongTonKho -= item.SoLuong
                    
                elif action == "cancel":
                    # ORDER FLOW STEP 6.1.7: Cancel order (restore stock)
                    # Only restore if stock was actually deducted
                    # This releases reserved/deducted stock back to available inventory
                    product.SoLuongTonKho += item.SoLuong
                
                # Log the inventory change
                logging.info(
                    f"Inventory change for product {product.TenSP} (ID: {product.MaSP}): "
                    f"Action: {action}, Quantity: {item.SoLuong}, "
                    f"New stock: {product.SoLuongTonKho}"
                )
            
            # Note: Don't update order.TrangThai here - the calling function handles it
            # Note: Don't commit here - the calling function will commit after all operations
            
            return True, f"Inventory updated successfully for order {order_id}"
            
        except InventoryError as e:
            # Don't rollback here - let the caller handle it
            # Changes won't be persisted if caller does rollback
            logging.error(f"Inventory error for order {order_id}: {str(e)}")
            return False, str(e)
            
        except Exception as e:
            # Don't rollback here - let the caller handle it
            # Changes won't be persisted if caller does rollback
            logging.error(f"Unexpected error for order {order_id}: {str(e)}")
            return False, f"Unexpected error: {str(e)}"
    
    @staticmethod
    def _determine_inventory_action(old_status: str, new_status: str) -> str:
        """
        Determine what inventory action to take based on status change.
        Status names should already be normalized to English.
        
        Business logic:
        - Pending: Order created, payment pending → Don't deduct stock yet
        - Confirmed: Order confirmed by staff → Deduct stock NOW
        - Processing/Shipped/Delivered: Stock already deducted → No change
        - Cancelled: Restore stock if it was deducted
        
        Args:
            old_status: Previous order status (normalized to English)
            new_status: New order status (normalized to English)
            
        Returns:
            str: Action to take ('reserve', 'release', 'confirm', 'cancel', 'none')
        """
        # If no old status, assume it's a new order
        if not old_status:
            # For new orders, deduct stock if status is Confirmed
            # Otherwise, don't deduct stock until confirmed
            if new_status == "Confirmed":
                return "confirm"
            return "none"
        
        # Handle specific status transitions
        if new_status == "Confirmed":
            # Deduct stock when order is confirmed (regardless of previous status)
            # This handles: Pending→Confirmed, or any other status→Confirmed
            return "confirm"
        elif new_status == "Cancelled":
            # Restore stock when order is cancelled
            # Only restore if stock was actually deducted (i.e., order was Confirmed or later)
            if old_status in ["Confirmed", "Processing", "Shipped", "Delivered"]:
                return "cancel"
            # If order was Pending and cancelled, no stock was deducted, so nothing to restore
            return "none"
        elif old_status == "Delivered" and new_status == "Returned":
            return "release"   # Release stock when order is returned
        elif new_status in ["Processing", "Shipped", "Delivered"]:
            # No inventory change for these statuses (stock already deducted when confirmed)
            return "none"
        else:
            return "none"
    
    @staticmethod
    def check_stock_availability(
        db: Session, 
        order_items: List[Dict]
    ) -> Tuple[bool, str, List[Dict]]:
        """
        Check if sufficient stock is available for all items in an order.
        
        Args:
            db: Database session
            order_items: List of items with MaSP and SoLuong
            
        Returns:
            Tuple[bool, str, List[Dict]]: (is_available, message, insufficient_items)
        """
        insufficient_items = []
        
        for item in order_items:
            product = db.query(SanPham).filter(SanPham.MaSP == item["MaSP"]).first()
            if not product:
                return False, f"Product {item['MaSP']} not found", []
            
            if product.SoLuongTonKho < item["SoLuong"]:
                insufficient_items.append({
                    "MaSP": product.MaSP,
                    "TenSP": product.TenSP,
                    "Available": product.SoLuongTonKho,
                    "Required": item["SoLuong"],
                    "Shortage": item["SoLuong"] - product.SoLuongTonKho
                })
        
        if insufficient_items:
            return False, "Insufficient stock for some items", insufficient_items
        
        return True, "All items have sufficient stock", []
    
    @staticmethod
    def get_low_stock_products(
        db: Session, 
        threshold: int = 10
    ) -> List[Dict]:
        """
        Get products with low stock levels.
        
        Args:
            db: Database session
            threshold: Stock threshold for low stock alert
            
        Returns:
            List[Dict]: List of products with low stock
        """
        low_stock_products = db.query(SanPham).filter(
            SanPham.SoLuongTonKho <= threshold,
            SanPham.IsDelete == False
        ).all()
        
        return [
            {
                "MaSP": product.MaSP,
                "TenSP": product.TenSP,
                "SoLuongTonKho": product.SoLuongTonKho,
                "GiaSP": float(product.GiaSP) if product.GiaSP else 0
            }
            for product in low_stock_products
        ]
    
    @staticmethod
    def update_product_stock(
        db: Session, 
        product_id: int, 
        quantity_change: int, 
        operation: str = "add"
    ) -> Tuple[bool, str]:
        """
        Update product stock quantity.
        
        Args:
            db: Database session
            product_id: Product ID
            quantity_change: Amount to change
            operation: "add" or "subtract"
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        try:
            # Note: Don't call db.begin() - SQLAlchemy sessions are already transactional
            # This method commits its own changes since it's called from routes that don't commit
            
            product = db.query(SanPham).filter(SanPham.MaSP == product_id).first()
            if not product:
                return False, f"Product {product_id} not found"
            
            if operation == "add":
                product.SoLuongTonKho += quantity_change
            elif operation == "subtract":
                if product.SoLuongTonKho < quantity_change:
                    return False, f"Insufficient stock. Available: {product.SoLuongTonKho}, Required: {quantity_change}"
                product.SoLuongTonKho -= quantity_change
            else:
                return False, "Invalid operation. Use 'add' or 'subtract'"
            
            # Ensure stock doesn't go negative
            if product.SoLuongTonKho < 0:
                product.SoLuongTonKho = 0
            
            db.commit()
            return True, f"Stock updated successfully. New quantity: {product.SoLuongTonKho}"
            
        except Exception as e:
            db.rollback()
            return False, f"Error updating stock: {str(e)}"
