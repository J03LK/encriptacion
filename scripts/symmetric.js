// Generar claves simétricas aleatorias
function generateSymmetricKeys() {
    const primaryKey = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const secondaryKey = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    
    document.getElementById('primaryKey').value = primaryKey;
    document.getElementById('secondaryKey').value = secondaryKey;
    
    showStatus('symStatus', 'Claves aleatorias generadas. Guárdalas para poder desencriptar después.');
}

// Encriptar con clave simétrica
async function encryptSymmetric() {
    try {
        const algorithm = document.getElementById('symAlgorithm').value;
        const primaryKey = document.getElementById('primaryKey').value;
        let secondaryKey = document.getElementById('secondaryKey').value;
        
        if (!primaryKey) {
            throw new Error('Se requiere una clave de encriptación para encriptar');
        }
        
        let data = document.getElementById('symTextInput').value;
        const fileInput = document.getElementById('symFileInput');
        
        if (fileInput.files.length > 0) {
            data = await readFileAsType(fileInput.files[0], 'text');
        }
        
        if (!data) {
            throw new Error('No hay datos para encriptar');
        }
        
        // Si el IV está vacío, generar uno aleatorio
        if (!secondaryKey) {
            const randomIV = CryptoJS.lib.WordArray.random(16);
            secondaryKey = CryptoJS.enc.Hex.stringify(randomIV);
            // Mostrar el IV generado en el campo
            document.getElementById('secondaryKey').value = secondaryKey;
            showStatus('symStatus', 'Se ha generado un Vector de Inicialización (IV) aleatorio');
        }
        
        // Encriptar según el algoritmo seleccionado
        let encryptedData;
        const keyUtf8 = CryptoJS.enc.Utf8.parse(primaryKey);
        const iv = CryptoJS.enc.Hex.parse(secondaryKey);
        
        switch (algorithm) {
            case 'aes':
                encryptedData = CryptoJS.AES.encrypt(data, keyUtf8, { 
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString();
                break;
            case 'blowfish':
                // Simulación de Blowfish usando CryptoJS (adaptación)
                encryptedData = CryptoJS.AES.encrypt(data, keyUtf8, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString();
                break;
            case 'des':
                encryptedData = CryptoJS.DES.encrypt(data, keyUtf8, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString();
                break;
            case 'tripledes':
                encryptedData = CryptoJS.TripleDES.encrypt(data, keyUtf8, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString();
                break;
            default:
                encryptedData = CryptoJS.AES.encrypt(data, keyUtf8, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString();
        }
        
        // Crear objeto con datos encriptados
        const result = {
            algorithm: algorithm,
            iv: secondaryKey,
            encryptedData: encryptedData
        };
        
        // Mostrar resultado
        document.getElementById('symResult').textContent = JSON.stringify(result, null, 2);
        showStatus('symStatus', 'Datos encriptados correctamente. Guarda la clave y el vector para desencriptar.');
        
    } catch (error) {
        showStatus('symStatus', 'Error: ' + error.message, true);
        console.error(error);
    }
}

// Desencriptar con clave simétrica
async function decryptSymmetric() {
    try {
        const primaryKey = document.getElementById('primaryKey').value;
        
        if (!primaryKey) {
            throw new Error('Se requiere la clave de encriptación para desencriptar');
        }
        
        let encryptedObject;
        const fileInput = document.getElementById('symFileInput');
        
        if (fileInput.files.length > 0) {
            const encryptedText = await readFileAsType(fileInput.files[0], 'text');
            try {
                encryptedObject = JSON.parse(encryptedText);
            } catch (e) {
                throw new Error('El archivo seleccionado no contiene un formato válido de datos encriptados');
            }
        } else {
            const encryptedText = document.getElementById('symTextInput').value;
            try {
                encryptedObject = JSON.parse(encryptedText);
            } catch (e) {
                throw new Error('El texto ingresado no contiene un formato válido de datos encriptados');
            }
        }
        
        if (!encryptedObject || !encryptedObject.encryptedData || !encryptedObject.iv) {
            throw new Error('Formato de datos encriptados inválido');
        }
        
        // Actualizar el campo IV con el valor del objeto encriptado
        document.getElementById('secondaryKey').value = encryptedObject.iv;
        
        // Desencriptar según el algoritmo usado
        const keyUtf8 = CryptoJS.enc.Utf8.parse(primaryKey);
        const iv = CryptoJS.enc.Hex.parse(encryptedObject.iv);
        
        let decryptedData;
        switch (encryptedObject.algorithm) {
            case 'aes':
                decryptedData = CryptoJS.AES.decrypt(encryptedObject.encryptedData, keyUtf8, { 
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString(CryptoJS.enc.Utf8);
                break;
            case 'blowfish':
                // Simulación de Blowfish (adaptación)
                decryptedData = CryptoJS.AES.decrypt(encryptedObject.encryptedData, keyUtf8, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString(CryptoJS.enc.Utf8);
                break;
            case 'des':
                decryptedData = CryptoJS.DES.decrypt(encryptedObject.encryptedData, keyUtf8, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString(CryptoJS.enc.Utf8);
                break;
            case 'tripledes':
                decryptedData = CryptoJS.TripleDES.decrypt(encryptedObject.encryptedData, keyUtf8, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString(CryptoJS.enc.Utf8);
                break;
            default:
                decryptedData = CryptoJS.AES.decrypt(encryptedObject.encryptedData, keyUtf8, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }).toString(CryptoJS.enc.Utf8);
        }
        
        if (!decryptedData) {
            throw new Error('No se pudo desencriptar. La clave de encriptación podría ser incorrecta.');
        }
        
        // Mostrar resultado
        document.getElementById('symResult').textContent = decryptedData;
        showStatus('symStatus', 'Datos desencriptados correctamente');
        
    } catch (error) {
        showStatus('symStatus', 'Error: ' + error.message, true);
        console.error(error);
    }
}

// Guardar resultado de encriptación simétrica
function saveSymResult() {
    const result = document.getElementById('symResult').textContent;
    const fileName = document.getElementById('symSaveFileName').value || 'encrypted_data.json';
    
    if (!result) {
        showStatus('symStatus', 'No hay resultado para guardar', true);
        return;
    }
    
    // Determinar el tipo MIME según el contenido
    let mimeType = 'application/json';
    if (fileName.endsWith('.txt')) {
        mimeType = 'text/plain';
    }
    
    saveFile(result, fileName, mimeType);
    showStatus('symStatus', `Archivo guardado como ${fileName}`);
}