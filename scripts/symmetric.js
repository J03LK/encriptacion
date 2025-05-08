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
        
        const fileInput = document.getElementById('symFileInput');
        const algorithm = document.getElementById('symAlgorithm').value;
        
        // Si hay un archivo seleccionado
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            console.log("Procesando archivo:", file.name);
            
            // Leer el archivo como ArrayBuffer para procesar archivos binarios
            const fileBuffer = await readFileAsArrayBuffer(file);
            
            // Detectar si es un archivo OpenSSL
            if (file.name.endsWith('.enc') || file.name.endsWith('.ssl')) {
                console.log("Detectado posible archivo OpenSSL");
                
                try {
                    // Convertir la clave a un formato que OpenSSL pueda usar
                    // OpenSSL usa un derivado de la clave basado en la contraseña
                    const password = primaryKey;
                    
                    // En un entorno real, necesitarías extraer el salt del archivo
                    // Para simplificar, asumimos una clave directa
                    const key = CryptoJS.enc.Utf8.parse(password);
                    
                    // Extraer IV (en OpenSSL suele estar en los primeros 16 bytes después del salt)
                    // Esto es una simplificación - en realidad necesitarías analizar la cabecera
                    const fileData = new Uint8Array(fileBuffer);
                    
                    // Detectar si tiene formato OpenSSL Salted
                    let saltedFormat = false;
                    let dataOffset = 0;
                    let salt = null;
                    
                    // Comprobar si el archivo comienza con "Salted__" (formato OpenSSL)
                    if (fileData.length > 16 && 
                        String.fromCharCode(...fileData.slice(0, 8)) === "Salted__") {
                        
                        saltedFormat = true;
                        salt = fileData.slice(8, 16);
                        dataOffset = 16; // Saltar cabecera (8) + salt (8)
                        
                        console.log("Formato OpenSSL Salted detectado");
                    }
                    
                    // Mostrar información para depuración
                    console.log("Salt detectado:", salt ? Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('') : "No");
                    
                    // Derivar clave e IV si tenemos salt
                    let derivedKey = key;
                    let iv = CryptoJS.enc.Hex.parse("0".repeat(32)); // IV por defecto
                    
                    if (saltedFormat && salt) {
                        // En OpenSSL, la clave y el IV se derivan del password y el salt
                        // Esto es una aproximación de EVP_BytesToKey
                        const keyAndIv = deriveKeyAndIvFromPassword(password, salt);
                        derivedKey = keyAndIv.key;
                        iv = keyAndIv.iv;
                        
                        console.log("Clave derivada:", CryptoJS.enc.Hex.stringify(derivedKey));
                        console.log("IV derivado:", CryptoJS.enc.Hex.stringify(iv));
                    } else {
                        // Sin formato Salted, intentar con la clave directa
                        // y el IV proporcionado
                        const providedIv = document.getElementById('secondaryKey').value;
                        if (providedIv) {
                            iv = CryptoJS.enc.Hex.parse(providedIv);
                        }
                    }
                    
                    // Extraer los datos cifrados (saltando la cabecera si es necesario)
                    const encryptedData = fileData.slice(dataOffset);
                    
                    // Convertir a formato que CryptoJS pueda usar
                    const encryptedWordArray = CryptoJS.lib.WordArray.create(encryptedData);
                    
                    // Intentar desencriptar con varios modos
                    let decryptedData = null;
                    let decryptionMethod = "";
                    
                    // 1. Intentar con AES-CBC
                    try {
                        decryptedData = CryptoJS.AES.decrypt(
                            { ciphertext: encryptedWordArray },
                            derivedKey,
                            { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
                        );
                        decryptionMethod = "AES-CBC";
                    } catch (e) {
                        console.log("Error con AES-CBC:", e);
                    }
                    
                    // 2. Si falla, intentar con AES-ECB
                    if (!decryptedData || decryptedData.sigBytes === 0) {
                        try {
                            decryptedData = CryptoJS.AES.decrypt(
                                { ciphertext: encryptedWordArray },
                                derivedKey,
                                { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
                            );
                            decryptionMethod = "AES-ECB";
                        } catch (e) {
                            console.log("Error con AES-ECB:", e);
                        }
                    }
                    
                    // Verificar si tenemos datos desencriptados
                    if (decryptedData && decryptedData.sigBytes > 0) {
                        console.log(`Desencriptación exitosa con ${decryptionMethod}`);
                        
                        // Convertir a texto si es posible, o mantener como binario
                        let resultContent;
                        try {
                            // Intentar como UTF-8
                            resultContent = decryptedData.toString(CryptoJS.enc.Utf8);
                            
                            // Si tiene caracteres no imprimibles, probablemente es binario
                            if (/[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(resultContent.substring(0, 100))) {
                                // Es binario, usar como base64
                                resultContent = decryptedData.toString(CryptoJS.enc.Base64);
                                showStatus('symStatus', 'Archivo binario desencriptado (mostrado en Base64)');
                            } else {
                                showStatus('symStatus', 'Archivo de texto desencriptado correctamente');
                            }
                        } catch (e) {
                            // Error al convertir a UTF-8, probablemente binario
                            resultContent = decryptedData.toString(CryptoJS.enc.Base64);
                            showStatus('symStatus', 'Archivo binario desencriptado (mostrado en Base64)');
                        }
                        
                        // Mostrar resultado
                        document.getElementById('symResult').textContent = resultContent;
                        
                        // Definir nombre para guardar
                        const originalName = file.name.replace(/\.enc$|\.ssl$/, '');
                        document.getElementById('symSaveFileName').value = originalName;
                        
                        return;
                    }
                    
                    throw new Error('No se pudo desencriptar el archivo. La clave podría ser incorrecta o el formato no es compatible.');
                    
                } catch (e) {
                    console.error("Error desencriptando archivo OpenSSL:", e);
                    throw new Error('Error al desencriptar archivo de OpenSSL: ' + e.message);
                }
            }
            
            // Si llegamos aquí, intentamos con el formato JSON estándar
            try {
                const textContent = await readFileAsType(file, 'text');
                const encryptedObject = JSON.parse(textContent);
                
                if (!encryptedObject || !encryptedObject.encryptedData) {
                    throw new Error('Formato JSON no válido para desencripción');
                }
                
                // Continuar con la desencriptación normal...
                // [resto del código original para JSON]
                
            } catch (jsonErr) {
                throw new Error('El archivo seleccionado no contiene un formato válido de datos encriptados');
            }
        } else {
            // Usar texto del input
            // [resto del código original]
        }
        
        // [resto del código original]
        
    } catch (error) {
        showStatus('symStatus', 'Error: ' + error.message, true);
        console.error(error);
    }
}

// Función auxiliar para derivar clave e IV de password y salt (estilo OpenSSL)
function deriveKeyAndIvFromPassword(password, salt) {
    const keySize = 32; // 32 bytes = 256 bits para AES-256
    const ivSize = 16;  // 16 bytes = 128 bits para el IV
    
    // Convertir password a WordArray
    const passwordWordArray = CryptoJS.enc.Utf8.parse(password);
    const saltWordArray = CryptoJS.lib.WordArray.create(salt);
    
    // Material inicial
    let keyMaterial = CryptoJS.lib.WordArray.create();
    let keyAndIvData = CryptoJS.lib.WordArray.create();
    
    // Generar suficiente material de clave
    while (keyAndIvData.sigBytes < keySize + ivSize) {
        // D_i = HASH(D_{i-1} || password || salt)
        if (keyMaterial.sigBytes > 0) {
            keyMaterial = CryptoJS.MD5(keyMaterial.concat(passwordWordArray).concat(saltWordArray));
        } else {
            keyMaterial = CryptoJS.MD5(passwordWordArray.concat(saltWordArray));
        }
        
        keyAndIvData = keyAndIvData.concat(keyMaterial);
    }
    
    // Crear los objetos WordArray para la clave y el IV
    // Nota: en lugar de slice, usamos cloneWords y reset
    const keyAndIvWords = keyAndIvData.words;
    
    // Para la clave: primeros keySize bytes
    const keyWords = keyAndIvWords.slice(0, keySize / 4);
    const key = CryptoJS.lib.WordArray.create(keyWords);
    
    // Para el IV: siguientes ivSize bytes
    const ivWords = keyAndIvWords.slice(keySize / 4, (keySize + ivSize) / 4);
    const iv = CryptoJS.lib.WordArray.create(ivWords);
    
    return { key, iv };
}

// Función para leer como ArrayBuffer (añadir a crypto-utils.js)
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}


// Guardar resultado de encriptación/desencriptación simétrica
function saveSymResult() {
    const resultText = document.getElementById('symResult').textContent;
    let fileName = document.getElementById('symSaveFileName').value || 'archivo_desencriptado.txt';
    
    if (!resultText) {
        showStatus('symStatus', 'No hay resultado para guardar', true);
        return;
    }
    
    try {
        let blob;
        // Verificar si el contenido es Base64 (como parece ser tu caso)
        const isBase64 = /^[A-Za-z0-9+/=]+$/.test(resultText.trim());
        
        if (isBase64) {
            // Convertir de Base64 a binario
            const byteCharacters = atob(resultText);
            const byteArrays = [];
            
            // Procesar en bloques para evitar problemas con archivos grandes
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            
            // Crear Blob con el contenido binario
            blob = new Blob(byteArrays);
        } else {
            // Si no es Base64, guardar como texto plano
            blob = new Blob([resultText], { type: 'text/plain' });
        }
        
        // Crear enlace de descarga
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        
        // Añadir a la página, hacer clic y luego limpiar
        document.body.appendChild(a);
        a.click();
        
        // Limpiar después de un momento
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showStatus('symStatus', `Archivo guardado como ${fileName}`);
    } catch (e) {
        console.error("Error guardando archivo:", e);
        showStatus('symStatus', 'Error al guardar: ' + e.message, true);
    }
}