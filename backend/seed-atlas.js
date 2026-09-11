const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const SensorNode = require('./models/SensorNode');
const CitizenReport = require('./models/CitizenReport');
const Alert = require('./models/Alert');
const Gateway = require('./models/Gateway');
const { DEFAULT_USERS, DEFAULT_NODES, DEFAULT_REPORTS, InMemoryStore } = require('./seed/seedData');

async function seedAtlas() {
  const uri = process.env.MONGODB_URI;
  console.log('🚀 Connecting to live MongoDB Atlas Cluster1...');
  console.log(`Connecting to: ${uri.replace(/:([^@]+)@/, ':****@')}`);

  try {
    await mongoose.connect(uri, {
      dbName: 'geosentinel',
      serverSelectionTimeoutMS: 8000,
    });
    console.log('✅ Connected to live MongoDB Atlas Cluster1 successfully!\n');

    // 1. Seed Users Collection
    console.log('👤 Seeding users collection in MongoDB Atlas...');
    for (const u of DEFAULT_USERS) {
      const existing = await User.findOne({
        $or: [
          { email: new RegExp(`^${u.email}$`, 'i') },
          { username: new RegExp(`^${u.username}$`, 'i') }
        ]
      });
      if (!existing) {
        const hash = await bcrypt.hash(u.password, 10);
        await User.create({
          username: u.username,
          email: u.email,
          name: u.name,
          role: u.role,
          badge: u.badge,
          password_hash: hash,
        });
        console.log(`   + Created user: ${u.email} (${u.role})`);
      } else {
        console.log(`   * User already exists: ${u.email}`);
      }
    }

    // 2. Seed SensorNodes Collection
    console.log('\n📡 Seeding sensornodes collection in MongoDB Atlas...');
    for (const n of DEFAULT_NODES) {
      const existing = await SensorNode.findOne({ id: n.id });
      if (!existing) {
        await SensorNode.create(n);
        console.log(`   + Created sensor node: ${n.id} (${n.name})`);
      } else {
        console.log(`   * Sensor node exists: ${n.id}`);
      }
    }

    // 3. Seed CitizenReports Collection
    console.log('\n📝 Seeding citizenreports collection in MongoDB Atlas...');
    for (const r of DEFAULT_REPORTS) {
      const existing = await CitizenReport.findOne({ id: r.id });
      if (!existing) {
        await CitizenReport.create(r);
        console.log(`   + Created crack report: ${r.id} (${r.zone})`);
      } else {
        console.log(`   * Crack report exists: ${r.id}`);
      }
    }

    // 4. Seed Gateways Collection
    console.log('\n📟 Seeding gateways collection in MongoDB Atlas...');
    const existingGw = await Gateway.findOne({ gateway_id: 'GW-01' });
    if (!existingGw) {
      await Gateway.create(InMemoryStore.gateways[0]);
      console.log('   + Created Edge Gateway GW-01');
    } else {
      console.log('   * Gateway GW-01 exists');
    }

    // 5. Seed Alerts Collection
    console.log('\n🚨 Seeding alerts collection in MongoDB Atlas...');
    const alertCount = await Alert.countDocuments();
    if (alertCount === 0) {
      for (const a of InMemoryStore.alerts) {
        const { _id, ...alertData } = a;
        await Alert.create(alertData);
        console.log(`   + Created sample alert for node: ${alertData.node_id}`);
      }
    } else {
      console.log(`   * ${alertCount} alerts exist in Atlas`);
    }

    // Final Verification Count
    console.log('\n======================================================');
    console.log('📊 LIVE MONGODB ATLAS DATABASE SUMMARY:');
    console.log('   Database: geosentinel');
    console.log(`   - users:          ${await User.countDocuments()} documents`);
    console.log(`   - sensornodes:    ${await SensorNode.countDocuments()} documents`);
    console.log(`   - citizenreports: ${await CitizenReport.countDocuments()} documents`);
    console.log(`   - alerts:         ${await Alert.countDocuments()} documents`);
    console.log(`   - gateways:       ${await Gateway.countDocuments()} documents`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    console.log('🎉 MongoDB Atlas seeding completed successfully!');
  } catch (err) {
    console.error('❌ Failed to seed MongoDB Atlas:', err);
    process.exit(1);
  }
}

seedAtlas();
