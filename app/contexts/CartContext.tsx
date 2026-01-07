"use client";

// =====================================================
// 📦 ORDER PROCESSING FLOW - STEP 1: CART MANAGEMENT
// =====================================================
// This context manages the shopping cart state throughout the order process.
// Flow:
// 1. User adds products to cart (addToCart)
// 2. Cart validates items against backend (stock, price)
// 3. Cart persists in localStorage
// 4. Cart items are used in checkout to create orders
// =====================================================

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

// Cart item interface - represents a product in the shopping cart
export interface CartItem {
  id: number; // Product ID (MaSP)
  name: string; // Product name
  price: number; // Current price (snapshot at add time, may be updated)
  image: string; // Product image URL
  quantity: number; // Quantity in cart
  maxStock?: number; // Maximum available stock (for validation)
  priceChanged?: boolean; // Flag if price changed since adding to cart
  unavailable?: boolean; // Flag if product is no longer available
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

// LocalStorage key for persisting cart data
const CART_STORAGE_KEY = "cart_items";

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ORDER FLOW STEP 1.1: Load cart from localStorage on component mount
  // This restores the user's cart when they return to the site
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

  // ORDER FLOW STEP 1.2: Persist cart to localStorage whenever it changes
  // Ensures cart data survives page refreshes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cartItems]);

  // ORDER FLOW STEP 1.3: Add product to cart
  // - Validates user authentication
  // - Calls backend API to add item to server-side cart
  // - Updates local state (adds new item or increases quantity)
  // - Cart items will be used later in checkout to create order
  const addToCart = async (
    item: Omit<CartItem, "quantity">,
    quantity: number = 1
  ) => {
    // Require authentication before adding to cart
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      // Call backend API to add item to cart
      // Backend validates stock availability
      await cartApi.addToCart({
        sanPhamId: item.id,
        soLuong: quantity,
      });

      // Update local cart state
      setCartItems((prev) => {
        const existingItem = prev.find((cartItem) => cartItem.id === item.id);
        if (existingItem) {
          // If item already in cart, increase quantity
          return prev.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + quantity }
              : cartItem
          );
        } else {
          // If item not in cart, add it as new item
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

  // ORDER FLOW STEP 1.4: Update item quantity in cart
  // - Validates stock availability before updating
  // - Updates price if it changed since adding to cart
  // - Marks item as unavailable if out of stock
  // - This ensures cart data is accurate before checkout
  const updateQuantity = async (id: number, quantity: number) => {
    // If quantity is 0 or negative, remove item from cart
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    // Check stock availability before updating quantity
    // This prevents ordering more than available stock
    try {
      const availability = await productsApi.checkAvailability(id, quantity);

      if (!availability.available) {
        alert(availability.reason || "Không thể cập nhật số lượng");

        // If completely out of stock, mark as unavailable
        if (availability.SoLuongTonKho === 0) {
          setCartItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, unavailable: true } : item
            )
          );
        }
        return;
      }

      // Update cart item with latest info from server
      // This syncs price, stock, and product details
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
              priceChanged: !!priceChanged || !!item.priceChanged, // Ensure boolean type
              unavailable: false,
            };
          }
          return item;
        })
      );

      // Alert user if price changed
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
      // Still allow update if API fails (graceful degradation)
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  // ORDER FLOW STEP 1.5: Validate entire cart before checkout
  // - Checks all items for stock availability and price changes
  // - Removes unavailable items
  // - Updates prices if changed
  // - Called before checkout to ensure cart is valid
  // - This prevents order creation with invalid cart data
  const validateCart = async () => {
    if (cartItems.length === 0) return;

    setIsLoading(true);
    try {
      // Validate each cart item against current product data
      const validatedItems = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const availability = await productsApi.checkAvailability(
              item.id,
              item.quantity
            );

            const priceChanged =
              availability.GiaSP && item.price !== availability.GiaSP;
            // Adjust quantity if requested amount not available
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
              priceChanged: !!priceChanged || !!item.priceChanged, // Ensure boolean type
              unavailable:
                !availability.available && !availability.SoLuongTonKho,
            };
          } catch (error) {
            console.error(`Error validating item ${item.id}:`, error);
            return item; // Keep original if validation fails
          }
        })
      );

      // Remove unavailable items from cart
      const availableItems = validatedItems.filter((item) => !item.unavailable);

      if (availableItems.length < cartItems.length) {
        alert(
          `Đã xóa ${
            cartItems.length - availableItems.length
          } sản phẩm không còn bán khỏi giỏ hàng`
        );
      }

      // Alert user about price changes
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

  // ORDER FLOW STEP 1.6: Clear cart after successful order
  // Called after order is successfully created in checkout
  const clearCart = () => {
    setCartItems([]);
  };

  // Helper: Get total number of items in cart
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // ORDER FLOW STEP 1.7: Calculate total cart price
  // Used in cart page and checkout page to display totals
  // This is the subtotal before shipping, tax, and discounts
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
