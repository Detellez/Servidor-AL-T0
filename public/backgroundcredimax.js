// background.js - MODO TURBO + Alertas Nativas Windows
'use strict';

const colaPeticiones = [];
let procesandoCola = false;

// Memoria para recordar de qué pestaña exacta vino cada alerta
const notificationTabs = {};

// Escuchador principal de mensajes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // -----------------------------------------------------------------
    // 1. GATILLO DE AUDIO Y PESTAÑAS (ANTI-MUTED)
    // -----------------------------------------------------------------
    if (request.action === "unmute_tab") {
        if (sender.tab && sender.tab.id) {
            chrome.tabs.update(sender.tab.id, { muted: false }, () => {
                sendResponse({ success: true, message: "Pestaña desilenciada exitosamente" });
            });
        } else {
            sendResponse({ success: false, message: "No se pudo identificar la pestaña" });
        }
        return true; 
    }

    // -----------------------------------------------------------------
    // 2. ALERTAS DE WINDOWS NATIVAS EN SEGUNDO PLANO
    // -----------------------------------------------------------------
    if (request.action === 'notificar') {
        const notifId = 'crm_aviso_' + Date.now();

        // Guardamos el ID de la pestaña y ventana que disparó la alerta
        if (sender.tab && sender.tab.id) {
            notificationTabs[notifId] = {
                tabId: sender.tab.id,
                windowId: sender.tab.windowId
            };
        }

        chrome.notifications.create(notifId, {
            type: 'basic',
            iconUrl: 'icon128.png', // ⚠️ Asegúrate de que esta imagen exista en la carpeta de la extensión
            title: request.titulo || '📢 AVISO CRM',
            message: request.mensaje || 'Tienes una nueva notificación.',
            priority: 2, // Fuerza a Windows a darle máxima importancia
            requireInteraction: true // Evita que se cierre sola tras 5 segundos
        }, (createdId) => {
            if (chrome.runtime.lastError) {
                console.error("Error al crear notificación nativa:", chrome.runtime.lastError);
            }
        });

        sendResponse({ success: true });
        return true;
    }

    // -----------------------------------------------------------------
    // 3. MODO TURBO FETCH (Proxy API)
    // -----------------------------------------------------------------
    if (request.action === "proxy_fetch") {
        colaPeticiones.push({ req: request, res: sendResponse });
        
        if (!procesandoCola) {
            procesarSiguienteEnCola();
        }
        return true; 
    }
});

// Procesador de la cola (Sin delays artificiales)
async function procesarSiguienteEnCola() {
    if (colaPeticiones.length === 0) {
        procesandoCola = false;
        return;
    }

    procesandoCola = true;
    const item = colaPeticiones.shift();
    const { req, res } = item;

    try {
        const response = await fetch(req.url, req.options);
        const text = await response.text(); // 🔥 Leemos la respuesta como texto primero
        let data;
        
        try {
            data = JSON.parse(text); // Intentamos convertirlo a JSON si es posible
        } catch(e) {
            data = text; // Si el servidor solo responde "OK" o texto simple, lo respetamos
        }
        
        if (res) res({ success: true, data: data });

    } catch (error) {
        console.error("❌ Error Background Fetch:", error);
        if (res) res({ success: false, error: error.toString() });
    }

    procesarSiguienteEnCola(); 
}

// -----------------------------------------------------------------
// 4. EVENTO: CLIC EN LA NOTIFICACIÓN DE WINDOWS
// -----------------------------------------------------------------
chrome.notifications.onClicked.addListener((notificationId) => {
    // 1. Cerramos la notificación de la pantalla
    chrome.notifications.clear(notificationId);

    // 2. Buscamos de qué pestaña vino esta alerta
    const tabInfo = notificationTabs[notificationId];

    if (tabInfo) {
        // Traemos la ventana de Chrome al frente (por si estaba minimizada)
        chrome.windows.update(tabInfo.windowId, { focused: true }, () => {
            // Saltamos directamente a la pestaña del CRM
            chrome.tabs.update(tabInfo.tabId, { active: true });
        });
        
        // Limpiamos la memoria para no consumir RAM
        delete notificationTabs[notificationId];
    } else {
        // Respaldo: Si la pestaña original se perdió, buscamos cualquier pestaña con la IP del CRM
        chrome.tabs.query({ url: "*://*/*" }, function(tabs) {
            for (let tab of tabs) {
                if (tab.url.includes("182.160.25.147") || tab.url.includes("crm")) {
                    chrome.windows.update(tab.windowId, { focused: true });
                    chrome.tabs.update(tab.id, { active: true });
                    break;
                }
            }
        });
    }
});