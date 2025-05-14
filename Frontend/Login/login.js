import { query } from '../../conexionBD.js'; // Conexión con la BD

listarUsuarios();

async function listarUsuarios() {
  const res = await query('SELECT * FROM usuarios');
  console.log(res.rows);
}

