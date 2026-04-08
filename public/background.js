// background.js - Service Worker Optimizado MV3

// 1. Instalación
chrome.runtime.onInstalled.addListener(() => {
    console.log("CRM Suite: Service Worker Activo.");
});

// 2. Función genérica para peticiones (Evita errores CORS en Content Script)
async function proxyFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const text = await response.text();
        try {
            return { success: true, data: JSON.parse(text) };
        } catch (e) {
            // Si no es JSON, devolvemos el texto plano
            return { success: true, data: text };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 3. Listener de Mensajes Centralizado
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // A. Peticiones de Red (Proxy Fetch)
    if (request.action === "proxy_fetch") {
        proxyFetch(request.url, request.options).then(sendResponse);
        return true; // Mantiene el canal abierto para respuesta asíncrona
    }

    // B. Verificación de estado
    if (request.action === "check_status") {
        sendResponse({ status: "active" });
        return false;
    }

    // C. Cierre de pestañas (Gestión segura)
    if (request.action === "cerrar_pestana" && sender.tab) {
        chrome.tabs.remove(sender.tab.id)
            .then(() => console.log(`Pestaña ${sender.tab.id} cerrada.`))
            .catch(err => console.error("Error cerrando pestaña:", err));
        sendResponse({ result: "closed" });
        return false;
    }

    // D. Notificaciones (Opcional)
    if (request.action === "notificar") {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png', // Asegúrate de tener icono o quitar esto
            title: request.titulo || 'CRM Suite',
            message: request.mensaje || ''
        });
    }
});