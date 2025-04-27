// Función para actualizar la lista de jugadores en el DOM
function actualizarListaJugadores(jugadores) {
    const contenedor = document.querySelector('.JugadoresLista');
    contenedor.innerHTML = '';

    jugadores.forEach(jugador => {
        contenedor.innerHTML += `
            <div class="jugador">
                <p><strong>Nombre:</strong> ${jugador.name}</p>
                <p><strong>ID:</strong> ${jugador.userId}</p>
                <img src="https://www.roblox.com/headshot-thumbnail/image?userId=${jugador.userId}&width=150&height=150&format=png" alt="Avatar de ${jugador.name}">
            </div>
        `;
    });
}

// Función para cargar jugadores (ahora reutiliza actualizarListaJugadores)
async function cargarJugadores() {
    try {
        const res = await fetch('/back/jugadores');
        const data = await res.json();
        actualizarListaJugadores(data.jugadores);
    } catch (error) {
        console.error('Error cargando jugadores:', error);
    }
}

// Conexión SSE para actualizaciones en tiempo real
function conectarSSE() {
    const eventSource = new EventSource('/back/stream');

    eventSource.addEventListener('jugadores-update', (event) => {
        const data = JSON.parse(event.data);
        actualizarListaJugadores(data.jugadores);
        console.log('Lista de jugadores actualizada en tiempo real');
    });

    eventSource.onerror = (error) => {
        console.error('Error en la conexión SSE:', error);
        // Reconectar después de 5 segundos
        setTimeout(conectarSSE, 5000);
    };
}

// Inicialización cuando se carga la página
window.onload = function() {
    cargarJugadores();
    conectarSSE();
};