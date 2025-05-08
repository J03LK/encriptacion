// Leer archivo
async function readFile() {
    try {
        const fileInput = document.getElementById('fileToRead');
        const fileTypeSelect = document.getElementById('fileType');
        
        if (fileInput.files.length === 0) {
            throw new Error('No se ha seleccionado ningún archivo');
        }
        
        const file = fileInput.files[0];
        const fileType = fileTypeSelect.value;
        
        const content = await readFileAsType(file, fileType);
        
        // Mostrar contenido
        const fileContentElement = document.getElementById('fileContent');
        
        if (fileType === 'binary' || fileType === 'hex') {
            fileContentElement.innerHTML = `<pre>${content}</pre>`;
        } else {
            fileContentElement.textContent = content;
        }
        
        // Realizar análisis del archivo
        analyzeFile(file, content, fileType);
        
    } catch (error) {
        document.getElementById('fileContent').textContent = 'Error: ' + error.message;
        console.error(error);
    }
}

// Analizar archivo
function analyzeFile(file, content, fileType) {
    const fileAnalysisElement = document.getElementById('fileAnalysis');
    
    const analysis = {
        'Nombre del archivo': file.name,
        'Tipo MIME': file.type || 'No disponible',
        'Tamaño': formatFileSize(file.size),
        'Última modificación': new Date(file.lastModified).toLocaleString(),
        'Tipo de visualización': fileType.toUpperCase()
    };
    
    // Detectar el tipo de archivo según su contenido
    const detectedType = detectFileType(content, file.name);
    analysis['Tipo detectado'] = detectedType;
    
    if (fileType === 'text') {
        analysis['Longitud del texto'] = content.length + ' caracteres';
        analysis['Líneas'] = content.split('\n').length;
        
        // Detectar si es un archivo de clave PGP
        if (content.includes('-----BEGIN PGP')) {
            if (content.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
                analysis['Subtipo'] = 'Clave pública PGP';
            } else if (content.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----')) {
                analysis['Subtipo'] = 'Clave privada PGP';
            } else if (content.includes('-----BEGIN PGP MESSAGE-----')) {
                analysis['Subtipo'] = 'Mensaje PGP encriptado';
            }
        }
        
        // Detectar si es un archivo JSON
        try {
            const jsonData = JSON.parse(content);
            analysis['Formato'] = 'JSON válido';
            
            // Detectar si es un archivo encriptado en formato JSON
            if (jsonData.encryptedData || jsonData.ciphertext) {
                analysis['Contenido'] = 'Datos encriptados';
                if (jsonData.algorithm) {
                    analysis['Algoritmo'] = jsonData.algorithm.toUpperCase();
                }
            }
        } catch (e) {
            // No es JSON o no es válido
        }
    } else if (fileType === 'hex') {
        analysis['Longitud'] = content.length / 2 + ' bytes';
        
        // Detectar posibles cabeceras de archivo
        const headerHex = content.substring(0, 16).toUpperCase();
        if (headerHex.startsWith('504B0304')) {
            analysis['Tipo detectado'] = 'Archivo ZIP';
        } else if (headerHex.startsWith('89504E47')) {
            analysis['Tipo detectado'] = 'Imagen PNG';
        } else if (headerHex.startsWith('FFD8FF')) {
            analysis['Tipo detectado'] = 'Imagen JPEG';
        } else if (headerHex.startsWith('25504446')) {
            analysis['Tipo detectado'] = 'Documento PDF';
        }
    }
    
    // Determinar si el archivo podría estar encriptado
    if (fileType === 'binary' || fileType === 'hex') {
        // Para archivos binarios/hex, verificar la entropía
        const entropy = calculateEntropy(content);
        analysis['Entropía'] = entropy.toFixed(2) + ' bits';
        
        if (entropy > 7.5) {
            analysis['Posiblemente encriptado'] = 'Sí (alta entropía)';
        }
    } else if (fileType === 'text') {
        // Para archivos de texto, buscar patrones de texto encriptado
        if (content.length > 20 && /^[A-Za-z0-9+/=]+$/.test(content)) {
            analysis['Posiblemente encriptado'] = 'Sí (parece estar en Base64)';
        }
    }
    
    // Generar HTML para el análisis
    let analysisHTML = '';
    for (const [key, value] of Object.entries(analysis)) {
        analysisHTML += `<strong>${key}:</strong> ${value}<br>`;
    }
    
    fileAnalysisElement.innerHTML = analysisHTML;
}

// Calcular la entropía para determinar si un archivo podría estar encriptado
function calculateEntropy(data) {
    // Para texto, calcular directamente
    if (typeof data === 'string') {
        const freq = {};
        let entropy = 0;
        
        // Contabilizar frecuencias
        for (let i = 0; i < data.length; i++) {
            const char = data[i];
            freq[char] = (freq[char] || 0) + 1;
        }
        
        // Calcular entropía
        for (const char in freq) {
            const p = freq[char] / data.length;
            entropy -= p * Math.log2(p);
        }
        
        return entropy;
    }
    
    // Para datos binarios/hex, calcular basado en bytes
    // Simplificación: dividir en bloques y contar frecuencias
    const blockSize = 1; // 1 byte
    const blocks = [];
    
    for (let i = 0; i < data.length; i += blockSize * 2) {
        const block = data.substring(i, i + blockSize * 2);
        if (block.length === blockSize * 2) {
            blocks.push(block);
        }
    }
    
    const freq = {};
    let entropy = 0;
    
    // Contabilizar frecuencias
    for (const block of blocks) {
        freq[block] = (freq[block] || 0) + 1;
    }
    
    // Calcular entropía
    for (const block in freq) {
        const p = freq[block] / blocks.length;
        entropy -= p * Math.log2(p);
    }
    
    return entropy;
}