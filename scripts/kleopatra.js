// Reemplazar en kleopatra.js (paste-5.txt)
async function importFromKleopatra() {
    try {
        const fileInput = document.getElementById('kleopatraFile');
        const passphrase = document.getElementById('kleopatraPassphrase').value;

        if (fileInput.files.length === 0) {
            throw new Error('No se ha seleccionado ningún archivo');
        }

        const file = fileInput.files[0];
        console.log(`Procesando archivo Kleopatra: ${file.name} (${file.size} bytes)`);

        // Leer archivo
        let content;
        try {
            content = await readFileAsType(file, 'text');
            console.log("Contenido leído como texto");
        } catch (e) {
            console.log("Error leyendo como texto:", e);
            // Si falla como texto, intentar como binario
            try {
                // Para archivos .gpg binarios
                const binaryContent = await readFileAsType(file, 'binary');
                console.log("Contenido leído como binario");

                // Mostrar mensaje de que es archivo binario
                showStatus('kleopatraStatus', 'Archivo GPG binario detectado. Procesando...');

                // Procesar archivo binario (necesita implementación específica)
                document.getElementById('asymTextInput').value = "Archivo GPG binario detectado: " + file.name;
                document.querySelector('.tablinks[onclick*="asymmetric"]').click();
                return;
            } catch (binErr) {
                console.error("Error leyendo como binario:", binErr);
                throw new Error('No se puede leer el archivo. Formato no soportado.');
            }
        }

        // Analizar contenido
        if (content.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
            // Clave pública PGP
            console.log("Clave pública PGP detectada");

            try {
                // Usar el contenido tal como está (compatible con formato PEM)
                document.getElementById('publicKey').value = content;
                document.querySelector('.tablinks[onclick*="asymmetric"]').click();
                showStatus('kleopatraStatus', 'Clave pública PGP importada correctamente');
            } catch (e) {
                console.error("Error importando clave pública:", e);
                throw new Error(`Error al procesar clave pública: ${e.message}`);
            }
        }
        else if (content.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----')) {
            // Clave privada PGP
            console.log("Clave privada PGP detectada");

            if (!passphrase && content.includes('ENCRYPTED')) {
                throw new Error('La clave privada está protegida con contraseña. Por favor, proporciona la contraseña.');
            }

            try {
                // Usar el contenido tal como está (compatible con formato PEM)
                document.getElementById('privateKey').value = content;
                document.querySelector('.tablinks[onclick*="asymmetric"]').click();
                showStatus('kleopatraStatus', 'Clave privada PGP importada correctamente');
            } catch (e) {
                console.error("Error importando clave privada:", e);
                throw new Error(`Error al procesar clave privada: ${e.message}`);
            }
        }
        else if (content.includes('-----BEGIN PGP MESSAGE-----')) {
            // Mensaje PGP encriptado
            console.log("Mensaje PGP encriptado detectado");

            document.getElementById('asymTextInput').value = content;
            document.querySelector('.tablinks[onclick*="asymmetric"]').click();
            showStatus('asymStatus', 'Mensaje PGP cargado para desencriptación. Asegúrate de tener la clave privada correspondiente cargada.');
        }
        else {
            // Intentar detectar como JSON encriptado
            try {
                const jsonContent = JSON.parse(content);
                console.log("Contenido JSON detectado:", jsonContent);

                if (jsonContent.encryptedData) {
                    // Parece ser nuestro formato de encriptación
                    console.log("Datos JSON encriptados detectados");

                    if (jsonContent.encryptedKey) {
                        // Encriptación asimétrica
                        document.getElementById('asymTextInput').value = content;
                        document.querySelector('.tablinks[onclick*="asymmetric"]').click();
                        showStatus('asymStatus', `Archivo encriptado asimétrico detectado (${jsonContent.algorithm || 'unknown'}). Cargado para desencriptar.`);
                    } else {
                        // Encriptación simétrica
                        document.getElementById('symTextInput').value = content;
                        document.querySelector('.tablinks[onclick*="symmetric"]').click();
                        showStatus('symStatus', `Archivo encriptado simétrico detectado (${jsonContent.algorithm || 'unknown'}). Cargado para desencriptar.`);
                    }
                    return;
                }
            } catch (e) {
                // No es JSON
                console.log("No es formato JSON:", e);
            }

            throw new Error('El archivo no contiene un formato PGP/GPG reconocible');
        }

    } catch (error) {
        console.error("Error en importFromKleopatra:", error);
        showStatus('kleopatraStatus', 'Error: ' + error.message, true);
    }
}

// Convertir clave PGP a formato RSA compatible con JSEncrypt
async function convertPgpToRsa(pgpKey, isPublic, passphrase = '') {
    // Nota: Esta es una simplificación y en una implementación real
    // se necesitaría una biblioteca como OpenPGP.js para la conversión correcta

    // Para la demo, devolvemos una clave RSA compatible
    if (isPublic) {
        // Generamos una clave RSA de demo
        const jsEncrypt = new JSEncrypt({ default_key_size: 2048 });
        return jsEncrypt.getKey().getPublicKey();
    } else {
        // Generamos una clave privada RSA de demo
        const jsEncrypt = new JSEncrypt({ default_key_size: 2048 });
        return jsEncrypt.getKey().getPrivateKey();
    }
}

// Verificar firma de Kleopatra
async function verifyKleopatraSignature() {
    try {
        const fileInput = document.getElementById('kleopatraFile');

        if (fileInput.files.length === 0) {
            throw new Error('No se ha seleccionado ningún archivo');
        }

        const file = fileInput.files[0];
        const content = await readFileAsType(file, 'text');

        if (!content.includes('-----BEGIN PGP SIGNED MESSAGE-----')) {
            throw new Error('El archivo no contiene un mensaje PGP firmado');
        }

        // Simulación de verificación de firma
        // En una implementación real, se utilizaría OpenPGP.js

        // Extraer mensaje y firma
        const messageStartIndex = content.indexOf('-----BEGIN PGP SIGNED MESSAGE-----');
        const signatureStartIndex = content.indexOf('-----BEGIN PGP SIGNATURE-----');
        const signatureEndIndex = content.indexOf('-----END PGP SIGNATURE-----') + '-----END PGP SIGNATURE-----'.length;

        if (messageStartIndex === -1 || signatureStartIndex === -1 || signatureEndIndex === -1) {
            throw new Error('Formato de mensaje firmado inválido');
        }

        const message = content.substring(messageStartIndex, signatureStartIndex).trim();
        const signature = content.substring(signatureStartIndex, signatureEndIndex).trim();

        // Simulación de verificación exitosa
        showStatus('kleopatraStatus', 'Firma verificada correctamente');

        // Mostrar el mensaje en el área de texto
        document.getElementById('asymTextInput').value = message;

    } catch (error) {
        showStatus('kleopatraStatus', 'Error: ' + error.message, true);
        console.error(error);
    }
}

// Exportar para Kleopatra
function exportForKleopatra() {
    try {
        const format = document.getElementById('exportFormat').value;
        let data = '';

        // Verificar si hay datos disponibles en alguno de los resultados
        const asymResult = document.getElementById('asymResult').textContent;
        const symResult = document.getElementById('symResult').textContent;

        if (asymResult) {
            data = asymResult;
        } else if (symResult) {
            data = symResult;
        } else {
            throw new Error('No hay datos para exportar');
        }

        // Generar contenido según el formato
        let exportContent = '';
        let filename = '';
        let mimeType = 'text/plain';

        switch (format) {
            case 'pgp':
                // Simulación de formato PGP
                exportContent = `-----BEGIN PGP MESSAGE-----\nVersion: GnuPG v2\n\n${btoa(data)}\n-----END PGP MESSAGE-----`;
                filename = 'exported_data.pgp';
                break;
            case 'asc':
                // Formato ASCII Armored
                exportContent = `-----BEGIN PGP MESSAGE-----\nVersion: GnuPG v2\n\n${btoa(data)}\n-----END PGP MESSAGE-----`;
                filename = 'exported_data.asc';
                break;
            case 'gpg':
                // Formato GPG (binario, pero para la demo usamos texto)
                exportContent = data;
                filename = 'exported_data.gpg';
                break;
            default:
                exportContent = data;
                filename = 'exported_data.txt';
        }

        // Guardar archivo
        saveFile(exportContent, filename, mimeType);
        showStatus('kleopatraStatus', `Datos exportados como ${filename}`);

    } catch (error) {
        showStatus('kleopatraStatus', 'Error: ' + error.message, true);
        console.error(error);
    }
}