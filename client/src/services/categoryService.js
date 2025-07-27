import { apiGet } from './api';

const categoryService = {
  getCategories: () => {
    return apiGet('/categories');
  },

  getCategory: (id) => {
    return apiGet(`/categories/${id}`);
  },

  getCategoryTree: () => {
    return apiGet('/categories/tree');
  }
};

export default categoryService;