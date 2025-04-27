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


//Desactivamos el reinicio de la página al enviar los formularios.
document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita el comportamiento por defecto (recargar)
});







// CONTROL BOTONERA:
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
        const action = this.dataset.action;
        let endpoint, payload, confirmMessage;
        
        // Configuración según el botón presionado
        switch(action) {
            case 'reiniciar-servidor':
                confirmMessage = '¿Está seguro de reiniciar el servidor?';
                endpoint = '/back/enviar-senal';
                payload = {
                    tipo: 'reiniciar-servidor',
                    contenido: 'Reiniciar'
                };
                console.log('Se presionó Reiniciar servidor');
                break;
              
            case 'apagar-servidor':
                confirmMessage = '¿Está seguro de APAGAR el servidor?';
                endpoint = '/back/enviar-senal';
                payload = {
                    tipo: 'apagar-servidor',  // Asegúrate que coincida con el back
                    contenido: 'Apagar'
                };
                console.log('Se presionó Apagar servidor');
                break;
        }
        
        if (!confirm(confirmMessage)) return;
        
        try {
            // Mostrar estado de carga
            this.disabled = true;
            this.classList.add('loading');
            
            // Enviar la petición
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
            } else {
                throw new Error(result.message || 'Error desconocido');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            // Restaurar botón
            this.disabled = false;
            this.classList.remove('loading');
        }
    });
});
  
  