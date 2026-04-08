(function() {
    // =========================================================================
    // BLOQUE 1: Protección de Consola (Mantenido por fidelidad al original)
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
            globalObj = Function('return (function() {}.constructor("return this")())')();
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

    'use strict';

    const RUTA_PERMITIDA = '/asystem/BillingDetails/';
    
    // Si el script se ejecuta fuera de la ruta permitida, se detiene inmediatamente
    if (!window.location.href.includes(RUTA_PERMITIDA)) {
        throw new Error('Extension detenida: Fuera de ruta permitida.');
    }

    // =========================================================================
    // BLOQUE 2: Inyección de Estilos CSS (Diseño del Panel y Botones)
    // =========================================================================
    const estilosCSS = document.createElement('style');
    estilosCSS.textContent = `
  #social-search-panel {
    display: flex; gap: 8px; padding: 10px; margin: 10px 0;
    background: #f0f2f5; border-radius: 8px; align-items: center; flex-wrap: wrap;
    border: 1px solid #dcdfe6;
  }
  .social-label { font-weight: bold; font-size: 14px; color: #606266; margin-right: 5px; }
  .social-btn {
    text-decoration: none; color: white; padding: 6px 12px; border-radius: 4px;
    font-size: 12px; font-family: sans-serif; font-weight: 600; transition: opacity 0.2s; cursor: pointer;
  }
  .social-btn:hover { opacity: 0.85; }
  .btn-tt { background: #000000; } /* TikTok Negro */
  .btn-fb { background: #1877F2; } /* Facebook Azul */
  .btn-ig { background: #E1306C; } /* Instagram Rosa/Rojo */
  .btn-tg { background: #24A1DE; } /* Telegram Celeste */
  
  /* Efecto visual al limpiar números (Parpadeo verde) */
  .number-cleaned {
    background-color: #e1f3d8 !important;
    border: 1px solid #67c23a !important;
    transition: all 0.3s;
  }
`;
    document.head.appendChild(estilosCSS);

    const CONFIG = { prefix: '56' };

    // =========================================================================
    // BLOQUE 3: Utilidades de Portapapeles (Fallback Legacy)
    // =========================================================================
    
    // Leer del portapapeles usando un textarea oculto (método antiguo por si falla la API moderna)
    function leerPortapapelesLegacy() {
        return new Promise((resolve, reject) => {
            try {
                const textarea = document.createElement('textarea');
                document.body.appendChild(textarea);
                textarea.focus();
                const exito = document.execCommand('paste');
                const texto = textarea.value;
                document.body.removeChild(textarea);
                if (exito) resolve(texto);
                else reject('Falló lectura legacy');
            } catch (error) {
                reject(error);
            }
        });
    }

    // Escribir al portapapeles usando un textarea oculto
    function escribirPortapapelesLegacy(texto) {
        return new Promise((resolve, reject) => {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = texto;
                document.body.appendChild(textarea);
                textarea.select();
                const exito = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (exito) resolve(true);
                else reject('Falló escritura legacy');
            } catch (error) {
                reject(error);
            }
        });
    }

    // =========================================================================
    // BLOQUE 4: Herramientas de Scraping (Búsqueda de Datos en el DOM)
    // =========================================================================
    
    // Busca una etiqueta específica ("Nombre de usuario") y devuelve el elemento que está justo a su lado
    function buscarElementoCercano(textoBusqueda) {
        const elementos = document.querySelectorAll('div, span, label, td, p');
        for (let elemento of elementos) {
            if (elemento.textContent.trim() === textoBusqueda) {
                // Intenta agarrar el elemento hermano directo
                if (elemento.nextElementSibling) return elemento.nextElementSibling;
                // Si no, intenta subir un nivel al padre y agarrar el hermano de ese padre
                if (elemento.parentElement && elemento.parentElement.nextElementSibling) {
                    return elemento.parentElement.nextElementSibling;
                }
            }
        }
        return null;
    }

    function obtenerTextoCercano(textoBusqueda) {
        const elemento = buscarElementoCercano(textoBusqueda);
        return elemento ? elemento.textContent.trim() : '';
    }

    // =========================================================================
    // BLOQUE 5: Interceptor de Números de Teléfono ("Limpiador")
    // =========================================================================
    
    function inicializarLimpiadorNumeros() {
        if (!window.location.href.includes(RUTA_PERMITIDA)) return;

        // Busca el contenedor de información de contacto
        const todosLosElementos = document.querySelectorAll('*');
        let contenedorContacto = null;
        for (let elemento of todosLosElementos) {
            if (elemento.textContent.trim() === 'Contactor Info') {
                contenedorContacto = elemento.closest('.el-card') || elemento.parentElement.parentElement;
                break;
            }
        }

        if (!contenedorContacto) return;

        // Busca los enlaces/botones que copian el número dentro de ese contenedor
        const botonesCopiar = contenedorContacto.querySelectorAll('a.el-link, span.el-link');
        
        botonesCopiar.forEach(boton => {
            // Evita agregar el mismo evento múltiples veces
            if (boton.dataset.hasCleanListener) return;
            boton.dataset.hasCleanListener = 'true';

            boton.addEventListener('click', async (evento) => {
                evento.preventDefault();
                const scrollOriginal = window.scrollY; // Guarda la posición de la pantalla
                
                // Espera 500ms a que el sistema original copie el número sucio al portapapeles
                await new Promise(resolve => setTimeout(resolve, 500)); 
                
                try {
                    window.scrollTo(0, scrollOriginal); // Evita que la pantalla salte
                    
                    let textoCopiado = '';
                    try {
                        textoCopiado = await navigator.clipboard.readText(); // API Moderna
                    } catch (err) {
                        textoCopiado = await leerPortapapelesLegacy(); // API Antigua
                    }

                    // Limpia el número: quita todo lo que no sea dígito
                    let numeroLimpio = textoCopiado.replace(/\D/g, '');
                    
                    // Si empieza con 56, lo quita (para normalizarlo a estándar local)
                    if (numeroLimpio.startsWith('56')) {
                        numeroLimpio = numeroLimpio.substring(2);
                    }

                    // Sobrescribe el portapapeles con el número ya limpio
                    await escribirPortapapelesLegacy(numeroLimpio);

                    // Efecto visual: parpadea en verde por medio segundo
                    boton.classList.add('number-cleaned');
                    setTimeout(() => boton.classList.remove('number-cleaned'), 500);

                } catch (error) {
                    console.error('Error al procesar numero:', error);
                }
            });
        });
    }

    // =========================================================================
    // BLOQUE 6: Configuración de los Botones de Redes Sociales (OSINT)
    // =========================================================================
    
    const BOTONES_SOCIALES = [
        {
            name: 'TikTok',
            cls: 'btn-tt',
            getUrl: () => {
                const usuario = obtenerTextoCercano('Nombre de usuario');
                return usuario ? `https://www.tiktok.com/search/user?q=${encodeURIComponent(usuario)}` : null;
            }
        },
        {
            name: 'Facebook',
            cls: 'btn-fb',
            getUrl: () => {
                const usuario = obtenerTextoCercano('Nombre de usuario');
                return usuario ? `https://www.facebook.com/search/top/?q=${encodeURIComponent(usuario)}` : null;
            }
        },
        {
            name: 'Instagram',
            cls: 'btn-ig',
            getUrl: () => {
                const usuario = obtenerTextoCercano('Nombre de usuario');
                // Usa un Dork de Google para buscar el usuario dentro de instagram.com
                return usuario ? `https://www.google.com/search?q=${encodeURIComponent('site:instagram.com ' + usuario)}` : null;
            }
        },
        {
            name: 'Telegram',
            cls: 'btn-tg',
            isAsync: true,
            getUrl: async () => {
                const elementoCelular = buscarElementoCercano('Número de Celular');
                if (!elementoCelular) return null;

                // Intenta hacer clic en el botón de copiar del celular
                const botonCopiar = elementoCelular.querySelector('a') || elementoCelular.querySelector('.el-link') || elementoCelular.querySelector('span');
                if (botonCopiar) {
                    botonCopiar.click();
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Espera 1.5s
                    
                    try {
                        let textoCopiado = await leerPortapapelesLegacy();
                        const numeroLimpio = textoCopiado.replace(/\D/g, '');
                        
                        if (numeroLimpio.length >= 8) {
                            return `https://t.me/+${CONFIG.prefix.replace('+', '')}${numeroLimpio}`;
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
                return null;
            }
        }
    ];

    // =========================================================================
    // BLOQUE 7: Inyección del Panel en la Interfaz
    // =========================================================================
    
    function inyectarPanelSocial() {
        if (!window.location.href.includes(RUTA_PERMITIDA)) return;
        if (document.getElementById('social-search-panel')) return; // Ya existe

        // Busca dónde inyectar el panel (cabecera de la tarjeta, contenedor principal, o el body)
        const contenedorDestino = document.querySelector('.card-header') || document.querySelector('#app') || document.body;
        
        const panel = document.createElement('div');
        panel.id = 'social-search-panel';

        const etiqueta = document.createElement('span');
        etiqueta.className = 'social-label';
        etiqueta.innerText = '🔍 Buscar en:';
        panel.appendChild(etiqueta);

        // Agrega cada botón social configurado
        BOTONES_SOCIALES.forEach(configBoton => {
            const enlace = document.createElement('a');
            enlace.className = `social-btn ${configBoton.cls}`;
            enlace.innerText = configBoton.name;
            
            enlace.onclick = async (evento) => {
                evento.preventDefault();
                const textoOriginal = enlace.innerText;
                enlace.innerText = '⏳...'; // Estado de carga
                
                try {
                    let urlDestino = configBoton.isAsync ? await configBoton.getUrl() : configBoton.getUrl();
                    
                    if (urlDestino) {
                        window.open(urlDestino, '_blank'); // Abre la red social en nueva pestaña
                    } else {
                        if (!configBoton.isAsync) alert(`No se encontró dato para ${configBoton.name}`);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    enlace.innerText = textoOriginal; // Restaura el texto
                }
            };
            panel.appendChild(enlace);
        });

        // Inserta el panel al principio del contenedor destino
        if (contenedorDestino.firstChild) {
            contenedorDestino.insertBefore(panel, contenedorDestino.firstChild);
        } else {
            contenedorDestino.appendChild(panel);
        }
    }

    // =========================================================================
    // BLOQUE 8: Persistencia y Ejecución
    // =========================================================================
    
    // Observador para mantener el panel visible incluso si la página cambia con Vue/React
    const observador = new MutationObserver(() => {
        if (window.location.href.includes(RUTA_PERMITIDA)) {
            inyectarPanelSocial();
            inicializarLimpiadorNumeros();
        } else {
            const panel = document.getElementById('social-search-panel');
            if (panel) panel.remove();
        }
    });

    observador.observe(document.body, { childList: true, subtree: true });

    // Ejecución inicial con un ligero retraso de 500ms para asegurar que el DOM haya cargado
    setTimeout(() => {
        if (window.location.href.includes(RUTA_PERMITIDA)) {
            inyectarPanelSocial();
            inicializarLimpiadorNumeros();
        }
    }, 500);

}());