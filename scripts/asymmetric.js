// Generar par de claves RSA
function generateKeyPair() {
    const jsEncrypt = new JSEncrypt({ default_key_size: 2048 });
    const keyPair = jsEncrypt.getKey();

    document.getElementById('publicKey').value = keyPair.getPublicKey();
    document.getElementById('privateKey').value = keyPair.getPrivateKey();

    showStatus('asymStatus', 'Par de claves generado correctamente');
}

// Encriptar con clave asimétrica
async function encryptAsymmetric() {
    try {
        const algorithm = document.getElementById('asymAlgorithm').value;
        const publicKey = document.getElementById('publicKey').value;

        if (!publicKey) {
            throw new Error('Se requiere una clave pública para encriptar');
        }

        let data = document.getElementById('asymTextInput').value;
        const fileInput = document.getElementById('asymFileInput');

        if (fileInput.files.length > 0) {
            data = await readFileAsType(fileInput.files[0], 'text');
        }

        if (!data) {
            throw new Error('No hay datos para encriptar');
        }

        // Generar una clave simétrica aleatoria para encriptar los datos
        const symmetricKey = CryptoJS.lib.WordArray.random(32).toString();

        // Encriptar datos con la clave simétrica según el algoritmo seleccionado
        let encryptedData;
        switch (algorithm) {
            case 'aes':
                encryptedData = CryptoJS.AES.encrypt(data, symmetricKey).toString();
                break;
            case 'blowfish':
                // Usamos Forge para Blowfish ya que CryptoJS no lo soporta nativamente
                const cipher = forge.cipher.createCipher('blowfish-cbc', forge.util.createBuffer(symmetricKey));
                cipher.start({ iv: forge.random.getBytesSync(8) });
                cipher.update(forge.util.createBuffer(data, 'utf8'));
                cipher.finish();
                encryptedData = forge.util.encode64(cipher.output.getBytes());
                break;
            case 'des':
                encryptedData = CryptoJS.DES.encrypt(data, symmetricKey).toString();
                break;
            case 'tripledes':
                encryptedData = CryptoJS.TripleDES.encrypt(data, symmetricKey).toString();
                break;
            default:
                encryptedData = CryptoJS.AES.encrypt(data, symmetricKey).toString();
        }

        // Encriptar la clave simétrica con la clave pública RSA
        const jsEncrypt = new JSEncrypt();
        jsEncrypt.setPublicKey(publicKey);
        const encryptedSymmetricKey = jsEncrypt.encrypt(symmetricKey);

        // Crear objeto con la clave encriptada y los datos encriptados
        const result = {
            algorithm: algorithm,
            encryptedKey: encryptedSymmetricKey,
            encryptedData: encryptedData
        };

        // Mostrar resultado
        document.getElementById('asymResult').textContent = JSON.stringify(result, null, 2);
        showStatus('asymStatus', 'Datos encriptados correctamente');

    } catch (error) {
        showStatus('asymStatus', 'Error: ' + error.message, true);
        console.error(error);
    }
}

// Desencriptar con clave asimétrica
// Modificar en asymmetric.js (paste.txt)
async function decryptAsymmetric() {
    try {
        const privateKey = document.getElementById('privateKey').value;

        if (!privateKey) {
            throw new Error('Se requiere una clave privada para desencriptar');
        }

        let encryptedObject;
        let encryptedText;
        const fileInput = document.getElementById('asymFileInput');

        if (fileInput.files.length > 0) {
            encryptedText = await readFileAsType(fileInput.files[0], 'text');
        } else {
            encryptedText = document.getElementById('asymTextInput').value;
        }

        if (!encryptedText) {
            throw new Error('No hay datos para desencriptar');
        }

        // Detectar si es un mensaje PGP
        if (encryptedText.includes('-----BEGIN PGP MESSAGE-----')) {
            // Mostrar un mensaje de que se necesita integración con OpenPGP
            showStatus('asymStatus', 'Detectado mensaje PGP. Esta funcionalidad requiere configuración adicional con OpenPGP.js.', true);
            return;
        }

        // Intentar parsear como JSON
        try {
            encryptedObject = JSON.parse(encryptedText);
        } catch (e) {
            throw new Error('Formato de datos encriptados no reconocido. Debe ser JSON válido.');
        }

        if (!encryptedObject || !encryptedObject.encryptedKey || !encryptedObject.encryptedData) {
            throw new Error('Formato de datos encriptados inválido. Falta clave o datos.');
        }

        // Desencriptar la clave simétrica con la clave privada RSA
        const jsEncrypt = new JSEncrypt();
        jsEncrypt.setPrivateKey(privateKey);
        const symmetricKey = jsEncrypt.decrypt(encryptedObject.encryptedKey);

        if (!symmetricKey) {
            throw new Error('No se pudo desencriptar la clave simétrica. La clave privada podría ser incorrecta.');
        }

        // Desencriptar datos con la clave simétrica según el algoritmo usado
        let decryptedData;
        switch (encryptedObject.algorithm) {
            case 'aes':
                decryptedData = CryptoJS.AES.decrypt(encryptedObject.encryptedData, symmetricKey).toString(CryptoJS.enc.Utf8);
                break;
            case 'blowfish':
                // Implementación simplificada
                decryptedData = CryptoJS.AES.decrypt(encryptedObject.encryptedData, symmetricKey).toString(CryptoJS.enc.Utf8);
                break;
            case 'des':
                decryptedData = CryptoJS.DES.decrypt(encryptedObject.encryptedData, symmetricKey).toString(CryptoJS.enc.Utf8);
                break;
            case 'tripledes':
                decryptedData = CryptoJS.TripleDES.decrypt(encryptedObject.encryptedData, symmetricKey).toString(CryptoJS.enc.Utf8);
                break;
            default:
                decryptedData = CryptoJS.AES.decrypt(encryptedObject.encryptedData, symmetricKey).toString(CryptoJS.enc.Utf8);
        }

        if (!decryptedData) {
            throw new Error('No se pudo desencriptar los datos. El formato o la clave podrían ser incorrectos.');
        }

        // Mostrar resultado
        document.getElementById('asymResult').textContent = decryptedData;
        showStatus('asymStatus', 'Datos desencriptados correctamente');

        // Preparar nombre de archivo para descargar
        const fileNameInput = document.getElementById('asymSaveFileName');
        if (!fileNameInput.value) {
            // Sugerir un nombre de archivo basado en el contenido desencriptado
            let suggestedName = 'decrypted';

            // Intentar determinar el tipo de archivo
            if (decryptedData.startsWith('{') && decryptedData.endsWith('}')) {
                suggestedName += '.json';
            } else if (decryptedData.startsWith('<')) {
                suggestedName += '.xml';
            } else {
                suggestedName += '.txt';
            }

            fileNameInput.value = suggestedName;
        }

    } catch (error) {
        showStatus('asymStatus', 'Error: ' + error.message, true);
        console.error('Error en desencriptación:', error);
    }
}

// Guardar resultado de encriptación asimétrica
function saveAsymResult() {
    const result = document.getElementById('asymResult').textContent;
    const fileName = document.getElementById('asymSaveFileName').value || 'encrypted_data.json';

    if (!result) {
        showStatus('asymStatus', 'No hay resultado para guardar', true);
        return;
    }

    // Determinar el tipo MIME según el contenido
    let mimeType = 'application/json';
    if (fileName.endsWith('.txt')) {
        mimeType = 'text/plain';
    }

    saveFile(result, fileName, mimeType);
    showStatus('asymStatus', `Archivo guardado como ${fileName}`);
}

// Funciones adicionales para manejo de claves
function exportKeys() {
    const publicKey = document.getElementById('publicKey').value;
    const privateKey = document.getElementById('privateKey').value;

    if (!publicKey && !privateKey) {
        showStatus('asymStatus', 'No hay claves para exportar', true);
        return;
    }

    const keyData = {
        publicKey: publicKey || null,
        privateKey: privateKey || null
    };

    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'encryption_keys.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showStatus('asymStatus', 'Claves exportadas correctamente');
}

// Función para importar claves
async function importKeys(file) {
    try {
        const content = await readFileAsType(file, 'text');
        let keyData;

        try {
            keyData = JSON.parse(content);
        } catch (e) {
            // No es JSON, podría ser una clave en formato PEM
            if (content.includes('BEGIN PUBLIC KEY')) {
                document.getElementById('publicKey').value = content;
                showStatus('asymStatus', 'Clave pública importada correctamente');
                return;
            } else if (content.includes('BEGIN PRIVATE KEY') || content.includes('BEGIN RSA PRIVATE KEY')) {
                document.getElementById('privateKey').value = content;
                showStatus('asymStatus', 'Clave privada importada correctamente');
                return;
            } else {
                throw new Error('Formato de archivo de claves no reconocido');
            }
        }

        if (keyData.publicKey) {
            document.getElementById('publicKey').value = keyData.publicKey;
        }

        if (keyData.privateKey) {
            document.getElementById('privateKey').value = keyData.privateKey;
        }

        showStatus('asymStatus', 'Claves importadas correctamente');
    } catch (error) {
        showStatus('asymStatus', 'Error al importar claves: ' + error.message, true);
    }
}