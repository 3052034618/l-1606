export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  addedById: string;
  addedByName: string;
  createdAt: string;
  isChecked: boolean;
  checkedById?: string;
  checkedByName?: string;
  checkedAt?: string;
  note?: string;
}

export interface CreateShoppingItemForm {
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  note?: string;
}

export const SHOPPING_CATEGORIES: { value: string; label: string }[] = [
  { value: 'vegetable', label: '蔬菜' },
  { value: 'fruit', label: '水果' },
  { value: 'meat', label: '肉类' },
  { value: 'seafood', label: '海鲜' },
  { value: 'dairy', label: '乳制品' },
  { value: 'snack', label: '零食' },
  { value: 'drink', label: '饮料' },
  { value: 'daily', label: '日用品' },
  { value: 'other', label: '其他' },
];
