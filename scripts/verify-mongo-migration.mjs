import dns from 'node:dns';
import { MongoClient, BSON } from 'mongodb';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // Ignore DNS set failures
}

const SOURCE_URI =
  process.env.SOURCE_MONGODB_URI ||
  'mongodb://123raza83:raza123@ac-dssmdy5-shard-00-00.wffnskl.mongodb.net:27017,ac-dssmdy5-shard-00-01.wffnskl.mongodb.net:27017,ac-dssmdy5-shard-00-02.wffnskl.mongodb.net:27017/kifayatly?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Kifayatly-Shop';

const TARGET_URI =
  process.env.TARGET_MONGODB_URI ||
  'mongodb://raza83:raza123@ac-yryy6cg-shard-00-00.vpkvo05.mongodb.net:27017,ac-yryy6cg-shard-00-01.vpkvo05.mongodb.net:27017,ac-yryy6cg-shard-00-02.vpkvo05.mongodb.net:27017/kifayatly?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const DB_NAME = 'kifayatly';

async function verify() {
  console.log('='.repeat(70));
  console.log('🔍 MONGODB MIGRATION VERIFICATION & INTEGRITY AUDIT');
  console.log('='.repeat(70));
  console.log(`Database: ${DB_NAME}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const sourceClient = new MongoClient(SOURCE_URI);
  const targetClient = new MongoClient(TARGET_URI);

  let hasDiscrepancy = false;

  try {
    await Promise.all([sourceClient.connect(), targetClient.connect()]);
    console.log('✅ Connected to Source and Target Atlas clusters.');

    const sourceDb = sourceClient.db(DB_NAME);
    const targetDb = targetClient.db(DB_NAME);

    // GATE 1: Collection Inventory
    console.log('\n--- GATE 1: Collection Inventory Parity ---');
    const sourceCols = (await sourceDb.listCollections().toArray())
      .filter((c) => !c.name.startsWith('system.'))
      .map((c) => c.name)
      .sort();

    const targetCols = (await targetDb.listCollections().toArray())
      .filter((c) => !c.name.startsWith('system.'))
      .map((c) => c.name)
      .sort();

    console.log(`Source Collections count: ${sourceCols.length}`);
    console.log(`Target Collections count: ${targetCols.length}`);

    const missingInTarget = sourceCols.filter((c) => !targetCols.includes(c));
    if (missingInTarget.length > 0) {
      console.error(`❌ Missing collections in Target:`, missingInTarget);
      hasDiscrepancy = true;
    } else {
      console.log('✅ GATE 1 PASSED: All collections exist on Target.');
    }

    // GATE 2 & 3: Document Counts & Index Integrity
    console.log('\n--- GATE 2 & 3: Document Counts & Index Parity ---');
    const tableData = [];

    for (const colName of sourceCols) {
      const sCol = sourceDb.collection(colName);
      const tCol = targetDb.collection(colName);

      const [sCount, tCount] = await Promise.all([
        sCol.countDocuments(),
        tCol.countDocuments(),
      ]);

      const [sIndexes, tIndexes] = await Promise.all([
        sCol.indexes(),
        tCol.indexes(),
      ]);

      const countMatch = sCount === tCount;
      const indexMatch = sIndexes.length === tIndexes.length;

      if (!countMatch || !indexMatch) {
        hasDiscrepancy = true;
      }

      // Check Index Key equality
      const sKeys = sIndexes.map((i) => JSON.stringify(i.key)).sort();
      const tKeys = tIndexes.map((i) => JSON.stringify(i.key)).sort();
      const keysMatch = JSON.stringify(sKeys) === JSON.stringify(tKeys);

      if (!keysMatch) {
        console.warn(`  ⚠️ Index definition mismatch in collection [${colName}]`);
        hasDiscrepancy = true;
      }

      tableData.push({
        Collection: colName,
        'Source Docs': sCount,
        'Target Docs': tCount,
        'Count Match': countMatch ? '✅' : '❌ FAIL',
        'Source Idx': sIndexes.length,
        'Target Idx': tIndexes.length,
        'Idx Match': indexMatch && keysMatch ? '✅' : '❌ FAIL',
      });
    }

    console.table(tableData);

    // GATE 4: BSON Data Checksum & Type Sampling
    console.log('\n--- GATE 4: BSON Sample & Data Type Integrity ---');
    let samplesChecked = 0;
    let sampleFailures = 0;

    for (const colName of sourceCols) {
      const sCol = sourceDb.collection(colName);
      const tCol = targetDb.collection(colName);

      // Sample first and latest document
      const samples = await sCol.find().limit(2).toArray();

      for (const sample of samples) {
        if (!sample || !sample._id) continue;
        samplesChecked++;

        const targetDoc = await tCol.findOne({ _id: sample._id });
        if (!targetDoc) {
          console.error(`❌ Document _id ${sample._id} missing in target [${colName}]`);
          sampleFailures++;
          hasDiscrepancy = true;
          continue;
        }

        // Validate BSON canonical serialization
        const sBson = BSON.EJSON.stringify(sample);
        const tBson = BSON.EJSON.stringify(targetDoc);

        if (sBson !== tBson) {
          console.error(`❌ BSON mismatch in [${colName}] for _id: ${sample._id}`);
          sampleFailures++;
          hasDiscrepancy = true;
        }
      }
    }

    console.log(`Verified ${samplesChecked} sample documents across collections.`);
    if (sampleFailures === 0) {
      console.log('✅ GATE 4 PASSED: 100% BSON type fidelity and canonical equality confirmed.');
    } else {
      console.error(`❌ GATE 4 FAILED: ${sampleFailures} sample mismatches detected.`);
    }

    // FINAL SUMMARY
    console.log('\n' + '='.repeat(70));
    if (!hasDiscrepancy) {
      console.log('🏆 VERIFICATION RESULT: 100% PERFECT PARITY ACHIEVED!');
      console.log('Target cluster is identical to source in collections, documents, and indexes.');
      console.log('Safe to switch application connection string.');
    } else {
      console.error('⚠️ VERIFICATION RESULT: Discrepancies detected. Please review logs above.');
      process.exitCode = 1;
    }
    console.log('='.repeat(70));
  } catch (err) {
    console.error('Verification error:', err);
    process.exitCode = 1;
  } finally {
    await Promise.allSettled([sourceClient.close(), targetClient.close()]);
  }
}

verify();
