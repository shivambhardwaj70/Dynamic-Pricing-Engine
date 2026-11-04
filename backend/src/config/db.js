const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI provided in environment variables.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1); // Stop the process with failure if DB cannot connect
  }
};

module.exports = connectDB;

