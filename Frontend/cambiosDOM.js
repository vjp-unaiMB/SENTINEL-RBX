// mensaje de llegada de jugadores 
const eventoJugadores = new EventSource('/back/stream');

eventoJugadores.onmessage = (event) => {
    const dataParsed = JSON.parse(event.data);
    const jugadores = dataParsed.jugadores;

    const contenedor = document.querySelector('.JugadoresLista');
    contenedor.innerHTML = ''; // Limpiar antes de renderizar

    jugadores.forEach(jugador => {
        const imageUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${jugador.userId}&width=150&height=150&format=png`;

        contenedor.innerHTML += `
            <div class="jugador">
                <p><strong>Nombre:</strong> ${jugador.name}</p>
                <p><strong>ID:</strong> ${jugador.userId}</p>
                <img src="${imageUrl}" alt="Avatar de ${jugador.name}">
            </div>
        `;
    });
};





