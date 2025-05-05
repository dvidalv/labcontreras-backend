const { MongoClient } = require('mongodb');
// require('dotenv').config();
const uri = process.env.ATLAS_URI;



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
