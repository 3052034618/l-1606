import { create } from 'zustand';
import { ShoppingItem, CreateShoppingItemForm } from '@/types/shopping';
import { mockShoppingItems } from '@/data/shoppingMock';
import { generateId, getTodayTimeString } from '@/utils/date';
import { validateShoppingItemName, validateShoppingItemQuantity } from '@/utils/validator';
import { useFamilyStore } from './useFamilyStore';

interface ShoppingState {
  items: ShoppingItem[];
  loading: boolean;
  getItems: () => ShoppingItem[];
  getUncheckedItems: () => ShoppingItem[];
  getCheckedItems: () => ShoppingItem[];
  addItem: (form: CreateShoppingItemForm) => { success: boolean; message?: string };
  toggleItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  clearChecked: () => void;
  getCompletionRate: () => number;
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  items: mockShoppingItems,
  loading: false,

  getItems: () => {
    return [...get().items].sort((a, b) => {
      if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  getUncheckedItems: () => {
    return get().items.filter((i) => !i.isChecked);
  },

  getCheckedItems: () => {
    return get().items.filter((i) => i.isChecked);
  },

  addItem: (form) => {
    const nameValidation = validateShoppingItemName(form.name);
    if (!nameValidation.valid) {
      return { success: false, message: nameValidation.message };
    }

    const quantityValidation = validateShoppingItemQuantity(form.quantity);
    if (!quantityValidation.valid) {
      return { success: false, message: quantityValidation.message };
    }

    const { currentUser } = useFamilyStore.getState();
    const newItem: ShoppingItem = {
      id: generateId(),
      name: form.name,
      quantity: form.quantity,
      unit: form.unit,
      category: form.category,
      note: form.note,
      addedById: currentUser.id,
      addedByName: currentUser.name,
      createdAt: getTodayTimeString(),
      isChecked: false,
    };

    set((state) => ({
      items: [newItem, ...state.items],
    }));

    console.log('[Shopping] 商品添加成功', { itemId: newItem.id, name: newItem.name });
    return { success: true };
  },

  toggleItem: (itemId) => {
    const { currentUser } = useFamilyStore.getState();
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              isChecked: !i.isChecked,
              checkedById: !i.isChecked ? currentUser.id : undefined,
              checkedByName: !i.isChecked ? currentUser.name : undefined,
              checkedAt: !i.isChecked ? getTodayTimeString() : undefined,
            }
          : i
      ),
    }));
    console.log('[Shopping] 商品状态切换', { itemId });
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
    console.log('[Shopping] 商品删除', { itemId });
  },

  clearChecked: () => {
    set((state) => ({
      items: state.items.filter((i) => !i.isChecked),
    }));
    console.log('[Shopping] 清空已购商品');
  },

  getCompletionRate: () => {
    const items = get().items;
    if (items.length === 0) return 100;
    const checked = items.filter((i) => i.isChecked).length;
    return Math.round((checked / items.length) * 100);
  },
}));
