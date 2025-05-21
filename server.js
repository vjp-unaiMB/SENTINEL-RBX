//Importaciones

const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const pool = require('./conexionBD.js'); // Conexión con la BD

const bcrypt = require('bcrypt'); //Cifrado de contraseñas



// Variables públicas

let servidor_status = false;
let clients = [];
let ultimaSenal = null;
const PORT = 3000;
const TOKEN_CONEXION = "tOkEn/ComRbX";




// Middleware general

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Frontend')));





// Iniciar servidor
app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);

    // VACIAR EL ARCHIVO mensaje.txt al iniciar
    const mensajePath = path.join(__dirname, 'mensaje.txt');
    try {
        fs.writeFileSync(mensajePath, 'NUL_Instruccion'); // O usa '' si quieres vacío
        console.log('mensaje.txt limpio al iniciar el servidor.');
    } catch (error) {
        console.error('Error al limpiar mensaje.txt al iniciar:', error);
    }

    await crearTablaUsuarios();
});


// Rutas generales

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'panel.html')); // antes era index.html
});

app.get('/privacidad', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'Legal', 'privacy.html'));
});

app.get('/terminos', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'Legal', 'terms.html'));
});






// SSE (Server-Sent Events) Para hacer polling desde el servidor (detectar eventos sin necesidad de escuchar) 
// contiene bloques de escucha en tiempo real:


app.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    req.on('close', () => {
        clients = clients.filter(c => c !== res);
    });
});






// Ruta para guardar lista de jugadores enviada por Roblox
app.post('/jugadores', (req, res) => {
    try {
        const lista = req.body.jugadores;
        const archivoJugadores = path.join(__dirname, 'jugadores.json');

        fs.writeFileSync(archivoJugadores, JSON.stringify({ jugadores: lista }, null, 2));

        clients.forEach(client => {
            client.write(`event: jugadores-update\n`);
            client.write(`data: ${JSON.stringify({ jugadores: lista })}\n\n`);
        });

        res.json({ status: 'Recibido' });
    } catch (error) {
        console.error('Error al procesar jugadores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});






// Ruta para devolver los jugadores
app.get('/jugadores', (req, res) => {
    const archivoJugadores = path.join(__dirname, 'jugadores.json');
    const data = fs.readFileSync(archivoJugadores, 'utf-8');
    res.json(JSON.parse(data));
});






// Rutas para recibir la info del DOM y enviar señales a Roblox


// Ruta POST para establecer una señal (botonera)
app.post('/enviar-senal', (req, res) => {
    const { tipo, contenido } = req.body;

    if (!tipo || !contenido) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos' });
    }

    // Guardamos la última señal recibida
    ultimaSenal = {
        tipo,
        contenido
    };

    res.json({ success: true, message: `Acción "${tipo}" guardada`, resultado: ultimaSenal });
});

// Nueva ruta GET para que Roblox lea la última señal
app.get('/enviar-senal', (req, res) => {
    if (!ultimaSenal) {
        return res.json({ resultado: { status: "Ninguna señal disponible" } });
    }

    // Devolvemos la señal y la borramos después (opcional, si solo se consume una vez)
    const respuesta = { ...ultimaSenal };
    ultimaSenal = null;

    res.json({ resultado: { status: mapearTipo(respuesta.tipo), mensaje: respuesta.contenido } });
});

// Función para mapear tipo a texto descriptivo (Es lo que le permitirá a las condicionales de roblox comparar el tipo de señal)
function mapearTipo(tipo) {
    switch (tipo) {
        case 'mensaje-global': return 'MensajeGlobal';
        case 'reiniciar-servidor': return 'ReinicioIniciado';
        case 'apagar-servidor': return 'ApagadoIniciado';
        default: return 'Tipo desconocido';
    }
}


// Ruta de autenticación OAuth de Roblox
app.get('/oauth/callback', async (req, res) => {
    const authCode = req.query.code;
    if (!authCode) return res.status(400).send("No se proporcionó ningún código");

    try {
        const response = await axios.post('https://apis.roblox.com/oauth/v1/token', {
            client_id: '1962754022683329903',
            client_secret: 'RBX-dvNueLPYVUCCIV91-BuzzdFZUsMHforaSBT-Md8TthAbbE48mcne1b7VgevroJUu',
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: 'https://sentinel-rbx.onrender.com/oauth/callback'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        const accessToken = response.data.access_token;
        console.log("Token recibido:", accessToken);

        return res.redirect('/');
    } catch (error) {
        console.error("Error al intercambiar el código por el token:", error?.response?.data || error);
        return res.status(500).send("Error en el proceso de autenticación");
    }
});






// Guardar mensaje desde formulario web
app.post('/guardarMensaje', (req, res) => {
    const mensaje = req.body.mensaje;
    if (!mensaje) return res.status(400).send('No se recibió mensaje.');

    try {
        fs.writeFileSync('mensaje.txt', mensaje);
        res.redirect('/');
    } catch (err) {
        console.error('Error escribiendo el archivo:', err);
        res.status(500).send('Error al procesar el mensaje.');
    }
});






// Ofrecer mensaje a Roblox (lectura por GET)
app.get('/OfrecerMensaje', (req, res) => {
    const mensajePath = 'mensaje.txt';

    if (fs.existsSync(mensajePath)) {
        const mensaje = fs.readFileSync(mensajePath, 'utf8');
        res.send(mensaje);
        fs.writeFileSync(mensajePath, 'NUL_Instruccion');
    } else {
        res.send('NUL_Instruccion');
    }
});






// Recibir señal directa desde Roblox y reenviarla por SSE
app.post('/senal', express.json(), (req, res) => {
    const contenido = req.body;
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(contenido)}\n\n`);
    });
    res.send({ status: 'ok' });
});



// Recibir Mensaje Remoto
app.post('/MensajeRemoto', (req, res) => {
	const { jugador, userId, mensaje, hora } = req.body;
  	const archivoMensaje = path.join(__dirname, 'mensaje.txt');

	// Creamos la línea del mensaje como texto legible
	const logLinea = `<div class="mensajeRemoto"><i class="fa-solid fa-exclamation"></i>  ${jugador}<span class="mensajeRemotoHora"> (${hora})</span> :<p> ${mensaje}</p></div>`;

	// Escribimos o añadimos al archivo (append, para no sobreescribir cada vez)
	fs.appendFileSync(archivoMensaje, logLinea);

	console.log(logLinea.trim()); // También lo mostramos en consola

	res.status(200).json({ status: "ok" });
});

// SSE: Mensajes recibidos desde Roblox
app.get('/mensajes-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const interval = setInterval(() => {
        const archivoMensaje = path.join(__dirname, 'mensaje.txt');
        if (fs.existsSync(archivoMensaje)) {
            const contenido = fs.readFileSync(archivoMensaje, 'utf-8');
            res.write(`event: mensaje-remoto\n`);
            res.write(`data: ${JSON.stringify({ contenido })}\n\n`);
        }
    }, 5000); // Cada 5 segundos

    req.on('close', () => {
        clearInterval(interval);
    });
});





// CONFIGURACIÓN DE LA BASE DE DATOS






app.use(express.json());

// GET: Ver todos los usuarios
app.get('/verUsuarios', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM usuarios');
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener los usuarios');
  }
});

// POST: Añadir un nuevo usuario
app.post('/usuarios', async (req, res) => {
  const { nombre, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, password) VALUES ($1, $2) RETURNING *',
      [nombre, hashedPassword]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al insertar usuario');
  }
});

// crear tabla de usuarios si no existe
// async function crearTablaUsuarios() {
//   try {
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS usuarios (
//         id SERIAL PRIMARY KEY,
//         nombre VARCHAR(255) UNIQUE NOT NULL,
//         password VARCHAR(255) NOT NULL
//       )
//     `);
//     console.log('Tabla de usuarios creada o ya existe');
//   } catch (error) {
//     console.error('Error al crear la tabla de usuarios:', error);
//   }
// }


// Función extendida para crear tabla + usuario por defecto
async function crearTablaUsuarios() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log('Tabla de usuarios creada o ya existe');

    const existe = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', ['Mikael_Wittman']);
    if (existe.rows.length === 0) {
      const hash = await bcrypt.hash('1234', 10);
      await pool.query('INSERT INTO usuarios (nombre, password) VALUES ($1, $2)', ['Mikael_Wittman', hash]);
      console.log('Usuario por defecto Mikael_Wittman creado');
    } else {
      console.log('El usuario por defecto ya existe');
    }

  } catch (error) {
    console.error('Error al crear la tabla o usuario por defecto:', error);
  }
}

// Ruta POST para login desde formulario sin JS externo
app.post('/login', async (req, res) => {
  const { nombre, password } = req.body;

  if (!nombre || !password) {
    return res.send('Faltan datos. Vuelve atrás e intenta de nuevo.');
  }

  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);

    if (resultado.rows.length === 0) {
      return res.send('Usuario no encontrado.');
    }

    const usuario = resultado.rows[0];
    const coincide = await bcrypt.compare(password, usuario.password);

    if (coincide) {
      return res.redirect('/panel');
    } else {
      return res.send('Contraseña incorrecta.');
    }

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para devolver la lista de usuarios administradores desde la BD a roblox
app.get('/admins', async (req, res) => {
  try {
      const resultado = await pool.query('SELECT nombre FROM usuarios');
      const nombres = resultado.rows.map(row => row.nombre);
      res.json({ admins: nombres });
  } catch (error) {
      console.error('Error al obtener la lista de admins:', error);
      res.status(500).json({ error: 'Error al obtener los administradores' });
  }
});

