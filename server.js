const express = require('express');
const fs = require('fs');
const cors = require('cors');
const TOKEN_CONEXION = "tOkEn/ComRbX";
const app = express();
const PORT = 3000;
const path = require('path');

app.use(cors());

// Middleware para procesar datos de formularios (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true })); // <-- Cambié aquí para procesar datos de formulario
app.use(express.json());

// Código para reproducir un mensaje en terminal de inicio del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Cuando entramos al servidor mediante "/", nos redirige a la página principal indicando la carpeta donde se encuentra Server.html
app.use(express.static('Frontend'));









// [RUTAS/ Funciones de Servidor, controles de Get y Post] (Dividido en bloques)








//  BLOQUE DE LISTADO DE JUGADORES: ----------------------------------------------------------------------------------------------

//Ruta para recibir la lista de jugadores desde  el post de ROBLOX y guardar en JSON
app.post('/back/jugadores', (req, res) => {
    try {
        console.log('Datos recibidos de Roblox:', req.body);
        const lista = req.body.jugadores;

        // Guardar en jugadores.json
        const archivoJugadores = path.join(__dirname, 'jugadores.json');
        fs.writeFileSync(archivoJugadores, JSON.stringify({ jugadores: lista }, null, 2));

        // Notificar a todos los clientes conectados
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

//Ruta para devolver los jugadores al cliente (Frontend)
app.get('/back/jugadores', (req, res) => {
    const archivoJugadores = path.join(__dirname, 'jugadores.json');
    const data = fs.readFileSync(archivoJugadores, 'utf-8');
    res.json(JSON.parse(data));
});


// Este bloque de código es para gestionar la conexión entre el servidor y el cliente web mediante Server-Sent Events (SSE)
// El cliente web se conecta a la ruta /back/stream y el servidor envía datos al frontend través de esta conexión
let clients = [];

app.get('/back/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    req.on('close', () => {
        clients = clients.filter(c => c !== res);
    });
});








app.post('/back/enviar-senal', express.json(), async (req, res) => {
    const { tipo, contenido } = req.body;
    
    if (!tipo || !contenido) {
        return res.status(400).json({ 
            success: false,
            message: 'Faltan parámetros requeridos'
        });
    }
    
    try {
        let resultado;
        
        // Determinar la acción a realizar en Roblox
        switch(tipo) {
            case 'mensaje-global':
                // Implementa esta función según tus necesidades
                resultado = await enviarMensajeARoblox(contenido);
                break;
                
            case 'reiniciar-servidor':
                resultado = await reiniciarServidorRoblox();
                break;
                
            case 'apagar-servidor':  // Nuevo caso para apagar
                resultado = await apagarServidorRoblox();
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de acción no válido'
                });
        }
        
        res.json({
            success: true,
            message: `Acción "${tipo}" completada`,
            resultado: resultado
        });
        
    } catch (error) {
        console.error('Error en /back/enviar-senal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Funciones auxiliares (debes implementarlas)
async function reiniciarServidorRoblox() {
    // Tu lógica para reiniciar
    return { status: 'Reinicio iniciado' };
}

async function apagarServidorRoblox() {
    // Tu lógica para apagar
    return { status: 'Apagado iniciado' };
}

async function enviarMensajeARoblox(mensaje) {
    // Tu lógica para enviar mensajes
    return { status: 'Mensaje enviado' };
}
  















// Ruta de envio de mensaje del formulario al backend (Aquí gestionamos donde almacenarlo + reenviamos a la página principal)
app.post('/back/guardarMensaje', (req, res) => {
    const mensaje = req.body.mensaje;  // Aquí obtenemos el dato del formulario

    if (!mensaje) {
        return res.status(400).send('No se recibió mensaje.');
    }

    // Si el mensaje es válido, puedes proceder con la lógica de escritura en archivo
    try {
        fs.writeFileSync('mensaje.txt', mensaje);  // Escribe el mensaje en un archivo
        res.redirect('/'); // volvemos a inicio
    } catch (err) {
        console.error('Error escribiendo el archivo:', err);
        res.status(500).send('Hubo un error al procesar el mensaje.');
    }
});

// Ruta para pasarle la información a ROBLOX del formulario cuando este haga una petición ("Roblox hará una petición GET")
app.get('/back/OfrecerMensaje', (req, res) => {
    const path = 'mensaje.txt';
  
    if (fs.existsSync(path)) {
      const mensaje = fs.readFileSync(path, 'utf8');
  
      // Responder al cliente
      res.send(mensaje);
  
      // Inmediatamente después de enviar, reseteamos el archivo
      fs.writeFileSync(path, 'NUL_Instruccion');
    } else {
      res.send('NUL_Instruccion');  // Por si el archivo no existe
    }
});







//Cuando se ejecuta un envío de señal en roblox, ROBLOX hace un post a /back/senal con el contenido json gestionado con express
app.post('/back/senal', express.json(), (req, res) => {
    const contenido = req.body; // recibimos el JSON enviado por Roblox

    console.log('📨 Señal recibida con contenido:', contenido);

    // Lo mandamos como string al cliente web
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(contenido)}\n\n`);
    });

    res.send({ status: 'ok' });
});

