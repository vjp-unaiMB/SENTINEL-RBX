// mensaje de llegada de jugadores 
const eventoJugadores = new EventSource('/back/stream');

eventoJugadores.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const jugadores = data.jugadores;

    const contenedor = document.querySelector('.JugadoresLista');
    contenedor.innerHTML = ''; // Limpiar antes de añadir nuevos

    jugadores.forEach(jugador => {
        contenedor.innerHTML += `
            <div class="jugador">
                <p><strong>Nombre:</strong> ${jugador.name}</p>
                <p><strong>ID:</strong> ${jugador.userId}</p>
                <img src="https://www.roblox.com/headshot-thumbnail/image?userId=${jugador.userId}&width=150&height=150&format=png" alt="Avatar de ${jugador.name}">
            </div>
        `;
    });
};



// Mensaje de señal recibida
const eventoMensaje = new EventSource('/back/stream');
        
eventoMensaje.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
};
