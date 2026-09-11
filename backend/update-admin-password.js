const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function updateUserPassword() {
  const uri = process.env.MONGODB_URI;
  console.log('🔄 Connecting to MongoDB Atlas to update admin@geo.com password...');

  try {
    await mongoose.connect(uri, {
      dbName: 'geosentinel',
      serverSelectionTimeoutMS: 8000,
    });
    console.log('✅ Connected to MongoDB Atlas!');

    const email = 'admin@geo.com';
    const newPassword = '282007@aA';
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update or insert admin@geo.com
    const result = await User.findOneAndUpdate(
      { email: new RegExp(`^${email}$`, 'i') },
      {
        $set: {
          username: email,
          email: email,
          name: 'Directorate General (DGMS Admin)',
          role: 'admin',
          badge: 'ADMIN L4',
          password_hash: newHash,
          updated_at: new Date()
        }
      },
      { upsert: true, new: true }
    );

    console.log(`\n🎉 User updated successfully in MongoDB Atlas:`);
    console.log(`   Email:    ${result.email}`);
    console.log(`   Username: ${result.username}`);
    console.log(`   Role:     ${result.role}`);
    console.log(`   Password: ${newPassword} (bcrypt hash updated)`);

    // Verify comparison
    const isMatch = await bcrypt.compare(newPassword, result.password_hash);
    console.log(`   Verification match test: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error updating user in MongoDB Atlas:', err);
    process.exit(1);
  }
}

updateUserPassword();
