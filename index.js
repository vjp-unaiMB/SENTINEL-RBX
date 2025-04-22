const express = require('express');
const fs = require('fs');
const cors = require('cors');
const TOKEN_CONEXION = "tOkEn/ComRbX";
const app = express();
const PORT = 3000;

app.use(cors());

// Middleware para procesar datos de formularios (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true })); // <-- Cambié aquí para procesar datos de formulario
// Ya no necesitamos express.json() porque no estamos enviando JSON desde el formulario
// app.use(express.json());

// Código para reproducir un mensaje en terminal de inicio del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Cuando entramos al servidor mediante "/", nos redirige a la página principal indicando la carpeta donde se encuentra Index.html
app.use(express.static('Frontend'));









// RUTAS: ----------------------------------------------------------------------------------------------





































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





// Recibir señal de roblox
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

