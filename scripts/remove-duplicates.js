const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { MongoClient } = require('mongodb');

async function removeDuplicates() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found");
    return;
  }
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('products');
    
    const name = 'Vintage Wooden Sailing Boat Model Miniature';
    const products = await collection.find({ Name: name }).toArray();
    
    console.log(`Found ${products.length} products with name: ${name}`);
    
    if (products.length > 1) {
      const idsToDelete = products.slice(1).map(p => p._id);
      const result = await collection.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Deleted ${result.deletedCount} duplicates!`);
    } else {
      console.log("No duplicates found to delete.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

removeDuplicates();
