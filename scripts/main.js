// Funciones para manejar las pestañas
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Función para mostrar mensajes de estado
function showStatus(elementId, message, isError = false) {
    const statusElement = document.getElementById(elementId);
    statusElement.textContent = message;
    statusElement.className = 'status ' + (isError ? 'error' : 'success');
}

// Inicializar pantalla
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar mensaje de bienvenida
    alert('Aplicación de encriptación/desencriptación para Kali Linux inicializada correctamente.');
    
    // Generar claves iniciales para facilitar el uso
    generateKeyPair();
    generateSymmetricKeys();
    
    // Añadir evento para tecla Enter en inputs de texto
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // Evitar el comportamiento predeterminado
                e.preventDefault();
                
                // Encontrar botón más cercano y hacer clic
                const parentElement = this.parentElement;
                const nearestButton = parentElement.querySelector('button');
                if (nearestButton) {
                    nearestButton.click();
                }
            }
        });
    });
});