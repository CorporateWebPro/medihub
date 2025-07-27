# Medical Equipment Kenya E-Commerce Platform

A comprehensive, mobile-optimized e-commerce platform designed specifically for Kenya's healthcare sector, targeting hospitals, clinics, dental clinics, and laboratories.

## 🏥 Project Overview

This platform provides an intuitive shopping experience for medical equipment procurement with rich product details, customer reviews, advanced search filters, and secure payment integration. Built for scalability and tailored to Kenya's healthcare market.

## ✨ Features

### 🛍️ Customer Features
- **Modern UI/UX Design**: Clean, professional medical-themed layout
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop
- **Product Categories**: 
  - Hospital & Clinic Equipment (50+ products)
  - Dental Equipment (20+ products)
  - Laboratory Equipment (20+ products)
  - Orthopedics & Prosthetics (10+ products)
- **Advanced Filtering**: By brand, price range, product type, use case
- **Smart Search**: Auto-suggestions and category-level search
- **Product Reviews**: Verified purchase review system with ratings
- **Shopping Cart**: Persistent cart with bulk inquiry options
- **User Accounts**: Customer dashboard with order history and wishlists
- **Payment Integration**: Stripe gateway with M-Pesa support (planned)

### 👨‍💼 Admin Features
- **Comprehensive Dashboard**: Sales reports and analytics
- **Product Management**: Full CRUD with bulk import/export
- **Order Management**: Track orders from pending to delivery
- **Customer Management**: View customer history and assign custom pricing
- **Review Moderation**: Approve, reject, or respond to reviews
- **Inventory Management**: Stock tracking with low-stock alerts

### 🏥 Healthcare-Specific Features
- **B2B & B2C Support**: Individual and institutional customers
- **Request for Quote (RFQ)**: For large equipment purchases
- **Bulk Pricing**: Tiered pricing for quantity purchases
- **Medical Categories**: Specialized filtering by use case and facility type
- **Document Downloads**: Product brochures, manuals, and certificates
- **Regulatory Information**: Medical certifications and compliance details

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **File Upload**: Cloudinary integration
- **Payment**: Stripe (with M-Pesa planned)
- **Email**: NodeMailer
- **Validation**: Express Validator
- **Security**: Helmet, rate limiting, CORS

### Frontend
- **Framework**: React 18
- **State Management**: Redux Toolkit with Redux Persist
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom medical theme
- **Forms**: React Hook Form with Yup validation
- **UI Components**: Headless UI, Heroicons
- **HTTP Client**: Axios with interceptors
- **Notifications**: React Toastify

## 📦 Project Structure

```
medical-equipment-kenya/
├── server/                 # Backend API
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── scripts/           # Database seeding scripts
│   └── index.js           # Server entry point
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store and slices
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
└── package.json           # Root package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medical-equipment-kenya
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   ```
   
   Update `server/.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/medequip_kenya
   JWT_SECRET=your_super_secret_jwt_key_here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   CLIENT_URL=http://localhost:3000
   PORT=5000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or run separately
   npm run server:dev  # Backend only
   npm run client      # Frontend only
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📊 Database Models

### Core Models
- **User**: Customer accounts with B2B/B2C support
- **Product**: Medical equipment with detailed specifications
- **Category**: Hierarchical product categorization
- **Order**: Purchase orders with multiple payment methods
- **Review**: Customer reviews with moderation system

### Key Features
- **Relationships**: Proper referencing between models
- **Indexing**: Optimized for search and filtering
- **Validation**: Comprehensive field validation
- **Middleware**: Automatic slug generation, password hashing
- **Methods**: Business logic encapsulated in model methods

## 🔐 Authentication & Authorization

### User Roles
- **Customer**: Standard user with shopping capabilities
- **Admin**: Full platform management access
- **Super Admin**: Complete system control

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Email verification system
- Password reset functionality

## 🎨 UI/UX Design

### Design System
- **Medical Theme**: Professional healthcare-focused design
- **Color Palette**: Blue, green, and orange medical colors
- **Typography**: Inter font family for readability
- **Icons**: Heroicons for consistent iconography
- **Responsive**: Mobile-first approach with Tailwind CSS

### Component Library
- Reusable medical-themed components
- Consistent styling across pages
- Accessible design patterns
- Loading states and error handling

## 📱 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/verify-email` - Email verification

#### Products
- `GET /products` - Get products with filtering
- `GET /products/:id` - Get single product
- `GET /products/featured` - Get featured products
- `GET /products/search` - Search products

#### Categories
- `GET /categories` - Get all categories
- `GET /categories/main` - Get main categories
- `GET /categories/:id` - Get category details

#### Orders
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get single order
- `POST /orders` - Create new order

## 🚢 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure domain and CORS
5. Set up file storage (Cloudinary)
6. Configure email service
7. Set up payment webhooks

### Recommended Hosting
- **Backend**: DigitalOcean, AWS EC2, or Heroku
- **Frontend**: Netlify, Vercel, or AWS S3 + CloudFront
- **Database**: MongoDB Atlas or self-hosted
- **Files**: Cloudinary or AWS S3

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@medequipkenya.com or create an issue in the repository.

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- [x] Basic e-commerce functionality
- [x] User authentication
- [x] Product catalog
- [x] Shopping cart
- [x] Admin dashboard

### Phase 2 (Enhanced Features)
- [ ] Payment gateway integration (Stripe + M-Pesa)
- [ ] Advanced search and filtering
- [ ] Email notifications
- [ ] File upload system
- [ ] Advanced analytics

### Phase 3 (Scale & Optimize)
- [ ] Multi-vendor support
- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Integration with ERP systems
- [ ] AI-powered recommendations

## 📞 Contact

**MediHub Kenya**
- Website: https://medequipkenya.com
- Email: info@medequipkenya.com
- Phone: +254 700 000 000
- Address: Nairobi, Kenya

---

Built with ❤️ for Kenya's Healthcare Sector
