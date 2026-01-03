/**
 * Development Server Starter
 * Uses mongodb-memory-server for local development without needing a real MongoDB instance
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

async function startDevServer() {
  console.log('🚀 Starting Dating App Backend in Development Mode...\n');

  // Start MongoDB Memory Server
  console.log('📦 Starting in-memory MongoDB server...');
  const mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'dating-app',
      port: 27017,
    },
  });

  const mongoUri = mongod.getUri();
  console.log(`✅ MongoDB Memory Server started at: ${mongoUri}\n`);

  // Set the MongoDB URI environment variable
  process.env.MONGODB_URI = mongoUri;
  process.env.NODE_ENV = 'development';

  // Now require and start the actual server
  console.log('🌐 Starting Express server...\n');
  require('./server');

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await mongod.stop();
    console.log('✅ MongoDB Memory Server stopped');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await mongod.stop();
    console.log('✅ MongoDB Memory Server stopped');
    process.exit(0);
  });
}

startDevServer().catch((error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});
