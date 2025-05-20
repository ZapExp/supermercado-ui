export interface UserData {
  email: string;
  family_name: string;
  given_name: string;
  name: string;
}

export interface Product {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria_id: number;
}

export interface ConfirmationResult<T> {
  confirmed: boolean;
  data: T | null;
}

export interface Category {
  id?: number;
  nombre: string;
}

export interface Client {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface SaleCartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  availableStock: number;
}

export interface CreateSaleResponse {
  id: number;
  cliente_id: number;
  total: number;
  fecha: string;
}

export interface CreateSaleDetailPayload {
  venta_id: number;
  producto_id: number;
  cantidad: number;
  subtotal: number;
}

export interface CreateSalePayload {
  cliente_id: number;
  total: number;
}
