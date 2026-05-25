const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { seedExercises, seedEssentialFoods, seedBrandedFoods } = require('./seed');

const authMiddleware = require('./middleware/auth');
const authRouter = require('./routes/auth');
const foodsRouter = require('./routes/foods');
const exercisesRouter = require('./routes/exercises');
const usersRouter = require('./routes/users');
const logsRouter = require('./routes/logs');
const weightRouter = require('./routes/weight');
const customFoodsRouter = require('./routes/customFoods');
const recipesRouter = require('./routes/recipes');
const barcodeRouter = require('./routes/barcode');
const analyticsRouter = require('./routes/analytics');
const measurementsRouter = require('./routes/measurements');
const waterRouter = require('./routes/water');
const fastingRouter = require('./routes/fasting');
const gamificationRouter = require('./routes/gamification');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS_ORIGINS env var: comma-separated list of allowed origins
// e.g. "https://myapp.pages.dev,https://api.myapp.pages.dev"
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [];
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/barcode', barcodeRouter);

// Protected routes — require valid JWT
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/logs', authMiddleware, logsRouter);
app.use('/api/weight', authMiddleware, weightRouter);
app.use('/api/custom-foods', authMiddleware, customFoodsRouter);
app.use('/api/recipes', authMiddleware, recipesRouter);
app.use('/api/analytics', authMiddleware, analyticsRouter);
app.use('/api/measurements', authMiddleware, measurementsRouter);
app.use('/api/water', authMiddleware, waterRouter);
app.use('/api/fasting', authMiddleware, fastingRouter);
app.use('/api/gamification', authMiddleware, gamificationRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const start = async () => {
  try {
    await connectDB();
    await seedExercises();
    await seedEssentialFoods();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on port ${PORT}`);
    });
    seedBrandedFoods();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
