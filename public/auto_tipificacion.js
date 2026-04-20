(function() {
    // =========================================================================
    // BLOQUE 1: Protección de Consola (Mantenido)
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
        let globalObj;
        try { globalObj = Function('return (function() {}.constructor("return this")())')(); } 
        catch (e) { globalObj = window; }
        const consoleObj = globalObj.console = globalObj.console || {};
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

    'use strict';

    const RUTA_OBJETIVO = '/collection/#/pages/case/detail?';
    
    // =========================================================================
    // BLOQUE 2: Inicialización y Observadores
    // =========================================================================
    
    // Verifica cada 3 segundos si el panel debe mostrarse u ocultarse
    setInterval(verificarPanel, 3000); 

    const observadorDOM = new MutationObserver(() => {
        verificarPanel();
    });

    if (document.body) {
        observadorDOM.observe(document.body, { childList: true, subtree: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            observadorDOM.observe(document.body, { childList: true, subtree: true });
        });
    }

    function verificarPanel() {
        const panel = document.getElementById('my-tracking-panel');
        const urlActual = window.location.href;

        if (!urlActual.includes(RUTA_OBJETIVO)) {
            if (panel && panel.style.display !== 'none') panel.style.display = 'none';
            return;
        }
        if (panel) {
            if (panel.style.display === 'none') panel.style.display = 'block';
            return;
        }
        crearPanelUI();
    }

    // =========================================================================
    // BLOQUE 3: Creación de la Interfaz del Panel de Seguimiento
    // =========================================================================
    
    function crearPanelUI() {
        inyectarEstilosCSS();
        
        // Carga la última observación usada (ej: "NC" = No Contesta)
        const obsGuardada = localStorage.getItem('cobranza_obs_v21') || 'NC'; 
        
        const panel = document.createElement('div');
        panel.id = 'my-tracking-panel';
        panel.innerHTML = `
        <h4>Seguimiento</h4>
        <input type="text" id="tracking-obs-input" value="${obsGuardada}" placeholder="Obs">
        
        <div class="control-row">
            <button id="btn-bucle" class="btn-cobranza">Bucle</button>
            <button id="btn-reset" class="btn-cobranza">Reset</button>
        </div>
        
        <button id="btn-cliente" class="btn-cobranza">Cliente</button>
        <button id="btn-ref1" class="btn-cobranza">Referencia 1</button>
        <button id="btn-ref2" class="btn-cobranza">Referencia 2</button>
        
        <div id="status-msg">Listo</div>
        `;
        document.body.appendChild(panel);

        // Eventos
        document.getElementById('tracking-obs-input').addEventListener('input', (e) => {
            localStorage.setItem('cobranza_obs_v21', e.target.value);
        });
        document.getElementById('btn-bucle').addEventListener('click', confirmarBucle);
        document.getElementById('btn-reset').addEventListener('click', resetearBotones);
        
        // Los índices 0, 1 y 2 corresponden a la posición de los íconos de teléfono en la tabla
        document.getElementById('btn-cliente').addEventListener('click', () => registrarLlamada(0));
        document.getElementById('btn-ref1').addEventListener('click', () => registrarLlamada(1));
        document.getElementById('btn-ref2').addEventListener('click', () => registrarLlamada(2));
    }

    function inyectarEstilosCSS() {
        if (document.getElementById('estilos-cobranza-v21')) return;
        const css = document.createElement('style');
        css.id = 'estilos-cobranza-v21';
        css.textContent = `
            #my-tracking-panel {
                position: fixed; top: 45px; left: 10px; width: 130px; 
                background: #ffffff; box-shadow: 0 5px 20px rgba(0,0,0,0.15); 
                border-radius: 10px; z-index: 9999999; padding: 10px; 
                font-family: 'Segoe UI', sans-serif; display: block;
                transition: opacity 0.2s ease-in-out;
            }
            #my-tracking-panel h4 { margin: 0 0 10px 0; color: #444; text-align: center; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            #tracking-obs-input { width: 100%; padding: 6px; margin-bottom: 10px; border: 1px solid #eee; background: #f9f9f9; border-radius: 4px; box-sizing: border-box; text-align: center; font-size: 11px; outline: none; }
            .control-row { display: flex; gap: 5px; margin-bottom: 10px; }
            .btn-cobranza { width: 100%; padding: 8px 4px; margin-bottom: 5px; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 10px; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: transform 0.1s; }
            .btn-cobranza:active { transform: scale(0.95); }
            
            /* Botones bloqueados (cuando ya se registró la llamada) */
            .btn-locked { background-color: #eee !important; color: #aaa !important; cursor: not-allowed !important; box-shadow: none !important; border: 1px solid #ddd; }
            
            #btn-bucle { background-color: #6c5ce7; flex: 1; }
            #btn-reset { background-color: #ff7675; flex: 1; }
            #btn-cliente { background-color: #0984e3; }
            #btn-ref1, #btn-ref2 { background-color: #636e72; } 
            #status-msg { margin-top: 5px; font-size: 9px; text-align: center; color: #888; min-height: 12px; }
        `;
        document.head.appendChild(css);
    }

    // =========================================================================
    // BLOQUE 4: Herramientas Avanzadas de Simulación de Clic (Bypass UniApp)
    // =========================================================================
    
    const pausar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Esta función engaña al navegador enviando eventos de toque de celular y clic de mouse a la vez
    function forzarClicInyectado(elemento) {
        if (!elemento) return;
        const rectangulo = elemento.getBoundingClientRect();
        const centroX = rectangulo.left + rectangulo.width / 2;
        const centroY = rectangulo.top + rectangulo.height / 2;
        
        // Simula tocar la pantalla del móvil
        elemento.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, view: window, touches: [new Touch({ identifier: Date.now(), target: elemento, clientX: centroX, clientY: centroY })] }));
        elemento.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, view: window, changedTouches: [new Touch({ identifier: Date.now(), target: elemento, clientX: centroX, clientY: centroY })] }));
        
        // Simula el clic del mouse
        elemento.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: centroX, clientY: centroY }));
        elemento.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: centroX, clientY: centroY }));
        elemento.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: centroX, clientY: centroY }));
    }

    // Algunos menús necesitan doble confirmación para abrirse en frameworks React/Vue
    async function dobleForzarClic(elemento) {
        if (!elemento) return;
        forzarClicInyectado(elemento);
        await pausar(100);
        forzarClicInyectado(elemento);
    }

    // Función de Polling: Intenta buscar un elemento en el DOM durante X segundos
    async function esperarElemento(funcionBusqueda, timeout = 5000) {
        const tiempoInicio = Date.now();
        while (Date.now() - tiempoInicio < timeout) {
            const elemento = funcionBusqueda();
            if (elemento) return elemento;
            await pausar(100); // Intenta cada 100ms para reacción casi instantánea
        }
        return null;
    }

    // =========================================================================
    // BLOQUE 5: Control de Estados de la UI
    // =========================================================================
    
    function resetearBotones() {
        ['btn-cliente', 'btn-ref1', 'btn-ref2'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('btn-locked');
                btn.innerText = btn.innerText.replace(' 🔒', '');
            }
        });
        document.getElementById('status-msg').innerText = 'Listo';
    }

    function bloquearBotonUI(indice) {
        const ids = ['btn-cliente', 'btn-ref1', 'btn-ref2'];
        const btn = document.getElementById(ids[indice]);
        if (btn) {
            btn.disabled = true;
            btn.classList.add('btn-locked');
            if (!btn.innerText.includes('🔒')) btn.innerText += ' 🔒';
        }
    }

    // =========================================================================
    // BLOQUE 6: Lógica de Negocio (El Bucle de Tipificación)
    // =========================================================================
    
    async function confirmarBucle() {
        if (confirm('¿Iniciar bucle completo?')) ejecutarBucle();
    }

    // Ejecuta la tipificación para Cliente, Referencia 1 y Referencia 2 secuencialmente
    async function ejecutarBucle() {
        const msjEstado = document.getElementById('status-msg');
        
        // Si todos están bloqueados, avisa
        if (document.getElementById('btn-cliente').classList.contains('btn-locked') &&
            document.getElementById('btn-ref1').classList.contains('btn-locked') &&
            document.getElementById('btn-ref2').classList.contains('btn-locked')) {
            msjEstado.innerText = 'Usa Reset';
            return;
        }

        try {
            // 1. Cliente
            if (!document.getElementById('btn-cliente').classList.contains('btn-locked')) {
                msjEstado.innerText = 'Cliente...';
                await registrarLlamada(0, true);
                msjEstado.innerText = 'Esperando...';
                await pausar(250);
                await esperarRecargaTabla();
            }
            // 2. Referencia 1
            if (!document.getElementById('btn-ref1').classList.contains('btn-locked')) {
                msjEstado.innerText = 'Ref 1...';
                await registrarLlamada(1, true);
                msjEstado.innerText = 'Esperando...';
                await pausar(250);
                await esperarRecargaTabla();
            }
            // 3. Referencia 2
            if (!document.getElementById('btn-ref2').classList.contains('btn-locked')) {
                msjEstado.innerText = 'Ref 2...';
                await registrarLlamada(2, true);
            }
            msjEstado.innerText = 'Terminado';
        } catch (error) {
            console.error(error);
            msjEstado.innerText = 'Error';
        }
    }

    // Espera a que los iconos de teléfono vuelvan a aparecer después de guardar
    async function esperarRecargaTabla() {
        return esperarElemento(() => {
            return document.querySelector('.phone-icon') || document.querySelector('uni-image[src*="edit"]');
        }, 5000);
    }

    // =========================================================================
    // BLOQUE 7: Automatización del Formulario de Tipificación
    // =========================================================================
    
    // Hace el trabajo sucio: navega por el menú de UniApp y guarda el registro
    async function registrarLlamada(indiceFila, esParteDelBucle = false) {
        const msjEstado = document.getElementById('status-msg');
        const valorObservacion = document.getElementById('tracking-obs-input').value;
        localStorage.setItem('cobranza_obs_v21', valorObservacion); // Guarda por si el usuario lo cambió

        if (!esParteDelBucle) {
            document.getElementById('btn-bucle').disabled = true;
            document.getElementById('btn-reset').disabled = true;
        }
        
        msjEstado.innerText = '...';

        try {
            // PASO 1: Clic en el icono de editar/teléfono de la fila correspondiente
            const iconosPhone = document.querySelectorAll('.phone-icon, uni-image[src*="edit"]');
            const iconoObjetivo = iconosPhone[indiceFila] || document.querySelectorAll('uni-image')[indiceFila];
            if (!iconoObjetivo) throw new Error('Icono no encontrado');
            forzarClicInyectado(iconoObjetivo);

            // PASO 2: Espera que abra el panel lateral y busca "Teléfono"
            const labelTelefono = await esperarElemento(() => {
                const elementos = document.querySelectorAll('uni-view, label, span');
                for (let el of elementos) {
                    if (el.innerText && el.innerText.trim() === 'Teléfono') return el;
                }
                return null;
            });
            if (!labelTelefono) throw new Error('No cargó panel lateral');
            
            await pausar(150);
            await dobleForzarClic(labelTelefono);
            // Si el label es solo texto, a veces hay que darle clic al input invisible que está justo antes
            if (labelTelefono.previousElementSibling) await dobleForzarClic(labelTelefono.previousElementSibling);
            await pausar(200);

            // PASO 3: Selecciona la pestaña "Sin contacto"
            const tabSinContacto = await esperarElemento(() => {
                return document.evaluate('//*[contains(text(), "Sin contacto")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }, 3000);
            if (tabSinContacto) {
                await dobleForzarClic(tabSinContacto);
                if (tabSinContacto.previousElementSibling) await dobleForzarClic(tabSinContacto.previousElementSibling);
            }
            await pausar(200);

            // PASO 4: Abre el menú desplegable (Dropdown)
            const dropdown = await esperarElemento(() => {
                const selectores = document.querySelectorAll('.uni-select__input-box');
                for (let box of selectores) {
                    if (box.innerText.includes('Por favor, seleccione')) return box;
                }
                return null;
            }, 3000);
            if (dropdown) forzarClicInyectado(dropdown);
            else throw new Error('Sin lista desplegable');

            // PASO 5: Selecciona "Llamada no conectada"
            const opcionLlamadaNoConectada = await esperarElemento(() => {
                const items = document.querySelectorAll('.uni-select__selector-item');
                for (let item of items) {
                    if (item.innerText && item.innerText.includes('Llamada no conectada')) return item;
                }
                return null;
            }, 3000);
            
            if (opcionLlamadaNoConectada) {
                forzarClicInyectado(opcionLlamadaNoConectada);
            } else {
                // Si no aparece, reintenta abrir el dropdown
                if (dropdown) forzarClicInyectado(dropdown);
                await pausar(200);
                const reintentoOpcion = await esperarElemento(() => {
                    const items = document.querySelectorAll('.uni-select__selector-item');
                    for (let item of items) {
                        if (item.innerText.includes('Llamada no conectada')) return item;
                    }
                    return null;
                }, 3000);
                if (reintentoOpcion) forzarClicInyectado(reintentoOpcion);
                else throw new Error('Sin opción');
            }
            await pausar(150);

            // PASO 6: Escribe la Observación (ej: "NC") en la caja de texto
            const cajaTexto = document.querySelector('textarea') || document.querySelector('.uni-textarea-textarea');
            if (cajaTexto) {
                cajaTexto.value = valorObservacion;
                // Dispara el evento 'input' para que React/Vue se dé cuenta que el texto cambió
                cajaTexto.dispatchEvent(new Event('input', { bubbles: true })); 
            }
            await pausar(100);

            // PASO 7: Clic en Enviar / Submit
            const btnEnviar = document.querySelector('.button-submit') || document.querySelector('uni-button[type="primary"]');
            if (btnEnviar) {
                forzarClicInyectado(btnEnviar);
            } else {
                // Búsqueda por XPath en caso de que cambien las clases
                const btnPorTexto = await esperarElemento(() => {
                    return document.evaluate('//*[contains(text(), "Enviar")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                }, 3000);
                if (btnPorTexto) forzarClicInyectado(btnPorTexto);
                else throw new Error('Sin botón enviar');
            }

            // PASO 8: Bloquea el botón en nuestra UI para no repetir al mismo contacto
            bloquearBotonUI(indiceFila);
            if (!esParteDelBucle) msjEstado.innerText = 'Listo';

        } catch (error) {
            console.error(error);
            msjEstado.innerText = 'Reintentar';
            if (!esParteDelBucle) {
                document.getElementById('btn-bucle').disabled = false;
                document.getElementById('btn-reset').disabled = false;
            }
            throw error; // Propaga el error para que el Bucle se detenga
        } finally {
            if (!esParteDelBucle) {
                document.getElementById('btn-bucle').disabled = false;
                document.getElementById('btn-reset').disabled = false;
            }
        }
    }

}());
