//Variables globales
const cronometro = false;



// Función para actualizar la lista de jugadores en el DOM
function actualizarListaJugadores(jugadores) {
    const contenedor = document.querySelector('.JugadoresLista');
    const contadorJugadores = document.querySelector('.jugadores');
    const actividadServer = document.querySelector('.estado');

    const jugadoresAux = 0;
    if (!contenedor) {
        console.error('Contenedor de jugadores no encontrado');
        return;
    }

    contenedor.innerHTML = ``;
    contadorJugadores.innerHTML = ``;
    actividadServer.innerHTML = ``;

    jugadores.forEach(jugador => {

        const jugadorElement = document.createElement('div');
        jugadorElement.className = 'jugador';
        jugadorElement.innerHTML = `
            <p><strong>Nombre:</strong> ${jugador.name}</p>
            <p><strong>ID:</strong> ${jugador.userId}</p>
            <img src="https://apis.roblox.com/avatars/v1/users/${jugador.userId}/thumbnail" 
                 alt="Avatar de ${jugador.name}"
                 onerror="this.src='https://placehold.co/150x150?text=Sin+Avatar'; this.style.opacity='0.5'">
        `;

        contenedor.appendChild(jugadorElement);
        jugadoresAux ++;
    });
    switch (jugadoresAux) {
        case 1:
            contadorJugadores.innerHTML = `<span style="color=red"><strong>Jugadores: </strong> ${jugadoresAux}</span>`;
        break;

        case 2:
            contadorJugadores.innerHTML = `<span style="color=orange"><strong>Jugadores: </strong> ${jugadoresAux}</span>`;
        break;
    
        default:
            contadorJugadores.innerHTML = `<span style="color=green"><strong>Jugadores: </strong> ${jugadoresAux}</span>`;
        break;
    }
    if(jugadoresAux == 0){
        actividadServer.innerHTML = `<span class="actividad text-danger">Inactivo </span><img src="Recursos/Led apagado.png" alt=""></img>';`
    }else{
        actividadServer.innerHTML = `<span class="actividad text-success">Activo </span><img src="Recursos/Led encendido.png" alt=""></img>`  
        cronometro = true;
    }
    
}

// Función para cargar jugadores (reutiliza actualizarListaJugadores)
async function cargarJugadores() {
    try {
        const res = await fetch('/jugadores');
        const data = await res.json();
        actualizarListaJugadores(data.jugadores);
    } catch (error) {
        console.error('Error cargando jugadores:', error);
    }
}

// Conexión SSE para actualizaciones en tiempo real
function conectarSSE() {
    const eventSource = new EventSource('/stream');

    eventSource.addEventListener('jugadores-update', (event) => {
        const data = JSON.parse(event.data);
        actualizarListaJugadores(data.jugadores);
        console.log('Lista de jugadores actualizada en tiempo real');
    });

    eventSource.onerror = (error) => {
        console.error('Error en la conexión SSE:', error);
        setTimeout(conectarSSE, 5000); // Reintento
    };
}

// Inicialización al cargar la página
window.onload = function () {
    cargarJugadores();
    conectarSSE();
};



//Desactivamos el reinicio de la página al enviar los formularios.
document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita el comportamiento por defecto (recargar)
});






// Control Botonera
function setupButtonActions() {
    const buttons = document.querySelectorAll('.action-btn');

    if (buttons.length === 0) {
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

            if (!response.ok) throw new Error(`Error ${response.status}`);
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

            switch(action) {
                case 'reiniciar-servidor':
                    confirmMessage = '¿Está seguro de reiniciar el servidor? <br> ¡Esto desconectará a todos los jugadores!';
                    endpoint = '/enviar-senal';
                    payload = {
                        tipo: 'reiniciar-servidor',
                        contenido: 'Reiniciar'
                    };
                    break;

                case 'apagar-servidor':
                    confirmMessage = '¿Está seguro de APAGAR el servidor? <br> ¡Esto desconectará a todos los jugadores!';
                    endpoint = '/enviar-senal';
                    payload = {
                        tipo: 'apagar-servidor',
                        contenido: 'Apagar'
                    };
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

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

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








// Inicialización segura cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado - Inicializando...');
    
    // Configurar formulario si existe
    const form = document.getElementById('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Formulario prevenido');
        });
    } else {
        console.warn('Formulario no encontrado');
    }
    
    // Configurar botones
    setupButtonActions();
    
    // Iniciar otras funciones
    cargarJugadores();
    conectarSSE();
});
  