// Base de datos PostgreSQL configuración

require('dotenv').config(); 

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // <-- AQUÍ usu la variable del .env
  ssl: {
    rejectUnauthorized: false // Render usa SSL sin certificado autofirmado
  }
});

module.exports = pool;
