export interface UserData {
  email: string;
  family_name: string;
  given_name: string;
  name: string;
}

export interface ProductRaw {
  id: number;
  nombre: string | null;
  descripcion: string | null;
  precio: number | null;
  stock: number | null;
  categoria_id: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
}
