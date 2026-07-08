import { toggleProductLiveAction } from './src/app/actions';
import mongooseConnect from './src/lib/mongooseConnect';
import Product from './src/models/Product';

async function test() {
    await mongooseConnect();
    const p = await Product.findOne({});
    console.log("Found product:", p.Name, "showOnStore:", p.showOnStore);
    
    // Simulate what the client sends
    const productId = p._id.toString();
    const nextValue = false; // toggle off

    // Call update directly to bypass assertAdmin for test
    const res = await Product.updateOne(
        { _id: productId },
        { $set: { showOnStore: nextValue } }
    );
    console.log("Update result:", res);

    const pAfter = await Product.findOne({ _id: p._id });
    console.log("After update showOnStore:", pAfter.showOnStore);
}

test().catch(console.error).then(() => process.exit(0));
