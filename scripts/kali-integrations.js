// Función para detectar y procesar archivos de Kali Linux
async function processKaliFile(file) {
    try {
        const fileContent = await readFileAsType(file, 'text');
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        // Detectar tipo de archivo basado en contenido y extensión
        if (fileExtension === 'gpg' || fileExtension === 'asc' || 
            fileContent.includes('-----BEGIN PGP')) {
            
            // Archivo PGP de GnuPG/Kleopatra
            return {
                type: 'pgp',
                content: fileContent,
                isEncrypted: fileContent.includes('-----BEGIN PGP MESSAGE-----')
            };
        } 
        else if (fileExtension === 'key' || fileExtension === 'pem' || 
                fileContent.includes('-----BEGIN') && fileContent.includes('KEY-----')) {
            
            // Clave RSA o similar
            return {
                type: 'key',
                content: fileContent,
                isPublic: fileContent.includes('PUBLIC'),
                isPrivate: fileContent.includes('PRIVATE')
            };
        }
        else if (fileExtension === 'enc' || fileExtension === 'encrypted') {
            // Archivo encriptado genérico
            try {
                // Intentar parsear como JSON
                const jsonContent = JSON.parse(fileContent);
                return {
                    type: 'encrypted-json',
                    content: jsonContent,
                    algorithm: jsonContent.algorithm || 'unknown'
                };
            } catch (e) {
                // No es JSON, puede ser binario encriptado
                return {
                    type: 'encrypted-binary',
                    content: fileContent
                };
            }
        }
        else {
            // Intentar detectar por contenido
            if (fileContent.startsWith('{') && fileContent.endsWith('}')) {
                try {
                    const jsonContent = JSON.parse(fileContent);
                    if (jsonContent.encryptedData || jsonContent.ciphertext) {
                        return {
                            type: 'encrypted-json',
                            content: jsonContent,
                            algorithm: jsonContent.algorithm || 'unknown'
                        };
                    }
                } catch (e) {
                    // No es JSON válido
                }
            }
        }
        
        // Tipo desconocido
        return {
            type: 'unknown',
            content: fileContent
        };
    } catch (error) {
        console.error('Error al procesar archivo de Kali:', error);
        throw error;
    }
}

// Función para manejar la carga de archivos desde Kali Linux
async function handleKaliFileUpload(inputElement, targetSection) {
    try {
        if (inputElement.files.length === 0) {
            throw new Error('No se ha seleccionado ningún archivo');
        }
        
        const file = inputElement.files[0];
        const fileInfo = await processKaliFile(file);
        
        // Redirigir a la sección adecuada basada en el tipo de archivo
        switch (fileInfo.type) {
            case 'pgp':
                // Abrir pestaña de Kleopatra
                document.querySelector('.tablinks[onclick*="kleopatra"]').click();
                
                // Cargar el archivo en el input de Kleopatra
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                document.getElementById('kleopatraFile').files = dataTransfer.files;
                
                // Procesar automáticamente
                importFromKleopatra();
                break;
                
            case 'key':
                // Abrir pestaña de asimétrica
                document.querySelector('.tablinks[onclick*="asymmetric"]').click();
                
                // Colocar contenido en el campo adecuado
                if (fileInfo.isPublic) {
                    document.getElementById('publicKey').value = fileInfo.content;
                    showStatus('asymStatus', 'Clave pública cargada correctamente');
                } else if (fileInfo.isPrivate) {
                    document.getElementById('privateKey').value = fileInfo.content;
                    showStatus('asymStatus', 'Clave privada cargada correctamente');
                }
                break;
                
            case 'encrypted-json':
                // Determinar si usar simétrica o asimétrica basado en contenido
                if (fileInfo.content.encryptedKey) {
                    // Probablemente asimétrica
                    document.querySelector('.tablinks[onclick*="asymmetric"]').click();
                    document.getElementById('asymTextInput').value = JSON.stringify(fileInfo.content, null, 2);
                    showStatus('asymStatus', `Archivo encriptado detectado (${fileInfo.algorithm}). Cargado para desencriptar.`);
                } else {
                    // Probablemente simétrica
                    document.querySelector('.tablinks[onclick*="symmetric"]').click();
                    document.getElementById('symTextInput').value = JSON.stringify(fileInfo.content, null, 2);
                    showStatus('symStatus', `Archivo encriptado detectado (${fileInfo.algorithm}). Cargado para desencriptar.`);
                }
                break;
                
            case 'encrypted-binary':
            case 'unknown':
            default:
                // Abrir el lector de archivos para analizar
                document.querySelector('.tablinks[onclick*="fileReader"]').click();
                
                // Cargar el archivo en el input
                const dtFile = new DataTransfer();
                dtFile.items.add(file);
                document.getElementById('fileToRead').files = dtFile.files;
                
                // Procesar automáticamente
                readFile();
                break;
        }
        
    } catch (error) {
        alert('Error al procesar el archivo: ' + error.message);
        console.error(error);
    }
}

// Añadir detector de eventos para la carga de archivos en todos los inputs de tipo file
document.addEventListener('DOMContentLoaded', function() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.files.length > 0) {
                // Determinar sección basada en el ID del input
                let targetSection = '';
                if (this.id.includes('asym')) {
                    targetSection = 'asymmetric';
                } else if (this.id.includes('sym')) {
                    targetSection = 'symmetric';
                } else if (this.id.includes('kleopatra')) {
                    targetSection = 'kleopatra';
                } else if (this.id.includes('fileToRead')) {
                    targetSection = 'fileReader';
                }
                
                // Procesar archivo desde Kali Linux
                handleKaliFileUpload(this, targetSection);
            }
        });
    });
});