import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (menuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_id === menuItem.item_id);
      if (existing) {
        return prev.map((i) =>
          i.item_id === menuItem.item_id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...menuItem, quantity }];
    });
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((i) => i.item_id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.item_id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + parseFloat(i.base_price) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
