
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

if(fs.existsSync('.env.local')) dotenv.config({path: '.env.local'});
else if(fs.existsSync('.env')) dotenv.config({path: '.env'});

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const prodCount = await mongoose.connection.collection('products').countDocuments();
  console.log('Total products:', prodCount);
  
  try {
    const searchRes = await mongoose.connection.collection('products').aggregate([
      { $search: { index: 'default', text: { query: 'demo', path: 'Name' } } }
    ]).toArray();
    console.log('Search res for demo:', searchRes.length);
  } catch(e) {
    console.error('Search error:', e.message);
  }
  process.exit();
}).catch(console.error);

