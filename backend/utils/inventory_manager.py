# backend/utils/inventory_manager.py
"""
Inventory management utilities for handling stock updates safely.
This module provides transaction-safe inventory operations.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.models import DonHang, DonHang_SanPham, SanPham
from typing import List, Dict, Tuple, Optional
import logging

class InventoryError(Exception):
    """Custom exception for inventory-related errors"""
    pass

class InventoryManager:
    """Handles inventory operations with transaction safety"""
    
    @staticmethod
    def handle_inventory_change(
        db: Session, 
        order_id: int, 
        new_status: str, 
        old_status: str = None
    ) -> Tuple[bool, str]:
        """
        Handle inventory changes when order status changes.
        Uses database transactions to ensure data consistency.
        
        Args:
            db: Database session
            order_id: ID of the order
            new_status: New order status
            old_status: Previous order status (optional)
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        try:
            # Start transaction
            db.begin()
            
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
            
            # Determine inventory action based on status change
            action = InventoryManager._determine_inventory_action(old_status, new_status)
            
            if action == "none":
                # No inventory change needed
                db.commit()
                return True, "No inventory change required"
            
            # Process inventory changes for each item
            for item in order_items:
                product = db.query(SanPham).filter(SanPham.MaSP == item.MaSP).first()
                if not product:
                    raise InventoryError(f"Product {item.MaSP} not found")
                
                if action == "reserve":
                    # Reserve stock (subtract from available)
                    if product.SoLuongTonKho < item.SoLuong:
                        raise InventoryError(
                            f"Insufficient stock for product {product.TenSP}. "
                            f"Available: {product.SoLuongTonKho}, Required: {item.SoLuong}"
                        )
                    product.SoLuongTonKho -= item.SoLuong
                    
                elif action == "release":
                    # Release stock (add back to available)
                    product.SoLuongTonKho += item.SoLuong
                    
                elif action == "confirm":
                    # Confirm reservation (no additional change needed)
                    # Stock was already reserved when order was created
                    pass
                    
                elif action == "cancel":
                    # Cancel order (restore stock)
                    product.SoLuongTonKho += item.SoLuong
                
                # Log the inventory change
                logging.info(
                    f"Inventory change for product {product.TenSP} (ID: {product.MaSP}): "
                    f"Action: {action}, Quantity: {item.SoLuong}, "
                    f"New stock: {product.SoLuongTonKho}"
                )
            
            # Update order status
            order.TrangThai = new_status
            
            # Commit transaction
            db.commit()
            
            return True, f"Inventory updated successfully for order {order_id}"
            
        except InventoryError as e:
            # Rollback transaction on inventory error
            db.rollback()
            logging.error(f"Inventory error for order {order_id}: {str(e)}")
            return False, str(e)
            
        except Exception as e:
            # Rollback transaction on any other error
            db.rollback()
            logging.error(f"Unexpected error for order {order_id}: {str(e)}")
            return False, f"Unexpected error: {str(e)}"
    
    @staticmethod
    def _determine_inventory_action(old_status: str, new_status: str) -> str:
        """
        Determine what inventory action to take based on status change.
        
        Args:
            old_status: Previous order status
            new_status: New order status
            
        Returns:
            str: Action to take ('reserve', 'release', 'confirm', 'cancel', 'none')
        """
        # Define status flow and inventory actions
        status_flow = {
            "Pending": "reserve",      # Reserve stock when order is pending
            "Confirmed": "confirm",     # Confirm reservation when order is confirmed
            "Processing": "none",       # No change during processing
            "Shipped": "none",         # No change when shipped
            "Delivered": "none",       # No change when delivered
            "Cancelled": "cancel",     # Release stock when cancelled
            "Returned": "release"      # Release stock when returned
        }
        
        # If no old status, assume it's a new order
        if not old_status:
            return status_flow.get(new_status, "none")
        
        # Handle specific status transitions
        if old_status == "Pending" and new_status == "Confirmed":
            return "confirm"  # Confirm the reservation
        elif old_status == "Pending" and new_status == "Cancelled":
            return "cancel"    # Release reserved stock
        elif old_status in ["Confirmed", "Processing"] and new_status == "Cancelled":
            return "cancel"    # Release stock when cancelling confirmed order
        elif old_status == "Delivered" and new_status == "Returned":
            return "release"   # Release stock when order is returned
        elif new_status in ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"]:
            return "none"     # No inventory change for these statuses
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
            db.begin()
            
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
