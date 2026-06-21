const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://kumarrishi4981_db_user:Rishi%404981@cluster0.5dpsd9n.mongodb.net/mindflow?retryWrites=true&w=majority&appName=Cluster0';

console.log('Attempting to connect to MongoDB Atlas...');
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB Atlas!');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ Failed to connect:', err);
  process.exit(1);
});
