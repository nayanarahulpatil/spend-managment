export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/spend-management',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey123!',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkey123!',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  openaiApiKey: process.env.OPENAI_API_KEY || 'mock-key',
  firebaseConfig: process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : null,
});
