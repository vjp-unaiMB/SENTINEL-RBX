// Base de datos PostgreSQL configuración
const { Pool } = require('pg');

const pool = new Pool({
  user: 'heimer',
  host: 'dpg-d0ifkbemcj7s73dk5pmg-a',
  database: 'sentinel_bd',
  password: 'TU_CONTRASEÑA',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;