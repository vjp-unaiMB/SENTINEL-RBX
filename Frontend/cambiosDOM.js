// mensaje de llegada de jugadores 
const eventoJugadores = new EventSource('/back/stream');

eventoJugadores.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    const jugadores = data.jugadores;

    const contenedor = document.querySelector('.JugadoresLista');
    contenedor.innerHTML = ''; // Limpiar lista antes de renderizar nueva

    for (const jugador of jugadores) {
        const thumbnailURL = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${jugador.userId}&size=150x150&format=Png`;

        try {
            const response = await fetch(thumbnailURL);
            const json = await response.json();
            const imageUrl = json.data[0]?.imageUrl || '';

            contenedor.innerHTML += `
                <div class="jugador">
                    <p><strong>Nombre:</strong> ${jugador.name}</p>
                    <p><strong>ID:</strong> ${jugador.userId}</p>
                    <img src="${imageUrl}" alt="Avatar de ${jugador.name}">
                </div>
            `;
        } catch (error) {
            console.error("❌ Error obteniendo imagen:", error);
        }
    }
};




