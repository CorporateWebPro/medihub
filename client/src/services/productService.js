import { apiGet } from './api';

const productService = {
  getProducts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiGet(`/products?${queryString}`);
  },

  getProduct: (id) => {
    return apiGet(`/products/${id}`);
  },

  getFeaturedProducts: () => {
    return apiGet('/products/featured');
  },

  searchProducts: (query) => {
    return apiGet(`/products/search?q=${encodeURIComponent(query)}`);
  },

  getProductsByCategory: (categoryId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiGet(`/products/categories/${categoryId}?${queryString}`);
  },

  getBrands: () => {
    return apiGet('/products/meta/brands');
  },

  getFilters: (categoryId) => {
    const url = categoryId ? `/products/meta/filters?category=${categoryId}` : '/products/meta/filters';
    return apiGet(url);
  }
};

export default productService;