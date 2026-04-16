const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

app.get('/', (req, res) => {
  res.json({
    message: 'DevOps Pro Application',
    environment: ENV,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', environment: ENV });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${ENV} environment`);
});
