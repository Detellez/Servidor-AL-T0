(function() {
    // =========================================================================
    // BLOQUE 1: Protección y Anti-Depuración
    // =========================================================================
    const antiDebug = (function() {
        let firstCall = true;
        return function(context, fn) {
            const func = firstCall ? function() {
                if (fn) {
                    const result = fn.apply(context, arguments);
                    fn = null;
                    return result;
                }
            } : function() {};
            firstCall = false;
            return func;
        };
    }());

    const initConsole = antiDebug(this, function() {
        const getGlobal = function() {
            let globalObj;
            try { globalObj = Function('return (function() {}.constructor("return this")())')(); } 
            catch (error) { globalObj = window; }
            return globalObj;
        };
        const global = getGlobal();
        const consoleObj = global.console = global.console || {};
        
        const methods = ['log', 'warn', 'info', 'error', 'exception', 'table', 'trace'];
        for (let i = 0; i < methods.length; i++) {
            const bindFunc = antiDebug.constructor.prototype.bind(antiDebug);
            const methodName = methods[i];
            const originalMethod = consoleObj[methodName] || bindFunc;
            
            bindFunc.__proto__ = antiDebug.bind(antiDebug);
            bindFunc.toString = originalMethod.toString.bind(originalMethod);
            consoleObj[methodName] = bindFunc;
        }
    });
    
    initConsole(); 

    // =========================================================================
    // BLOQUE 2: Variables de Configuración y Constantes
    // =========================================================================
    'use strict';

    const CODIGO_PAIS = '56'; // Código telefónico (56 = Chile)
    const RUTA_OBJETIVO = '/collection/#/pages/case/detail?';
    
    const ICONO_SVG_TELEGRAM = `
<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
  <circle cx="120" cy="120" r="120" fill="#229ED9"/>
  <path d="m54 120 132-55q19-7 13 19l-23 109q-2 11-13 6l-37-26-20 20q-7 7-13 1-l-10-33-30-10q-11-4-1 16" fill="#FFF"/>
</svg>`;

    const ICONO_SVG_FACEBOOK = `
<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
  <circle cx="120" cy="120" r="120" fill="#1877F2"/>
  <path d="M141.5 240V146.5h31.4l4.7-36.4h-36.1v-23.2c0-10.5 2.9-17.7 18-17.7h19.2V36.6c-3.3-.4-14.7-1.4-28-1.4-27.7 0-46.7 16.9-46.7 48v26.8H72.8v36.4h31.2V240h37.5z" fill="#FFF"/>
</svg>`;

    const CLASE_INYECTADA_TG = 'telegram-injected';
    const CLASE_INYECTADA_FB = 'facebook-injected'; 

    console.log('Extensión Cobranza: Script Redes Sociales cargado.');

    // =========================================================================
    // BLOQUE 3: Funciones de Extracción Inteligente
    // =========================================================================

    function obtenerPlanIdDeUrl() {
        try {
            const hash = window.location.hash;
            if (!hash || !hash.includes('?')) return null;
            const urlParams = new URLSearchParams(hash.split('?')[1]);
            return urlParams.get('planId');
        } catch(e) { return null; }
    }

    function obtenerNombreCliente(elementoReferencia) {
        const planId = obtenerPlanIdDeUrl();
        
        if (planId) {
            try {
                const loteString = localStorage.getItem('LOTE_RAFAGA');
                if (loteString) {
                    const loteObj = JSON.parse(loteString);
                    const arrayClientes = Array.isArray(loteObj) ? loteObj : Object.values(loteObj);
                    const clienteEncontrado = arrayClientes.find(c => c.ID_Factura && c.ID_Factura.toString() === planId.toString());
                    
                    if (clienteEncontrado && clienteEncontrado.Nombre_Completo) {
                        return clienteEncontrado.Nombre_Completo.trim();
                    }
                }
            } catch (e) {}
        }

        try {
            const textoCompleto = document.body.innerText;
            const lineas = textoCompleto.split('\n').map(linea => linea.trim()).filter(linea => linea.length > 0);
            for (let i = 0; i < lineas.length; i++) {
                if (lineas[i].includes('(Cliente)')) return lineas[i].replace('(Cliente)', '').trim();
            }
        } catch(e){}
        
        return null;
    }

    function extraerTelefono(elemento) {
        try {
            const contenedorLista = elemento.closest('.list-item');
            if (!contenedorLista) return null;
            
            const elementoTelefono = contenedorLista.querySelector('.left .phone-info .phone');
            if (elementoTelefono) return elementoTelefono.innerText.trim().replace(/\D/g, ''); 
            return null;
        } catch (error) { return null; }
    }

    // =========================================================================
    // BLOQUE 4: Creación de Íconos e Inyección
    // =========================================================================

    function crearIcono(svgBase64, clase) {
        const div = document.createElement('div');
        div.className = clase;
        div.style.width = '30px';
        div.style.height = '30px';
        
        // 🔥 ESPACIADO PERFECTO: 18px para imitar el espacio del lápiz
        div.style.marginRight = '18px'; 
        
        div.style.cursor = 'pointer';
        div.style.display = 'inline-block';
        div.style.backgroundImage = 'url("data:image/svg+xml;base64,' + btoa(svgBase64) + '")';
        div.style.backgroundSize = 'cover';
        div.style.borderRadius = '50%';
        div.style.transition = 'transform 0.2s';
        div.onmouseenter = () => div.style.transform = 'scale(1.1)';
        div.onmouseleave = () => div.style.transform = 'scale(1)';
        return div;
    }

    function limpiarIconosInyectados() {
        document.querySelectorAll('.' + CLASE_INYECTADA_TG).forEach(i => i.remove());
        document.querySelectorAll('.' + CLASE_INYECTADA_FB).forEach(i => i.remove());
    }

    function inyectarBotonesRedesSociales() {
        const urlActual = window.location.href;
        
        if (!urlActual.includes(RUTA_OBJETIVO)) {
            limpiarIconosInyectados();
            return;
        }

        const iconosWhatsapp = document.querySelectorAll('.whatsapp-icon');
        
        iconosWhatsapp.forEach((iconoWa, index) => {
            const contenedorPadre = iconoWa.parentNode;
            if (!contenedorPadre) return;

            const prev1 = iconoWa.previousElementSibling;
            const prev2 = prev1 ? prev1.previousElementSibling : null;
            const yaTieneTelegram = (prev1 && prev1.classList.contains(CLASE_INYECTADA_TG)) || (prev2 && prev2.classList.contains(CLASE_INYECTADA_TG));
            
            if (yaTieneTelegram) return; 

            // 1. CREAR BOTÓN TELEGRAM (Para todos)
            const botonTelegram = crearIcono(ICONO_SVG_TELEGRAM, CLASE_INYECTADA_TG);
            botonTelegram.onclick = function(evento) {
                evento.preventDefault();
                evento.stopPropagation();
                const numeroTelefono = extraerTelefono(iconoWa);
                if (numeroTelefono) {
                    window.location.href = 'tg://resolve?phone=' + CODIGO_PAIS + numeroTelefono;
                } else {
                    alert('No se encontró número de teléfono.');
                }
            };

            // 2. CREAR BOTÓN FACEBOOK (SOLO PARA LA PRIMERA COLUMNA / TITULAR)
            if (index === 0) {
                const botonFacebook = crearIcono(ICONO_SVG_FACEBOOK, CLASE_INYECTADA_FB);
                botonFacebook.onclick = function(evento) {
                    evento.preventDefault();
                    evento.stopPropagation();
                    
                    // 🛑 DEPENDENCIA DE DATOS: Verificar LOTE_RAFAGA
                    const lote = localStorage.getItem('LOTE_RAFAGA');
                    if (!lote || lote === '[]') {
                        alert('⚠️ Faltan Datos: Por favor, abre el Panel Ráfaga (Ctrl+Shift+Z) y extrae los clientes primero.');
                        return;
                    }

                    const nombreCompleto = obtenerNombreCliente(iconoWa);
                    if (nombreCompleto) {
                        const nombreBuscable = nombreCompleto.replace(/\s+/g, '+');
                        const urlFB = `https://www.facebook.com/search/people/?q=${nombreBuscable}`;
                        window.open(urlFB, '_blank');
                    } else {
                        alert('No se pudo encontrar el nombre del cliente en los datos extraídos.');
                    }
                };
                contenedorPadre.insertBefore(botonFacebook, iconoWa);
            }

            // Inyectar Telegram siempre
            contenedorPadre.insertBefore(botonTelegram, iconoWa);
        });
    }

    // =========================================================================
    // BLOQUE 5: Persistencia y Ejecución
    // =========================================================================

    const observadorDeMutaciones = new MutationObserver(() => {
        inyectarBotonesRedesSociales();
    });
    
    observadorDeMutaciones.observe(document.body, { 
        childList: true, 
        subtree: true 
    });

    setInterval(() => {
        inyectarBotonesRedesSociales();
    }, 500); 

}());