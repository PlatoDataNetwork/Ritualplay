const mongoose = require('mongoose');
const config = require('../config');

const connectDB = async () => {
  try {
    // mongoose 6+ removed the legacy option flags; connect() works with defaults
    const db = await mongoose.connect(config.MONGO_URI);
    console.log('Successfully connected to MongoDB!');

    return db;
  } catch (err) {
    console.error(err.message);
    process.exit(-1);
  }
};

module.exports = connectDB;
