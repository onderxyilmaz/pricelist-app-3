# Pricelist & Offer Management Application

A comprehensive full-stack application for managing pricelists, offers, customers, and products with advanced Excel import/export capabilities and multi-language support.

## 🌟 Key Features

### 📊 Advanced Offer Management
- **6-Step Wizard System**: Intuitive step-by-step offer creation process
- **Net Price & List Price Columns**: Clear pricing structure with color-coded differentiation
- **Product Sales Discount**: Strategic discount positioning and calculation
- **Offer Templates**: Pre-configured templates for quick offer generation
- **Multi-Customer Support**: Manage offers across different customers
- **Real-time Calculations**: Automatic price calculations with discount applications

### 📈 Comprehensive Pricelist Management
- **Dynamic Pricelist Creation**: Flexible pricelist generation with customizable parameters
- **Multi-language Product Names**: Turkish and English product name support
- **Excel Import/Export**: Advanced Excel processing with header flexibility
- **Batch Operations**: Efficient bulk product management
- **Price History Tracking**: Monitor price changes over time

### 🏢 Customer & User Management
- **Customer Profiles**: Complete customer information management
- **User Role System**: Admin and user role differentiation
- **Avatar Management**: User profile picture upload and management
- **Authentication System**: Secure login/logout with session management

### 📋 Template System
- **Offer Templates**: Reusable offer configurations
- **Template Categories**: Organized template management
- **Quick Template Application**: One-click template deployment
- **Template Customization**: Flexible template modification

### 🌐 Multi-language Support
- **Turkish/English Interface**: Complete bilingual support
- **Language-aware Excel Import**: Intelligent language detection and processing
- **Dual Product Names**: Products with both Turkish and English names
- **Localized Notifications**: Language-specific user feedback

### 📁 Advanced Excel Features
- **Flexible Header Mapping**: Automatic header detection and mapping
- **Language Selection Enforcement**: Mandatory language selection for consistency
- **Error Handling**: Comprehensive error detection and reporting
- **Progress Tracking**: Real-time import progress indication
- **Data Validation**: Thorough data validation before import

## 🛠 Technology Stack

### Frontend
- **React 19.1.1**: Latest React version with modern hooks and features
- **Ant Design 5.27.0**: Professional UI component library
- **Vite 7.1.2**: Fast build tool and development server
- **JavaScript/JSX**: Modern JavaScript with JSX syntax
- **CSS3**: Responsive design with custom styling

### Backend
- **Fastify 4.24.3**: High-performance web framework
- **Node.js**: JavaScript runtime environment
- **PostgreSQL**: Robust relational database system
- **Multer**: File upload handling middleware
- **CORS**: Cross-origin resource sharing configuration

### Database Schema
- **8 Main Tables**: Comprehensive data structure
  - `users`: User management and authentication
  - `customers`: Customer information and relationships
  - `pricelists`: Pricelist configurations and metadata
  - `pricelist_items`: Individual product entries with dual language support
  - `offers`: Offer management and tracking
  - `offer_items`: Detailed offer line items
  - `offer_templates`: Reusable offer templates
  - `offer_template_items`: Template item configurations

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pricelist-app-3
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb pricelist_app

   # Run setup scripts in order
   psql -d pricelist_app -f setup_database.sql
   psql -d pricelist_app -f add_dual_language_names.sql
   psql -d pricelist_app -f add_offer_templates.sql
   psql -d pricelist_app -f update_offer_templates_users.sql
   ```

3. **Backend Installation**
   ```bash
   cd backend
   npm install
   npm start
   ```

4. **Frontend Installation**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📁 Project Structure

```
pricelist-app-3/
├── backend/                 # Fastify backend application
│   ├── server.js           # Main server configuration
│   ├── src/routes/         # API route definitions
│   │   ├── adminRoutes.js  # Admin-specific endpoints
│   │   ├── authRoutes.js   # Authentication endpoints
│   │   ├── offerRoutes.js  # Offer management endpoints
│   │   └── pricelistRoutes.js # Pricelist endpoints
│   └── uploads/avatars/    # User avatar storage
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Navbar.jsx  # Navigation component
│   │   │   ├── Sidebar.jsx # Sidebar navigation
│   │   │   └── LogoutHandler.jsx # Logout functionality
│   │   ├── pages/          # Main application pages
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── Offers.jsx         # Offer wizard system
│   │   │   ├── OfferTemplates.jsx # Template management
│   │   │   ├── Pricelist.jsx      # Pricelist management
│   │   │   ├── Customers.jsx      # Customer management
│   │   │   ├── ImportExcel.jsx    # Excel import interface
│   │   │   └── UserManagement.jsx # User administration
│   │   └── utils/          # Utility functions
│   │       ├── api.js      # API communication layer
│   │       └── notification.js # Notification system
└── *.sql                   # Database setup scripts
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### Offers
- `GET /api/offers` - Retrieve all offers
- `POST /api/offers` - Create new offer
- `PUT /api/offers/:id` - Update existing offer
- `DELETE /api/offers/:id` - Delete offer
- `GET /api/offer-templates` - Get offer templates
- `POST /api/offer-templates` - Create offer template

### Pricelists
- `GET /api/pricelists` - Get all pricelists
- `POST /api/pricelists` - Create new pricelist
- `POST /api/pricelists/import` - Import pricelist from Excel
- `GET /api/pricelists/:id/export` - Export pricelist to Excel

### Customers
- `GET /api/customers` - Retrieve customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Admin
- `GET /admin/users` - Get all users (admin only)
- `PUT /admin/users/:id` - Update user (admin only)
- `DELETE /admin/users/:id` - Delete user (admin only)

## 💡 Usage Guide

### Creating an Offer (6-Step Wizard)
1. **Select Customer**: Choose target customer from dropdown
2. **Choose Template**: Select pre-configured template (optional)
3. **Configure Products**: Add products with pricing
4. **Set Pricing**: Configure Net Price and List Price columns
5. **Apply Discounts**: Set Product Sales Discount percentages
6. **Review & Submit**: Final review and offer generation

### Excel Import Process
1. **Select Language**: Choose Turkish or English (mandatory)
2. **Upload File**: Select Excel file with product data
3. **Map Headers**: Automatic header detection and mapping
4. **Validate Data**: System validates imported data
5. **Complete Import**: Products added to pricelist

### Template Management
1. **Create Template**: Define reusable offer configurations
2. **Assign Products**: Add products to template
3. **Set Default Values**: Configure default pricing and discounts
4. **Apply to Offers**: Use templates in offer creation wizard

## 🔍 Troubleshooting

### Database Issues
- **Connection Problems**: Verify PostgreSQL service is running
- **Schema Errors**: Ensure all SQL scripts executed in correct order
- **Permission Issues**: Check database user permissions

### Frontend Issues
- **Build Errors**: Clear node_modules and reinstall dependencies
- **API Connection**: Verify backend server is running on port 3000
- **Route Issues**: Check Vite configuration and proxy settings

### Import/Export Problems
- **Excel Format**: Ensure Excel file has proper headers
- **Language Selection**: Language selection is mandatory for imports
- **File Size**: Large files may require timeout adjustments

### Authentication Issues
- **Login Problems**: Check database user records
- **Session Timeout**: Verify session management configuration
- **Logout Redirect**: Ensure proper URL redirection after logout

## 🔒 Security Features

- **User Authentication**: Secure login/logout system
- **Role-based Access**: Admin and user role differentiation
- **File Upload Security**: Avatar upload with validation
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Proper cross-origin request handling

## 📈 Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Database Indexing**: Optimized database queries
- **File Compression**: Compressed static assets
- **Caching**: Client-side and server-side caching
- **Bundle Optimization**: Minimized JavaScript bundles

## 🌟 Advanced Features

### Multi-language Architecture
- Complete Turkish/English interface support
- Dual product name management
- Language-aware Excel processing
- Localized notifications and messages

### Excel Processing Engine
- Flexible header detection and mapping
- Batch processing capabilities
- Error handling and validation
- Progress tracking and reporting

### Template System
- Reusable offer configurations
- Quick template deployment
- Template categorization
- Custom template creation

## 🚀 Future Enhancements

- **Mobile Responsive Design**: Enhanced mobile experience
- **Advanced Reporting**: Comprehensive analytics dashboard
- **API Documentation**: Interactive API documentation
- **Unit Testing**: Comprehensive test suite
- **Performance Monitoring**: Application performance tracking
- **Multi-tenant Support**: Support for multiple organizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 👨‍💻 Author

**Önder Yılmaz**
- GitHub: [@onderxyilmaz](https://github.com/onderxyilmaz)

---

*This README provides comprehensive documentation for the Pricelist & Offer Management Application. For specific implementation details, please refer to the source code and inline comments.*