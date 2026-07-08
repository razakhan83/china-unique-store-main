const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.useDb('test');
    const collection = db.collection('products');
    
    const p = await collection.findOne({});
    console.log('Current:', p.showOnStore);
    
    const res = await collection.updateOne({ _id: p._id }, { $set: { showOnStore: false } });
    console.log('Update Result:', res);
    
    const updated = await collection.findOne({ _id: p._id });
    console.log('New:', updated.showOnStore);
    
    process.exit(0);
}).catch(console.error);
