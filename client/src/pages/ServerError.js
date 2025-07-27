import React from 'react';
import { Link } from 'react-router-dom';

const ServerError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">500</h1>
        <h2 className="text-2xl font-semibold mb-4">Server Error</h2>
        <p className="text-gray-600 mb-8">Something went wrong on our end.</p>
        <Link to="/" className="medical-button">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default ServerError;