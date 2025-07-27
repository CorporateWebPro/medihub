import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside className="w-64 bg-gray-900 text-white min-h-screen">
          <div className="p-4">
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </div>
          <nav className="mt-8">
            <a href="/admin" className="admin-nav-item">Dashboard</a>
            <a href="/admin/products" className="admin-nav-item">Products</a>
            <a href="/admin/orders" className="admin-nav-item">Orders</a>
            <a href="/admin/customers" className="admin-nav-item">Customers</a>
            <a href="/admin/reviews" className="admin-nav-item">Reviews</a>
            <a href="/admin/categories" className="admin-nav-item">Categories</a>
          </nav>
        </aside>
        
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;