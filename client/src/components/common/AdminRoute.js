import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectUserRole, selectIsAuthenticated } from '../../store/slices/authSlice';

const AdminRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin' && userRole !== 'superAdmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;