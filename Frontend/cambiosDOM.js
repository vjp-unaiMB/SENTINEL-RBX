async function cargarJugadores() {
    try {
        const res = await fetch('/back/jugadores');
        const data = await res.json();
        const jugadores = data.jugadores;

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

    } catch (error) {
        console.error('Error cargando jugadores:', error);
    }
}

// Llamar a la función al cargar la página
window.onload = cargarJugadores;






