// mensaje de llegada de jugadores 
const jugadoresSource = new EventSource('/back/stream');

jugadoresSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const jugadores = data.jugadores;

    if (!Array.isArray(jugadores)) return;

    const contenedor = document.getElementById('jugadoresContainer');
    contenedor.innerHTML = ''; // Limpiar antes de renderizar nueva lista

    jugadores.forEach(jugador => {
        contenedor.innerHTML += `
            <div class="entrada jugador">
                <img src="https://www.roblox.com/headshot-thumbnail/image?userId=${jugador.userId}&width=150&height=150&format=png" alt="Avatar de ${jugador.name}">
                <p><strong>Nombre:</strong> ${jugador.name}</p>
                <p><strong>ID:</strong> ${jugador.userId}</p>
            </div>
        `;
    });
};



// Mensaje de señal recibida
const eventSource = new EventSource('/back/stream');
        
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    alert("📩 Señal recibida:\n" + JSON.stringify(data, null, 2));
};
