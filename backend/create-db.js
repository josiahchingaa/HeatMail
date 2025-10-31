const { Client } = require('pg');

async function createDatabase() {
  // Connect to postgres database (default database)
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'Papapa987!',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'heatmail'"
    );

    if (checkResult.rows.length > 0) {
      console.log('✅ Database "heatmail" already exists');
    } else {
      // Create database
      await client.query('CREATE DATABASE heatmail');
      console.log('✅ Database "heatmail" created successfully');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

createDatabase();
