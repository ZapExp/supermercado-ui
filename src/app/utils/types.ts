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
  id: number;
  nombre: string;
}
