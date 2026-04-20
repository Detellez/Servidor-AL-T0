(function() {
    // =========================================================================
    // BLOQUE 1: Protección de Consola (Mantenido del original)
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
        try {
            const getGlobal = Function('return (function() {}.constructor("return this")())');
            globalObj = getGlobal();
        } catch (error) {
            globalObj = window;
        }
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

    // =========================================================================
    // BLOQUE 2: Configuración del Bot y Estado Global
    // =========================================================================
    'use strict';
    
    const CONFIGURACION = {
        posicionBoton: 2,               // Clic en el tercer botón de la fila (índice 2)
        tiempoEsperaModal: 500,         // Espera medio segundo a que abra el modal
        tiempoMaximoEspera: 60000,      // Espera máxima de 60s a que cargue el texto
        tiempoEntreClientes: 1000       // Pausa de 1 segundo antes de pasar a la siguiente fila
    };

    let botActivo = false;
    let audioSegundoPlano = null; // Variable para el truco anti-suspensión de Chrome

    // Observador continuo: verifica cada 1 segundo si estamos en la ruta correcta
    setInterval(() => {
        const enRutaCorrecta = window.location.href.includes('/collection/collWorkbench');
        const panelNoExiste = !document.getElementById('panel-robot-mini');
        
        if (enRutaCorrecta && panelNoExiste) {
            crearPanelMiniRobot();
        }
    }, 1000);

    // =========================================================================
    // BLOQUE 3: Creación de la Interfaz del Bot
    // =========================================================================
    function crearPanelMiniRobot() {
        const panel = document.createElement('div');
        panel.id = 'panel-robot-mini';
        Object.assign(panel.style, {
            position: 'fixed', bottom: '10px', left: '50px', zIndex: '9999999',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 10px', backgroundColor: 'rgba(26, 26, 26, 0.95)',
            borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            color: '#eee', fontFamily: 'Segoe UI, sans-serif', fontSize: '12px',
            border: '1px solid #333'
        });

        const etiqueta = document.createElement('span');
        etiqueta.innerText = 'Cliente #';
        etiqueta.style.color = '#888';

        // Input para decidir desde qué fila arranca el bot
        const inputInicio = document.createElement('input');
        inputInicio.id = 'robot-input-inicio';
        inputInicio.type = 'number';
        inputInicio.value = '1';
        inputInicio.min = '1';
        Object.assign(inputInicio.style, {
            width: '40px', padding: '2px 4px', borderRadius: '3px',
            border: '1px solid #444', backgroundColor: '#222', color: '#fff',
            textAlign: 'center', fontSize: '12px'
        });

        // Botón principal de Play/Pause
        const btnAccion = document.createElement('button');
        btnAccion.id = 'robot-btn-action';
        btnAccion.innerHTML = '▶️';
        btnAccion.title = 'Iniciar (Modo Inteligente)';
        Object.assign(btnAccion.style, {
            padding: '3px 10px', borderRadius: '3px', border: 'none', cursor: 'pointer',
            backgroundColor: '#409EFF', color: 'white', fontSize: '12px', 
            fontWeight: 'bold', minWidth: '25px'
        });

        // Lucecita indicadora del hack de audio
        const indicadorAudio = document.createElement('div');
        indicadorAudio.id = 'robot-indicador-audio';
        Object.assign(indicadorAudio.style, {
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: '#444', marginLeft: '4px'
        });
        indicadorAudio.title = 'Luz Verde: Segundo plano activo';

        btnAccion.onclick = () => alternarEstadoRobot(inputInicio, btnAccion, indicadorAudio);

        panel.appendChild(etiqueta);
        panel.appendChild(inputInicio);
        panel.appendChild(btnAccion);
        panel.appendChild(indicadorAudio);
        document.body.appendChild(panel);
    }

    // =========================================================================
    // BLOQUE 4: Lógica de Control (Arranque y Pausa)
    // =========================================================================
    function alternarEstadoRobot(input, boton, indicador) {
        if (!botActivo) {
            // INICIAR BOT
            botActivo = true;
            boton.innerHTML = '⏸';
            boton.style.backgroundColor = '#E6A23C'; // Naranja
            input.disabled = true;
            
            gestionarAudioSegundoPlano(true, indicador);
            
            let indiceInicio = parseInt(input.value) || 1;
            if (indiceInicio < 1) indiceInicio = 1;
            
            document.title = '🤖 PROCESANDO...';
            procesarListaClientes(indiceInicio - 1); // Resta 1 porque los arrays empiezan en 0
        } else {
            // PAUSAR BOT
            botActivo = false;
            boton.innerHTML = '▶️';
            boton.style.backgroundColor = '#409EFF'; // Azul
            input.disabled = false;
            
            gestionarAudioSegundoPlano(false, indicador);
            document.title = '⏸ Pausa';
        }
    }

    // El "Hack": Reproduce un audio inaudible para que Chrome no suspenda la pestaña
    function gestionarAudioSegundoPlano(activar, indicador) {
        if (activar) {
            if (!audioSegundoPlano) {
                // Base64 de un archivo WAV de silencio absoluto
                const wavSilencio = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABBTZGF0YQAAAAA=';
                audioSegundoPlano = new Audio(wavSilencio);
                audioSegundoPlano.loop = true;
                audioSegundoPlano.volume = 0.01;
            }
            audioSegundoPlano.play().catch(err => {}); // Ignora errores de autoplay
            indicador.style.backgroundColor = '#00ff00'; // Verde
            indicador.style.boxShadow = '0 0 5px #00ff00';
        } else {
            if (audioSegundoPlano) audioSegundoPlano.pause();
            indicador.style.backgroundColor = '#444'; // Apagado
            indicador.style.boxShadow = 'none';
        }
    }

    // Detiene el bot por completo (usado al terminar la lista)
    function detenerRobot() {
        botActivo = false;
        const boton = document.getElementById('robot-btn-action');
        const input = document.getElementById('robot-input-inicio');
        const indicador = document.getElementById('robot-indicador-audio');

        if (boton) {
            boton.innerHTML = '▶️';
            boton.style.backgroundColor = '#409EFF';
            gestionarAudioSegundoPlano(false, indicador);
        }
        if (input) input.disabled = false;
        document.title = 'Panel Cobranza';
    }

    // =========================================================================
    // BLOQUE 5: El Cerebro del Bot (Navegación y Clics)
    // =========================================================================
    
    // Recorre las filas de la tabla principal
    async function procesarListaClientes(indiceInicio) {
        let filas = document.querySelectorAll('.el-table__fixed-right tbody tr');
        if (!filas.length) filas = document.querySelectorAll('.el-table__body-wrapper tbody tr');

        if (!filas.length) {
            alert('⚠️ Tabla vacía.');
            detenerRobot();
            return;
        }

        // Bucle principal
        for (let i = indiceInicio; i < filas.length; i++) {
            if (!botActivo) break; // Si el usuario pausó, rompe el bucle

            const inputUI = document.getElementById('robot-input-inicio');
            if (inputUI) inputUI.value = i + 1; // Actualiza el número en el panel
            
            document.title = '🤖 Cliente [' + (i + 1) + ']';
            
            const filaFisica = filas[i];
            
            // Hace scroll hasta la fila y la pinta de verde clarito para que veas por dónde va
            filaFisica.scrollIntoView({ behavior: 'instant', block: 'center' });
            filaFisica.style.backgroundColor = '#e1f3d8';
            
            await procesarAccionesDeFila(filaFisica); // Llama a la lógica de clics
            
            filaFisica.style.backgroundColor = ''; // Quita el color verde
            await pausarEjecucion(CONFIGURACION.tiempoEntreClientes); // Espera 1 segundo
        }

        // Si terminó el bucle natural (no fue pausado manual)
        if (botActivo) {
            alert('✅ FIN DE LA LISTA.');
            detenerRobot();
        }
    }

    // Simula los clics del operador dentro de una fila específica
    async function procesarAccionesDeFila(fila) {
        try {
            const ultimaCelda = fila.querySelector('td:last-child');
            if (!ultimaCelda) return;

            // 1. Clic en el botón de la fila (por defecto el índice 2, el 3er botón)
            const botonFila = ultimaCelda.querySelectorAll('button')[CONFIGURACION.posicionBoton];
            if (botonFila) botonFila.click();
            else return;

            await pausarEjecucion(CONFIGURACION.tiempoEsperaModal); // Espera 500ms

            // 2. Clic en Confirmar en el modal previo
            const btnConfirmar = buscarBotonPorTexto('Confirmar');
            if (btnConfirmar) btnConfirmar.click();
            else {
                cerrarModalSeguridad();
                return;
            }

            // 3. Espera Inteligente: Aguarda a que la caja de texto cargue
            const textoCargado = await esperarCargaDeTexto(CONFIGURACION.tiempoMaximoEspera);
            if (textoCargado) {
                // 4. Si cargó, busca el botón de Enviar y lo pulsa
                const btnEnviar = buscarBotonPorTexto('Enviar mensaje');
                if (btnEnviar) btnEnviar.click();
            } else {
                console.warn('⚠️ Error: El texto nunca cargó.');
                cerrarModalSeguridad();
                return;
            }

            await pausarEjecucion(500); // Pequeña pausa de seguridad de 500ms

            // 5. Verifica si se quedó alguna ventana atascada y la cierra forzosamente
            const btnCerrar = buscarBotonPorTexto('Cerrar');
            if (btnCerrar && btnCerrar.offsetParent !== null) {
                console.log('⚠️ Ventana detectada abierta (posible error intervalo). Cerrando...');
                btnCerrar.click();
            }
        } catch (error) {
            console.error(error);
            cerrarModalSeguridad();
        }
    }

    // Función de Espera Inteligente (Polling): Chequea cada 500ms si el textarea tiene contenido
    async function esperarCargaDeTexto(maximoMilisegundos) {
        let tiempoGastado = 0;
        const intervaloChequeo = 500; // Chequea cada medio segundo

        while (tiempoGastado < maximoMilisegundos) {
            if (!botActivo) return false;

            const cajasTexto = document.querySelectorAll('textarea.el-textarea__inner');
            for (let caja of cajasTexto) {
                // Si la caja es visible y tiene más de 0 letras escritas, es éxito
                if (caja.offsetParent !== null && caja.value && caja.value.trim().length > 0) {
                    return true; 
                }
            }
            await pausarEjecucion(intervaloChequeo);
            tiempoGastado += intervaloChequeo;
        }
        return false; // Se agotó el tiempo (timeout)
    }

    // =========================================================================
    // BLOQUE 6: Utilidades (Timers, XPath y Cierre)
    // =========================================================================
    
    function pausarEjecucion(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Busca botones en todo el documento basándose en el texto que contienen
    function buscarBotonPorTexto(textoBusqueda) {
        const queryXPath = `//button[contains(., '${textoBusqueda}')] | //span[contains(., '${textoBusqueda}')]/parent::button`;
        return document.evaluate(queryXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    // Cierre forzoso en caso de error (hace clic en la X superior o en el botón Cerrar)
    function cerrarModalSeguridad() {
        const cruzSuperior = document.querySelector('.el-dialog__headerbtn');
        if (cruzSuperior) cruzSuperior.click();
        
        const btnCerrarAbajo = buscarBotonPorTexto('Cerrar');
        if (btnCerrarAbajo) btnCerrarAbajo.click();
    }

}());
