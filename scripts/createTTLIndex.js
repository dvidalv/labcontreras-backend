const mongoose = require('mongoose');
const connection = require('../config/databaseSugerencias');
const Fingerprint = require('../models/fingerprints');

async function createTTLIndex() {
  try {
    // Ensure we're connected to the database
    if (connection.readyState !== 1) {
      await new Promise((resolve) => {
        connection.once('connected', resolve);
      });
    }

    // Create the TTL index
    await Fingerprint.collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 3600 }, // 1 hour
    );

    console.log('TTL index created successfully on fingerprints collection');
    process.exit(0);
  } catch (error) {
    console.error('Error creating TTL index:', error);
    process.exit(1);
  }
}

createTTLIndex();
