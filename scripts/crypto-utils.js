// Función para leer archivos según el tipo seleccionado
function readFileAsType(file, type) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            let result = event.target.result;
            if (type === 'hex') {
                const bytes = new Uint8Array(result);
                let hexString = '';
                for (let i = 0; i < bytes.length; i++) {
                    hexString += bytes[i].toString(16).padStart(2, '0');
                }
                result = hexString;
            }
            resolve(result);
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo'));
        };
        
        switch (type) {
            case 'text':
                reader.readAsText(file);
                break;
            case 'binary':
            case 'hex':
                reader.readAsArrayBuffer(file);
                break;
            default:
                reader.readAsText(file);
        }
    });
}

// Función para guardar un archivo
function saveFile(content, fileName, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Función para formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para detectar tipo de archivo basado en contenido
function detectFileType(content, fileName) {
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // Detectar tipo basado en la extensión
    const extensionTypes = {
        'txt': 'texto',
        'csv': 'CSV',
        'json': 'JSON',
        'xml': 'XML',
        'html': 'HTML',
        'js': 'JavaScript',
        'css': 'CSS',
        'py': 'Python',
        'sh': 'Shell Script',
        'pdf': 'PDF',
        'jpg': 'JPEG',
        'jpeg': 'JPEG',
        'png': 'PNG',
        'gif': 'GIF',
        'svg': 'SVG',
        'mp3': 'MP3',
        'mp4': 'MP4',
        'zip': 'ZIP',
        'rar': 'RAR',
        'tar': 'TAR',
        'gz': 'GZIP',
        'asc': 'PGP ASCII Armored',
        'gpg': 'GPG Encrypted',
        'key': 'Clave Criptográfica',
        'pem': 'Certificado PEM',
        'enc': 'Archivo Encriptado'
    };
    
    let fileType = extensionTypes[fileExtension] || 'Desconocido';
    
    // Detección adicional basada en contenido
    if (typeof content === 'string') {
        if (content.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
            fileType = 'Clave Pública PGP';
        } else if (content.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----')) {
            fileType = 'Clave Privada PGP';
        } else if (content.includes('-----BEGIN PGP MESSAGE-----')) {
            fileType = 'Mensaje PGP Encriptado';
        } else if (content.includes('-----BEGIN CERTIFICATE-----')) {
            fileType = 'Certificado X.509';
        } else if (content.includes('-----BEGIN RSA PRIVATE KEY-----')) {
            fileType = 'Clave Privada RSA';
        } else if (content.includes('-----BEGIN PUBLIC KEY-----')) {
            fileType = 'Clave Pública';
        } else if (content.includes('-----BEGIN PRIVATE KEY-----')) {
            fileType = 'Clave Privada';
        } else if (content.startsWith('{') && content.endsWith('}')) {
            try {
                JSON.parse(content);
                fileType = 'JSON';
            } catch (e) {
                // No es un JSON válido
            }
        } else if (content.startsWith('<?xml')) {
            fileType = 'XML';
        } else if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
            fileType = 'HTML';
        } else if (content.includes('#!/bin/bash') || content.includes('#!/bin/sh')) {
            fileType = 'Shell Script';
        } else if (content.includes('#!/usr/bin/env python') || content.includes('def ') && content.includes(':')) {
            fileType = 'Python';
        }
    }
    
    return fileType;
}

// Función para generar una clave aleatoria
function generateRandomKey(length = 16) {
    return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);
}