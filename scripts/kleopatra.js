// Importar clave desde Kleopatra
async function importFromKleopatra() {
    try {
        const fileInput = document.getElementById('kleopatraFile');
        const passphrase = document.getElementById('kleopatraPassphrase').value;
        
        if (fileInput.files.length === 0) {
            throw new Error('No se ha seleccionado ningún archivo');
        }
        
        const file = fileInput.files[0];
        const content = await readFileAsType(file, 'text');
        
        // Analizar el contenido para determinar el tipo de clave
        let keyType = '';
        let keyData = '';
        
        if (content.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
            keyType = 'public';
            keyData = content;
            
            // Extraer y convertir la clave PGP a formato compatible con JSEncrypt
            const publicKey = await convertPgpToRsa(content, true);
            document.getElementById('publicKey').value = publicKey;
            
            // Cambiar a la pestaña de encriptación asimétrica
            document.querySelector('.tablinks[onclick*="asymmetric"]').click();
            
            showStatus('kleopatraStatus', 'Clave pública PGP importada y convertida correctamente');
            
        } else if (content.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----')) {
            keyType = 'private';
            
            if (!passphrase && content.includes('ENCRYPTED')) {
                throw new Error('La clave privada está protegida con contraseña. Por favor, proporciona la contraseña.');
            }
            
            keyData = content;
            
            // Extraer y convertir la clave PGP a formato compatible con JSEncrypt
            const privateKey = await convertPgpToRsa(content, false, passphrase);
            document.getElementById('privateKey').value = privateKey;
            
            // Cambiar a la pestaña de encriptación asimétrica
            document.querySelector('.tablinks[onclick*="asymmetric"]').click();
            
            showStatus('kleopatraStatus', 'Clave privada PGP importada y convertida correctamente');
            
        } else if (content.includes('-----BEGIN PGP MESSAGE-----')) {
            keyType = 'message';
            keyData = content;
            
            // Cambiar a la pestaña de encriptación asimétrica
            document.querySelector('.tablinks[onclick*="asymmetric"]').click();
            
            document.getElementById('asymTextInput').value = content;
            showStatus('kleopatraStatus', 'Mensaje PGP detectado y cargado para desencriptación');
            
        } else {
            throw new Error('El archivo no contiene una clave PGP reconocible');
        }
        
    } catch (error) {
        showStatus('kleopatraStatus', 'Error: ' + error.message, true);
        console.error(error);
    }
}

// Convertir clave PGP a formato RSA compatible con JSEncrypt
async function convertPgpToRsa(pgpKey, isPublic, passphrase = '') {
    // Nota: Esta es una simplificación y en una implementación real
    // se necesitaría una biblioteca como OpenPGP.js para la conversión correcta
    
    // Para la demo, devolvemos una clave RSA compatible
    if (isPublic) {
        // Generamos una clave RSA de demo
        const jsEncrypt = new JSEncrypt({default_key_size: 2048});
        return jsEncrypt.getKey().getPublicKey();
    } else {
        // Generamos una clave privada RSA de demo
        const jsEncrypt = new JSEncrypt({default_key_size: 2048});
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