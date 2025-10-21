// app/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Define types
type Product = {
  id: string;
  name: string;
  price: number;
  currency: string;
  img: string;
};

type CartItem = Product & { qty: number };

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart items on component mount
  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    try {
      const userId = localStorage.getItem('cart-user-id');
      if (!userId) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Try Firestore structure first
      const firestoreData = localStorage.getItem(`firestore:cart:${userId}`);
      if (firestoreData) {
        const parsed = JSON.parse(firestoreData);
        if (parsed && Array.isArray(parsed.items)) {
          // You would need to fetch product details from your CATALOG here
          // For now, we'll use the stored items as-is
          setCartItems(parsed.items as CartItem[]);
          setLoading(false);
          return;
        }
      }

      // Fallback to legacy structure
      const legacyData = localStorage.getItem('dn-cart');
      if (legacyData) {
        const items = JSON.parse(legacyData) as Array<{ id: string; qty: number }>;
        // Convert to CartItem format - you'll need to fetch product details
        const cartItems = items.map(item => ({
          id: item.id,
          name: `Product ${item.id}`,
          price: item.id === 'growth-100' ? 300 : 260,
          currency: 'R',
          img: '/products/hair-growth-oil-100ml.png',
          qty: item.qty
        }));
        setCartItems(cartItems);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return;

    const updatedItems = cartItems.map(item =>
      item.id === id ? { ...item, qty: newQty } : item
    );
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = cartItems.filter(item => item.id !== id);
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const saveCart = (items: CartItem[]) => {
    try {
      const userId = localStorage.getItem('cart-user-id');
      if (!userId) return;

      const storedItems = items.map(item => ({
        id: item.id,
        qty: item.qty
      }));

      // Save in both formats for compatibility
      const firestoreData = { userId, items: storedItems, updatedAt: Date.now() };
      localStorage.setItem(`firestore:cart:${userId}`, JSON.stringify(firestoreData));
      localStorage.setItem('dn-cart', JSON.stringify(storedItems));

      // Dispatch event for other components to sync
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      const userId = localStorage.getItem('cart-user-id');
      if (userId) {
        localStorage.removeItem(`firestore:cart:${userId}`);
      }
      localStorage.removeItem('dn-cart');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-emerald-900 mb-8">Your Cart</h1>
          <div className="animate-pulse">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-emerald-900 mb-8">Your Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-emerald-900 mb-4">Your cart is empty</h2>
            <p className="text-emerald-700 mb-6">Add some products to get started!</p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Cart Items */}
            <div className="divide-y">
              {cartItems.map((item) => (
                <div key={item.id} className="p-6 flex items-center gap-4">
                  <Image
                    src={item.img}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-900">{item.name}</h3>
                    <p className="text-emerald-700">
                      {item.currency} {item.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-emerald-50 transition"
                        disabled={item.qty <= 1}
                      >
                        −
                      </button>
                      <span className="w-12 h-10 flex items-center justify-center text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-emerald-50 transition"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-20 text-right font-semibold text-emerald-900">
                      {item.currency} {(item.price * item.qty).toLocaleString()}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-10 h-10 flex items-center justify-center text-red-600 hover:bg-red-50 rounded transition"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="p-6 border-t bg-emerald-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-emerald-700">Subtotal ({totalItems} items):</span>
                <span className="text-xl font-semibold text-emerald-900">
                  R {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearCart}
                  className="flex-1 py-3 px-6 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-white transition"
                >
                  Clear Cart
                </button>
                
                <Link
                  href="/checkout"
                  className="flex-1 py-3 px-6 bg-emerald-600 text-white text-center rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  Proceed to Checkout
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/shop"
                  className="text-emerald-600 hover:text-emerald-700 underline"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Remove any export that's not default, metadata, or generateMetadata
// If you need the clear cart functionality, make it a regular function inside the component