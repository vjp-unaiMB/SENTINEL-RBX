// Variables globales
let cronometroEstado = false;

// Función para actualizar la lista de jugadores en el DOM
function actualizarDatosServidor(jugadores) {
    const contenedor = document.querySelector('.JugadoresLista');
    const contadorJugadores = document.querySelector('.jugadores');
    const actividadServer = document.querySelector('.estado');

    let jugadoresAux = 0;
    if (!contenedor) {
        console.error('Contenedor de jugadores no encontrado');
        return;
    }

    contenedor.innerHTML = '';
    contadorJugadores.innerHTML = '';
    actividadServer.innerHTML = '';

    jugadores.forEach(jugador => {
        const jugadorElement = document.createElement('div');
        jugadorElement.className = 'jugador';
        jugadorElement.innerHTML = `
            <p><strong>Nombre:</strong> ${jugador.name}</p>
            <p><strong>ID:</strong> ${jugador.userId}</p>
            <img src="https://thumbnails.roblox.com/v1/users/avatar?userIds=${jugador.userId}&size=150x150&format=Png&isCircular=false" 
                alt="Avatar de ${jugador.name}"
                onerror="this.src='https://placehold.co/150x150?text=Sin+Avatar'; this.style.opacity='0.5'">
        `;

        contenedor.appendChild(jugadorElement);
        jugadoresAux++;
        console.log("Jugador #" + jugadoresAux, jugador);
    });

    if (jugadoresAux === 0) {
        actividadServer.innerHTML = `<span class="actividad text-danger">Inactivo </span><img src="Recursos/Led apagado.png" alt="">`;
        cronometroEstado = false;
    } else {
        actividadServer.innerHTML = `<span class="actividad text-success">Activo </span><img src="Recursos/Led encendido.png" alt="">`;

        let color = jugadoresAux === 1 ? 'red' : jugadoresAux === 2 ? 'orange' : 'green';
        contadorJugadores.innerHTML = `<span style="color: ${color}"><strong>Jugadores: </strong> ${jugadoresAux}</span>`;
        cronometroEstado = true;
    }
    cronometro(cronometroEstado);
}




function cronometro(cronometroEstado){
    const cronometroElement = document.getElementById("cronometro"); 
    if (cronometroEstado ) {
        setInterval(actualizarCronometro, 1000);
    }else{
        cronometroElement.textContent = "00:00:00";
    }
}

function actualizarCronometro() {
    segundos++;

    const hrs = String(Math.floor(segundos / 3600)).padStart(2, '0');
    const mins = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
    const secs = String(segundos % 60).padStart(2, '0');

    cronometroElement.textContent = `${hrs}:${mins}:${secs}`;
}












// Cargar jugadores desde el servidor
async function cargarJugadores() {
    try {
        const res = await fetch('/jugadores');
        const data = await res.json();
        console.log("Jugadores recibidos:", data);
        actualizarDatosServidor(data.jugadores);
    } catch (error) {
        console.error('Error cargando jugadores:', error);
    }
}

// Conexión SSE para actualizaciones en tiempo real
function conectarSSE() {
    const eventSource = new EventSource('/stream');

    eventSource.addEventListener('jugadores-update', (event) => {
        const data = JSON.parse(event.data);
        actualizarDatosServidor(data.jugadores);
        console.log('Lista de jugadores actualizada en tiempo real');
    });

    eventSource.onerror = (error) => {
        console.error('Error en la conexión SSE:', error);
        setTimeout(conectarSSE, 5000); // Reintento
    };
}

// Configurar acciones de los botones
function setupButtonActions() {
    const buttons = document.querySelectorAll('.action-btn');

    if (!buttons.length) {
        console.error('No se encontraron botones con clase .action-btn');
        return;
    }

    const modal = document.getElementById('formularioEmergente');
    const cerrarModal = document.getElementById('cerrarFormulario');
    const confirmarAnuncio = document.getElementById('enviarMensaje');
    const inputAnuncio = document.getElementById('mensajeGlobal');
    let botonActual = null;

    cerrarModal.addEventListener('click', () => {
        modal.style.display = 'none';
        inputAnuncio.value = '';
    });

    confirmarAnuncio.addEventListener('click', async () => {
        const mensaje = inputAnuncio.value.trim();
        if (!mensaje) {
            alert('Por favor, escribe un mensaje.');
            return;
        }

        const payload = {
            tipo: 'mensaje-global',
            contenido: mensaje
        };

        try {
            botonActual.disabled = true;
            botonActual.classList.add('loading');

            const response = await fetch('/enviar-senal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            alert(result.message || 'Mensaje enviado');
        } catch (error) {
            console.error(error);
            alert('Error al enviar el mensaje');
        } finally {
            botonActual.disabled = false;
            botonActual.classList.remove('loading');
            modal.style.display = 'none';
            inputAnuncio.value = '';
        }
    });

    buttons.forEach(btn => {
        const action = btn.dataset.action;
        if (!action) {
            console.warn('Botón sin data-action:', btn);
            return;
        }

        btn.addEventListener('click', async function () {
            console.log(`Botón ${action} clickeado`);

            let endpoint, payload, confirmMessage;

            switch (action) {
                case 'reiniciar-servidor':
                    confirmMessage = '¿Está seguro de reiniciar el servidor? Esto desconectará a todos los jugadores.';
                    payload = { tipo: 'reiniciar-servidor', contenido: 'Reiniciar' };
                    break;

                case 'apagar-servidor':
                    confirmMessage = '¿Está seguro de APAGAR el servidor? Esto desconectará a todos los jugadores.';
                    payload = { tipo: 'apagar-servidor', contenido: 'Apagar' };
                    break;

                case 'anunciar-servidor':
                    modal.style.display = 'block';
                    botonActual = this;
                    return;

                default:
                    console.warn('Acción no reconocida:', action);
                    return;
            }

            if (!confirm(confirmMessage)) return;

            try {
                this.disabled = true;
                this.classList.add('loading');

                const response = await fetch('/enviar-senal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                alert(result.message || 'Acción completada');
            } catch (error) {
                console.error('Error en la acción:', error);
                alert(`Error: ${error.message}`);
            } finally {
                this.disabled = false;
                this.classList.remove('loading');
            }
        });
    });
}

// Inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado - Inicializando...');

    const form = document.getElementById('form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Formulario prevenido');
        });
    } else {
        console.warn('Formulario no encontrado');
    }

    setupButtonActions();
    cargarJugadores();
    conectarSSE();
});