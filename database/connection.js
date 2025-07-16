const { createClient } = require('@libsql/client');
const { createTables } = require('./schema');

let db;

const initializeDatabase = async () => {
  db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  await createTables(db);
  return db;
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = { initializeDatabase, getDb };