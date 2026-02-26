require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const testConnection = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ MONGODB_URI not found in .env file.');
    process.exit(1);
  }

  console.log('Attempting to connect to MongoDB Atlas...');
  console.log('URI:', mongoURI.replace(/:([^:]+)@/, ':<password>@')); // Log URI without password

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // Give it 10 seconds to connect
    });
    console.log('✅ MongoDB connection successful!');
    await mongoose.disconnect();
    console.log('Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();
