import { Product, ProductRaw } from './types';

export function processProduct(productRaw: ProductRaw) {
  return {
    id: productRaw.id,
    category_id: productRaw.categoria_id,
    description: productRaw.descripcion || 'Sin descripción',
    name: productRaw.nombre || 'Sin nombre',
    price: productRaw.precio || 0,
    stock: productRaw.precio || 0,
  } satisfies Product;
}
