const { MongoClient } = require('mongodb');
// require('dotenv').config();
const uri = process.env.ATLAS_URI;

// async function createUniqueIndex(db) {
//   const users = db.collection('users');
//   try {
//     await clientDB.connect();
//     const db = clientDB.db('LPCR');
//     const users = db.collection('users');
//     await users.createIndex({ email: 1 }, { unique: true });
//   } catch (error) {
//     console.error('Error creating unique index', error);
//   }
// }

const clientDB = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connectDB = async () => {
  try {
    await clientDB.connect();
    console.log('Connected to MongoDB');
    const db = clientDB.db('LPCR');
    const users = db.collection('users');
    return { db, users };
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
};

module.exports = { clientDB };
