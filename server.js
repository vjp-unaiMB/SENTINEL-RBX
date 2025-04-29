const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;
const TOKEN_CONEXION = "tOkEn/ComRbX";

// Middleware general
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Frontend')));





// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});







// Rutas legales
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'Legal', 'privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'Legal', 'terms.html'));
});






// SSE (Server-Sent Events)
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






// Ruta para guardar lista de jugadores enviada por Roblox
app.post('/back/jugadores', (req, res) => {
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
app.get('/back/jugadores', (req, res) => {
    const archivoJugadores = path.join(__dirname, 'jugadores.json');
    const data = fs.readFileSync(archivoJugadores, 'utf-8');
    res.json(JSON.parse(data));
});






// Ruta para enviar señales a Roblox
app.post('/back/enviar-senal', (req, res) => {
    const { tipo, contenido } = req.body;
    if (!tipo || !contenido) return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos' });

    try {
        let resultado;
        switch(tipo) {
            case 'mensaje-global':
                fs.writeFileSync('mensaje.txt', contenido);
                resultado = { status: 'Mensaje global guardado' };
                break;
            case 'reiniciar-servidor':
                fs.writeFileSync('comando.txt', 'reiniciar');
                resultado = { status: 'Reinicio iniciado' };
                break;
            case 'apagar-servidor':
                fs.writeFileSync('comando.txt', 'apagar');
                resultado = { status: 'Apagado iniciado' };
                break;
            default:
                return res.status(400).json({ success: false, message: 'Tipo de acción no válido' });
        }
        res.json({ success: true, message: `Acción "${tipo}" completada`, resultado });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
});






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
app.post('/back/guardarMensaje', (req, res) => {
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
app.get('/back/OfrecerMensaje', (req, res) => {
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
app.post('/back/senal', express.json(), (req, res) => {
    const contenido = req.body;
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(contenido)}\n\n`);
    });
    res.send({ status: 'ok' });
});
