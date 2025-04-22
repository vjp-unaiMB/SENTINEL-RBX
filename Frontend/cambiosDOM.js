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
                <img src="https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${jugador.userId}&size=150x150&format=Png">
            </div>
        `;
    });
};




