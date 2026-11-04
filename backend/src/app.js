const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const healthRoutes = require('./routes/health.routes');
const productRoutes = require('./routes/product.routes');
const notFoundHandler = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Core Middlewares
app.use(cors());
app.use(express.json());

// Log HTTP requests in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 2. API Routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productRoutes);

// 3. 404 Fallback Middleware (catches unknown routes)
app.use(notFoundHandler);

// 4. Global Error Handling Middleware (catches any unhandled errors)
app.use(errorHandler);

module.exports = app;
