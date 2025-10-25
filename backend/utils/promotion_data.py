# backend/utils/promotion_data.py
"""
Mock promotional voucher data for the e-commerce system.
This file contains a fixed list of promotional codes with their rules and discounts.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional

class VoucherData:
    """Mock voucher data structure"""
    
    # Fixed list of promotional vouchers
    VOUCHERS = {
        # Percentage-based discounts
        "WELCOME10": {
            "code": "WELCOME10",
            "name": "Chào mừng khách hàng mới",
            "type": "percentage",
            "discount_value": 10,  # 10% off
            "min_order_amount": 100000,  # Minimum order 100k VND
            "max_discount": 50000,  # Maximum discount 50k VND
            "valid_from": datetime(2024, 1, 1),
            "valid_to": datetime(2025, 12, 31),
            "usage_limit": 1000,
            "used_count": 0,
            "is_active": True
        },
        "SAVE20": {
            "code": "SAVE20",
            "name": "Tiết kiệm 20%",
            "type": "percentage",
            "discount_value": 20,  # 20% off
            "min_order_amount": 200000,  # Minimum order 200k VND
            "max_discount": 100000,  # Maximum discount 100k VND
            "valid_from": datetime(2024, 1, 1),
            "valid_to": datetime(2025, 12, 31),
            "usage_limit": 500,
            "used_count": 0,
            "is_active": True
        },
        "VIP30": {
            "code": "VIP30",
            "name": "Khách hàng VIP",
            "type": "percentage",
            "discount_value": 30,  # 30% off
            "min_order_amount": 500000,  # Minimum order 500k VND
            "max_discount": 200000,  # Maximum discount 200k VND
            "valid_from": datetime(2024, 1, 1),
            "valid_to": datetime(2025, 12, 31),
            "usage_limit": 100,
            "used_count": 0,
            "is_active": True
        },
        
        # Fixed amount discounts
        "FLAT50K": {
            "code": "FLAT50K",
            "name": "Giảm 50k",
            "type": "fixed",
            "discount_value": 50000,  # 50k VND off
            "min_order_amount": 150000,  # Minimum order 150k VND
            "max_discount": 50000,  # Same as discount value for fixed
            "valid_from": datetime(2024, 1, 1),
            "valid_to": datetime(2025, 12, 31),
            "usage_limit": 2000,
            "used_count": 0,
            "is_active": True
        },
        "FLAT100K": {
            "code": "FLAT100K",
            "name": "Giảm 100k",
            "type": "fixed",
            "discount_value": 100000,  # 100k VND off
            "min_order_amount": 300000,  # Minimum order 300k VND
            "max_discount": 100000,  # Same as discount value for fixed
            "valid_from": datetime(2024, 1, 1),
            "valid_to": datetime(2025, 12, 31),
            "usage_limit": 1000,
            "used_count": 0,
            "is_active": True
        },
        
        # Special occasion vouchers
        "TET2025": {
            "code": "TET2025",
            "name": "Tết Nguyên Đán 2025",
            "type": "percentage",
            "discount_value": 25,  # 25% off
            "min_order_amount": 300000,  # Minimum order 300k VND
            "max_discount": 150000,  # Maximum discount 150k VND
            "valid_from": datetime(2025, 1, 20),
            "valid_to": datetime(2025, 2, 20),
            "usage_limit": 500,
            "used_count": 0,
            "is_active": True
        },
        "BLACKFRIDAY": {
            "code": "BLACKFRIDAY",
            "name": "Black Friday Sale",
            "type": "percentage",
            "discount_value": 40,  # 40% off
            "min_order_amount": 400000,  # Minimum order 400k VND
            "max_discount": 300000,  # Maximum discount 300k VND
            "valid_from": datetime(2024, 11, 20),
            "valid_to": datetime(2024, 12, 5),
            "usage_limit": 200,
            "used_count": 0,
            "is_active": True
        },
        
        # Free shipping vouchers
        "FREESHIP": {
            "code": "FREESHIP",
            "name": "Miễn phí vận chuyển",
            "type": "freeship",
            "discount_value": 0,  # No discount, just free shipping
            "min_order_amount": 100000,  # Minimum order 100k VND
            "max_discount": 0,
            "valid_from": datetime(2024, 1, 1),
            "valid_to": datetime(2025, 12, 31),
            "usage_limit": 5000,
            "used_count": 0,
            "is_active": True
        }
    }
    
    @staticmethod
    def get_voucher(code: str) -> Optional[Dict]:
        """Get voucher by code"""
        return VoucherData.VOUCHERS.get(code.upper())
    
    @staticmethod
    def get_all_vouchers() -> List[Dict]:
        """Get all active vouchers"""
        return [voucher for voucher in VoucherData.VOUCHERS.values() if voucher["is_active"]]
    
    @staticmethod
    def is_voucher_valid(code: str, order_amount: float) -> tuple[bool, str]:
        """
        Check if voucher is valid for the given order amount
        Returns: (is_valid, error_message)
        """
        voucher = VoucherData.get_voucher(code)
        
        if not voucher:
            return False, "Mã giảm giá không tồn tại"
        
        if not voucher["is_active"]:
            return False, "Mã giảm giá đã bị vô hiệu hóa"
        
        current_time = datetime.now()
        if current_time < voucher["valid_from"]:
            return False, "Mã giảm giá chưa có hiệu lực"
        
        if current_time > voucher["valid_to"]:
            return False, "Mã giảm giá đã hết hạn"
        
        if voucher["used_count"] >= voucher["usage_limit"]:
            return False, "Mã giảm giá đã hết lượt sử dụng"
        
        if order_amount < voucher["min_order_amount"]:
            return False, f"Đơn hàng tối thiểu {voucher['min_order_amount']:,} VND để sử dụng mã này"
        
        return True, ""
    
    @staticmethod
    def calculate_discount(code: str, order_amount: float) -> tuple[float, str]:
        """
        Calculate discount amount for the given voucher code and order amount
        Returns: (discount_amount, error_message)
        """
        is_valid, error_msg = VoucherData.is_voucher_valid(code, order_amount)
        if not is_valid:
            return 0, error_msg
        
        voucher = VoucherData.get_voucher(code)
        
        if voucher["type"] == "percentage":
            discount_amount = (order_amount * voucher["discount_value"]) / 100
            # Apply maximum discount limit
            discount_amount = min(discount_amount, voucher["max_discount"])
            
        elif voucher["type"] == "fixed":
            discount_amount = voucher["discount_value"]
            
        elif voucher["type"] == "freeship":
            # For free shipping, we assume shipping cost is 30k VND
            discount_amount = 30000
            
        else:
            return 0, "Loại mã giảm giá không được hỗ trợ"
        
        return discount_amount, ""
    
    @staticmethod
    def use_voucher(code: str) -> bool:
        """
        Mark voucher as used (increment used_count)
        In a real system, this would update the database
        """
        voucher = VoucherData.get_voucher(code)
        if voucher and voucher["used_count"] < voucher["usage_limit"]:
            voucher["used_count"] += 1
            return True
        return False
