"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { cartApi } from "@/app/lib/api/cart";
import { productsApi } from "@/app/lib/api/products";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock?: number; // Thêm thông tin tồn kho tối đa
  priceChanged?: boolean; // Đánh dấu nếu giá thay đổi
  unavailable?: boolean; // Đánh dấu nếu sản phẩm không còn
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (
    item: Omit<CartItem, "quantity">,
    quantity?: number
  ) => Promise<void>;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isLoading: boolean;
  validateCart: () => Promise<void>; // Thêm hàm validate
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "cart_items";

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cartItems]);

  const addToCart = async (
    item: Omit<CartItem, "quantity">,
    quantity: number = 1
  ) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      // Call backend API
      await cartApi.addToCart({
        sanPhamId: item.id,
        soLuong: quantity,
      });

      // Update local state
      setCartItems((prev) => {
        const existingItem = prev.find((cartItem) => cartItem.id === item.id);
        if (existingItem) {
          // If item exists, increase quantity
          return prev.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + quantity }
              : cartItem
          );
        } else {
          // If item doesn't exist, add it
          return [...prev, { ...item, quantity }];
        }
      });
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      // Show error message to user
      if (typeof window !== "undefined") {
        alert(error.message || "Không thể thêm sản phẩm vào giỏ hàng");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    // Kiểm tra tồn kho trước khi cập nhật
    try {
      const availability = await productsApi.checkAvailability(id, quantity);

      if (!availability.available) {
        alert(availability.reason || "Không thể cập nhật số lượng");

        // Nếu hết hàng hoàn toàn, đánh dấu unavailable
        if (availability.SoLuongTonKho === 0) {
          setCartItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, unavailable: true } : item
            )
          );
        }
        return;
      }

      // Cập nhật với thông tin mới từ server
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const priceChanged =
              availability.GiaSP && item.price !== availability.GiaSP;
            return {
              ...item,
              quantity,
              maxStock: availability.SoLuongTonKho,
              price: availability.GiaSP || item.price,
              name: availability.TenSP || item.name,
              image: availability.HinhAnh || item.image,
              priceChanged: priceChanged || item.priceChanged,
              unavailable: false,
            };
          }
          return item;
        })
      );

      if (
        availability.GiaSP &&
        cartItems.find((item) => item.id === id)?.price !== availability.GiaSP
      ) {
        alert(
          `Giá sản phẩm đã thay đổi: ${availability.GiaSP.toLocaleString(
            "vi-VN"
          )}₫`
        );
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      // Vẫn cho phép cập nhật nếu API lỗi
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  // Validate toàn bộ giỏ hàng
  const validateCart = async () => {
    if (cartItems.length === 0) return;

    setIsLoading(true);
    try {
      const validatedItems = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const availability = await productsApi.checkAvailability(
              item.id,
              item.quantity
            );

            const priceChanged =
              availability.GiaSP && item.price !== availability.GiaSP;
            const quantityAdjusted =
              !availability.available && availability.SoLuongTonKho
                ? availability.SoLuongTonKho
                : item.quantity;

            return {
              ...item,
              quantity: quantityAdjusted,
              maxStock: availability.SoLuongTonKho,
              price: availability.GiaSP || item.price,
              name: availability.TenSP || item.name,
              image: availability.HinhAnh || item.image,
              priceChanged: priceChanged,
              unavailable:
                !availability.available && !availability.SoLuongTonKho,
            };
          } catch (error) {
            console.error(`Error validating item ${item.id}:`, error);
            return item; // Giữ nguyên nếu lỗi
          }
        })
      );

      // Lọc bỏ sản phẩm không còn (unavailable = true)
      const availableItems = validatedItems.filter((item) => !item.unavailable);

      if (availableItems.length < cartItems.length) {
        alert(
          `Đã xóa ${
            cartItems.length - availableItems.length
          } sản phẩm không còn bán khỏi giỏ hàng`
        );
      }

      const priceChangedCount = availableItems.filter(
        (item) => item.priceChanged
      ).length;
      if (priceChangedCount > 0) {
        alert(`Có ${priceChangedCount} sản phẩm đã thay đổi giá`);
      }

      setCartItems(availableItems);
    } catch (error) {
      console.error("Error validating cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isLoading,
        validateCart, // Thêm vào provider
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
