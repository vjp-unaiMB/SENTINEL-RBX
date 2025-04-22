// mensaje de llegada de jugadores 
const eventoJugadores = new EventSource('/back/stream');

eventoJugadores.onmessage = async (event) => {
    const dataParsed = JSON.parse(event.data);
    const jugadores = dataParsed.jugadores;

    const contenedor = document.querySelector('.JugadoresLista');
    contenedor.innerHTML = ''; // Limpiar antes de renderizar

    for (const jugador of jugadores) {
        try {
            const res = await fetch(`/proxy/avatar/${jugador.userId}`);
            const json = await res.json();
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




