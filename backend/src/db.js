const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrition_tracker';

  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      retries -= 1;
      console.error(`MongoDB connection failed. Retries left: ${retries}. Error: ${err.message}`);
      if (retries === 0) {
        throw err;
      }
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;
