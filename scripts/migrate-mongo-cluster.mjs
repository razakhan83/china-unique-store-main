import dns from 'node:dns';
import { MongoClient } from 'mongodb';

// Ensure resilient DNS resolution for Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // Ignore if unable to set custom DNS
}

const SOURCE_URI =
  process.env.SOURCE_MONGODB_URI ||
  'mongodb://123raza83:raza123@ac-dssmdy5-shard-00-00.wffnskl.mongodb.net:27017,ac-dssmdy5-shard-00-01.wffnskl.mongodb.net:27017,ac-dssmdy5-shard-00-02.wffnskl.mongodb.net:27017/kifayatly?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Kifayatly-Shop';

const TARGET_URI =
  process.env.TARGET_MONGODB_URI ||
  'mongodb://raza83:raza123@ac-yryy6cg-shard-00-00.vpkvo05.mongodb.net:27017,ac-yryy6cg-shard-00-01.vpkvo05.mongodb.net:27017,ac-yryy6cg-shard-00-02.vpkvo05.mongodb.net:27017/kifayatly?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const DB_NAME = 'kifayatly';
const BATCH_SIZE = 500;

async function migrate() {
  console.log('='.repeat(65));
  console.log('🚀 INITIATING FULL MONGODB ATLAS CLUSTER MIGRATION');
  console.log('='.repeat(65));
  console.log(`Database: ${DB_NAME}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const sourceClient = new MongoClient(SOURCE_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
  });

  const targetClient = new MongoClient(TARGET_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
  });

  const startTime = Date.now();

  try {
    console.log('\n[1/4] Connecting to Source and Target Atlas clusters...');
    await Promise.all([sourceClient.connect(), targetClient.connect()]);
    console.log('✅ Connected to Source Cluster successfully.');
    console.log('✅ Connected to Target Cluster successfully.');

    const sourceDb = sourceClient.db(DB_NAME);
    const targetDb = targetClient.db(DB_NAME);

    console.log('\n[2/4] Discovering source collections...');
    const collectionsList = await sourceDb.listCollections().toArray();
    const activeCollections = collectionsList.filter(
      (c) => !c.name.startsWith('system.')
    );

    console.log(`Found ${activeCollections.length} collections to migrate.\n`);

    let grandTotalDocs = 0;
    let grandTotalIndexes = 0;
    const summary = [];

    console.log('[3/4] Migrating collections, documents, and indexes...\n');

    for (const colInfo of activeCollections) {
      const colName = colInfo.name;
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const sourceCount = await sourceCol.countDocuments();
      console.log(`--- Collection: [${colName}] (${sourceCount} docs) ---`);

      // 1. Create collection with identical options if any
      const colOptions = colInfo.options || {};
      const targetExisting = await targetDb.listCollections({ name: colName }).toArray();
      if (targetExisting.length === 0) {
        await targetDb.createCollection(colName, colOptions);
      }

      // 2. Stream documents in batches to preserve memory and BSON fidelity
      let migratedCount = 0;
      if (sourceCount > 0) {
        const cursor = sourceCol.find({}, { batchSize: BATCH_SIZE });
        let batch = [];

        while (await cursor.hasNext()) {
          const doc = await cursor.next();
          batch.push({
            replaceOne: {
              filter: { _id: doc._id },
              replacement: doc,
              upsert: true,
            },
          });

          if (batch.length >= BATCH_SIZE) {
            await targetCol.bulkWrite(batch, { ordered: false });
            migratedCount += batch.length;
            process.stdout.write(`  -> Documents migrated: ${migratedCount}/${sourceCount}\r`);
            batch = [];
          }
        }

        if (batch.length > 0) {
          await targetCol.bulkWrite(batch, { ordered: false });
          migratedCount += batch.length;
          console.log(`  -> Documents migrated: ${migratedCount}/${sourceCount} [DONE]`);
        }
      } else {
        console.log(`  -> Empty collection, schema container created.`);
      }

      // 3. Reconstruct secondary and compound indexes
      const indexes = await sourceCol.indexes();
      const secondaryIndexes = indexes.filter((idx) => idx.name !== '_id_');

      let indexesCreated = 0;
      if (secondaryIndexes.length > 0) {
        // Strip legacy/internal properties that Atlas rejects
        const indexSpecs = secondaryIndexes.map((idx) => {
          const spec = {
            key: idx.key,
            name: idx.name,
          };
          if (idx.unique) spec.unique = true;
          if (idx.sparse) spec.sparse = true;
          if (idx.expireAfterSeconds !== undefined) spec.expireAfterSeconds = idx.expireAfterSeconds;
          if (idx.partialFilterExpression) spec.partialFilterExpression = idx.partialFilterExpression;
          if (idx.collation) spec.collation = idx.collation;
          if (idx.weights) spec.weights = idx.weights;
          if (idx.default_language) spec.default_language = idx.default_language;
          return spec;
        });

        try {
          await targetCol.createIndexes(indexSpecs);
          indexesCreated = secondaryIndexes.length;
          console.log(`  -> Indexes mirrored: ${indexesCreated} secondary indexes.`);
        } catch (idxErr) {
          console.warn(`  ⚠️ Warning creating indexes collectively: ${idxErr.message}. Falling back to individual creation.`);
          for (const spec of indexSpecs) {
            try {
              await targetCol.createIndex(spec.key, spec);
              indexesCreated++;
            } catch (singleErr) {
              console.error(`  ❌ Failed to create index [${spec.name}]: ${singleErr.message}`);
            }
          }
        }
      } else {
        console.log(`  -> No secondary indexes (default _id only).`);
      }

      grandTotalDocs += migratedCount;
      grandTotalIndexes += indexesCreated;

      summary.push({
        collection: colName,
        sourceDocs: sourceCount,
        targetDocs: migratedCount,
        indexes: indexesCreated + 1, // +1 for _id
      });

      console.log('');
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('='.repeat(65));
    console.log('🎉 MIGRATION SUMMARY');
    console.log('='.repeat(65));
    console.table(summary);
    console.log(`Total Collections: ${activeCollections.length}`);
    console.log(`Total Documents Migrated: ${grandTotalDocs}`);
    console.log(`Total Secondary Indexes Mirrored: ${grandTotalIndexes}`);
    console.log(`Total Elapsed Time: ${durationSec} seconds`);
    console.log('='.repeat(65));
    console.log('\n[4/4] Migration completed with 0 fatal errors. Run verification script next.');

  } catch (err) {
    console.error('\n❌ FATAL ERROR DURING MIGRATION:', err);
    process.exitCode = 1;
  } finally {
    await Promise.allSettled([sourceClient.close(), targetClient.close()]);
    console.log('Connections closed cleanly.');
  }
}

migrate();
