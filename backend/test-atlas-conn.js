const mongoose = require('mongoose');

async function testUri(label, uri) {
  console.log(`\nTesting connection [${label}]:`);
  console.log(`URI: ${uri.replace(/:([^@]+)@/, ':****@')}`);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`✅ SUCCESS! Connected with [${label}]!`);
    
    // Check databases and collections
    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const dbs = await admin.listDatabases();
    console.log('Databases available on cluster:', dbs.databases.map(d => d.name));

    // Try creating geosentinel database and writing a test document
    const testDb = mongoose.connection.useDb('geosentinel');
    const collection = testDb.collection('users');
    const count = await collection.countDocuments();
    console.log(`Documents in geosentinel.users: ${count}`);

    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error(`❌ FAILED with [${label}]:`, err.message);
    try { await mongoose.disconnect(); } catch (e) {}
    return false;
  }
}

async function main() {
  const uris = [
    {
      label: '1. Standard URI with /geosentinel and %40 encoded @ in password',
      uri: 'mongodb+srv://singhalyash307:9548424613%40aA@cluster1.ki46oil.mongodb.net/geosentinel?retryWrites=true&w=majority&appName=Cluster1'
    },
    {
      label: '2. Standard URI with authSource=admin',
      uri: 'mongodb+srv://singhalyash307:9548424613%40aA@cluster1.ki46oil.mongodb.net/geosentinel?authSource=admin&retryWrites=true&w=majority'
    },
    {
      label: '3. Raw password without encoding',
      uri: 'mongodb+srv://singhalyash307:9548424613@aA@cluster1.ki46oil.mongodb.net/geosentinel?retryWrites=true&w=majority'
    },
    {
      label: '4. URI from .env',
      uri: 'mongodb+srv://singhalyash307:9548424613%40aA@cluster1.ki46oil.mongodb.net/?appName=Cluster1'
    }
  ];

  for (const item of uris) {
    const ok = await testUri(item.label, item.uri);
    if (ok) {
      console.log(`\n🎉 Found working MongoDB Atlas connection format: [${item.label}]`);
      break;
    }
  }
}

main();
