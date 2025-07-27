import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="medical-gradient text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Medical Equipment for Kenya's Healthcare
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Providing hospitals, clinics, dental practices, and laboratories with 
            reliable, high-quality medical equipment and exceptional service.
          </p>
          <div className="space-x-4">
            <Link to="/products" className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Browse Products
            </Link>
            <Link to="/contact" className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary">
              Get Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Equipment Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Hospital Equipment', icon: '🏥', count: '50+ Products' },
              { name: 'Dental Equipment', icon: '🦷', count: '20+ Products' },
              { name: 'Laboratory Equipment', icon: '🔬', count: '20+ Products' },
              { name: 'Orthopedics', icon: '🦴', count: '10+ Products' }
            ].map((category, index) => (
              <div key={index} className="category-card">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-gray-600">{category.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Quality Assured',
                description: 'All equipment meets international medical standards and certifications.',
                icon: '✓'
              },
              {
                title: 'Kenya-Wide Delivery',
                description: 'Fast and secure delivery to all counties across Kenya.',
                icon: '🚚'
              },
              {
                title: 'Expert Support',
                description: '24/7 customer support and technical assistance.',
                icon: '💬'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;