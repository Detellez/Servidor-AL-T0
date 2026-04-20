(function() {
    // =========================================================================
    // BLOQUE 0: Protección de Consola (Anti-Debug)
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

    'use strict';

    // ========================================================================
    // BLOQUE 1: CONSTANTES Y VARIABLES GLOBALES
    // ========================================================================
    const CLASE_FOTOS = 'sst-mini-fotos-container';
    let vState = { mode: 'VIEW', scale: 1, flip: 1, posX: 0, posY: 0, isDragging: false, isDrawing: false };
    const imageCache = {}; 

    let inicializadoPlantillas = false;
    const RUTA_OBJETIVO_PLANTILLAS = '/collection/#/pages/case/detail?';
    const LLAVE_ALMACENAMIENTO = 'DATA_PLANTILLAS_INDEPENDIENTE';
    const ESTILOS_VISTA_PREVIA = {
        position: 'absolute', right: '100%', top: '0', marginRight: '10px', width: '220px',
        height: '100%', backgroundColor: '#fff', borderRadius: '12px', padding: '15px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflowY: 'auto', display: 'none',
        fontSize: '12px', boxSizing: 'border-box', fontFamily: 'Segoe UI, sans-serif',
        border: '1px solid #e2e8f0'
    };

    // ========================================================================
    // BLOQUE 2: ESTILOS GLOBALES (VISOR + ANIMACIONES FÍSICAS DE BOTONES)
    // ========================================================================
    const ESTILOS_GLOBALES = `
        /* ANIMACIONES GLOBALES PARA TODO EL SCRIPT */
        @keyframes sstAparicionRapida { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        /* 🔥 LA MAGIA FÍSICA: Levantar al hover, hundir al clic (sin tocar color) */
        .sst-animacion-fisica {
            transition: transform 0.15s ease-out !important;
            will-change: transform;
        }
        .sst-animacion-fisica:hover {
            transform: translateY(-3px) !important;
        }
        .sst-animacion-fisica:active {
            transform: scale(0.92) translateY(0) !important;
        }

        /* ESTILOS DEL VISOR AVANZADO */
        #visor-id-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(5, 5, 5, 0.98); z-index: 2147483646; display: flex; flex-direction: column; justify-content: center; align-items: center; opacity: 0; animation: fadeIn 0.03s forwards; font-family: sans-serif; }
        @keyframes fadeIn { to { opacity: 1; } }
        #visor-img-container { flex: 1; width: 100%; display: flex; justify-content: center; align-items: center; overflow: hidden; cursor: grab; }
        #visor-editor-canvas { max-width: 90%; max-height: 80vh; box-shadow: 0 0 50px rgba(0,0,0,0.8); transition: transform 0.05s linear; }
        #visor-controls-wrapper { position: absolute; bottom: 30px; display: flex; flex-direction: column; align-items: center; gap: 10px; z-index: 2147483646; background: rgba(30, 30, 30, 0.8); backdrop-filter: blur(15px); padding: 10px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); }
        #visor-toolbar { display: flex; gap: 12px; align-items: center; }
        .visor-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; width: 44px; height: 44px; border-radius: 8px; cursor: pointer; font-size: 20px; display: flex; justify-content: center; align-items: center; transition: background 0.2s, transform 0.1s; }
        .visor-btn:hover { background: rgba(255,255,255,0.2); transform: translateY(-3px); }
        .visor-btn:active { transform: scale(0.90); }
        .visor-btn.active { background: #3b82f6; border-color: #3b82f6; }
        #visor-close { position: absolute; top: 30px; right: 30px; background: rgba(220, 38, 38, 0.8); border: none; color: white; font-size: 24px; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; z-index: 2147483647; transition: background 0.2s, transform 0.1s; }
        #visor-close:hover { transform: translateY(-3px) rotate(90deg); background: #dc2626; }
        #visor-close:active { transform: scale(0.90); }
        #tool-options-panel { display: none; gap: 10px; background: rgba(0,0,0,0.6); padding: 8px 15px; border-radius: 20px; align-items: center; }
        #tool-options-panel.visible { display: flex; }
        #visor-brush-cursor { position: fixed; pointer-events: none; z-index: 2147483648; border-radius: 50%; border: 2px solid white; display: none; transform: translate(-50%, -50%); }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerText = ESTILOS_GLOBALES;
    document.head.appendChild(styleEl);

    function rotateCanvasInternally(canvas, ctx, degrees) {
        const temp = document.createElement('canvas');
        const tCtx = temp.getContext('2d');
        if (Math.abs(degrees) % 180 === 90) { temp.width = canvas.height; temp.height = canvas.width; } 
        else { temp.width = canvas.width; temp.height = canvas.height; }
        tCtx.translate(temp.width / 2, temp.height / 2);
        tCtx.rotate(degrees * Math.PI / 180);
        tCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
        canvas.width = temp.width; canvas.height = temp.height;
        ctx.drawImage(temp, 0, 0);
    }

    function preCargarImagenSilenciosa(url) {
        if (!url || imageCache[url]) return; 
        imageCache[url] = "loading"; 
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { imageCache[url] = img; };
        img.onerror = () => {
            const retryImg = new Image();
            retryImg.onload = () => { imageCache[url] = retryImg; };
            retryImg.src = url;
        };
        img.src = url;
    }

    function openImageViewer(imgSrc) {
        if (document.getElementById('visor-id-overlay')) document.getElementById('visor-id-overlay').remove();
        vState = { mode: 'VIEW', scale: 1, flip: 1, posX: 0, posY: 0 };

        const overlay = document.createElement('div');
        overlay.id = 'visor-id-overlay';
        overlay.innerHTML = `
            <div id="visor-brush-cursor"></div>
            <div id="visor-img-container"><canvas id="visor-editor-canvas"></canvas></div>
            <div id="visor-controls-wrapper">
                <div id="tool-options-panel">
                    <span style="color:white; font-size:12px;">Color:</span><input type="color" id="brush-color" value="#ef4444">
                    <span style="color:white; font-size:12px; margin-left:10px;">Tamaño:</span><input type="range" id="brush-size" min="5" max="50" value="15">
                </div>
                <div id="visor-toolbar"></div>
            </div>
            <button id="visor-close">✕</button>`;
        document.body.appendChild(overlay);

        const canvas = document.getElementById('visor-editor-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('visor-img-container');
        
        const updateCanvasTransform = () => { canvas.style.transform = `translate(${vState.posX}px, ${vState.posY}px) scale(${vState.scale}) scaleX(${vState.flip})`; };

        const renderizarImagen = (imgObj) => {
            canvas.width = imgObj.naturalWidth;
            canvas.height = imgObj.naturalHeight;
            ctx.drawImage(imgObj, 0, 0);
            vState.scale = Math.min(window.innerWidth / imgObj.naturalWidth, window.innerHeight / imgObj.naturalHeight) * 0.85;
            updateCanvasTransform();
        };

        if (imageCache[imgSrc] && imageCache[imgSrc].complete && imageCache[imgSrc].naturalWidth) {
            renderizarImagen(imageCache[imgSrc]);
        } else {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => renderizarImagen(img);
            img.onerror = () => { 
                const retryImg = new Image(); 
                retryImg.onload = () => renderizarImagen(retryImg);
                retryImg.src = imgSrc;
            };
            img.src = imgSrc;
        }
        
        const toolbar = document.getElementById('visor-toolbar');
        const addBtn = (icon, action, id) => {
            const btn = document.createElement('button');
            btn.className = 'visor-btn'; if(id) btn.id = id; btn.innerHTML = icon;
            btn.onclick = (e) => { e.stopPropagation(); action(btn); };
            toolbar.appendChild(btn); return btn;
        };

        const setMode = (mode) => {
            vState.mode = mode;
            document.querySelectorAll('.visor-btn').forEach(b => b.classList.remove('active'));
            if (mode === 'VIEW') {
                document.getElementById('btn-view-mode').classList.add('active');
                container.style.cursor = 'grab';
                document.getElementById('tool-options-panel').classList.remove('visible');
            } else {
                document.getElementById('btn-draw-mode').classList.add('active');
                container.style.cursor = 'crosshair';
                document.getElementById('tool-options-panel').classList.add('visible');
            }
        };

        addBtn('✋', () => setMode('VIEW'), 'btn-view-mode');
        addBtn('✏️', () => setMode('DRAW'), 'btn-draw-mode');
        addBtn('⟲', () => rotateCanvasInternally(canvas, ctx, -90));
        addBtn('⟳', () => rotateCanvasInternally(canvas, ctx, 90));
        addBtn('↔️', () => { vState.flip *= -1; updateCanvasTransform(); });

        setMode('VIEW');

        const cursor = document.getElementById('visor-brush-cursor');
        window.onmousemove = (e) => {
            if (vState.mode === 'DRAW') {
                cursor.style.display = 'block';
                cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`;
                if (vState.isDrawing) {
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                    ctx.lineTo(x, y); ctx.stroke();
                }
            }
            if (vState.mode === 'VIEW' && vState.isDragging) {
                vState.posX = e.clientX - vState.startX; vState.posY = e.clientY - vState.startY;
                updateCanvasTransform();
            }
        };

        container.onmousedown = (e) => {
            if (vState.mode === 'VIEW') { vState.isDragging = true; vState.startX = e.clientX - vState.posX; vState.startY = e.clientY - vState.posY; }
            else {
                vState.isDrawing = true;
                const rect = canvas.getBoundingClientRect();
                ctx.lineWidth = document.getElementById('brush-size').value;
                ctx.strokeStyle = document.getElementById('brush-color').value;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
            }
        };

        window.onmouseup = () => { vState.isDragging = false; vState.isDrawing = false; };
        overlay.onwheel = (e) => { e.preventDefault(); vState.scale *= e.deltaY > 0 ? 0.9 : 1.1; updateCanvasTransform(); };
        document.getElementById('visor-close').onclick = () => overlay.remove();
        
        const escHandler = (e) => { if (e.key === 'Escape') { overlay.remove(); window.removeEventListener('keydown', escHandler); } };
        window.addEventListener('keydown', escHandler);
    }

    // ========================================================================
    // BLOQUE 3: MINICUADROS VERTICALES
    // ========================================================================
    function crearMiniCuadro(titulo, url) {
        const wrap = document.createElement('div');
        wrap.classList.add('sst-animacion-fisica'); // 🔥 Aplicamos la animación global
        
        Object.assign(wrap.style, {
            width: '150px', height: '150px', backgroundColor: '#fff', border: '0px solid #3b82f6',
            borderRadius: '8px', marginBottom: '10px', overflow: 'hidden', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', position: 'relative',
            animation: 'sstAparicionRapida 0.15s ease-out'
        });

        wrap.title = `Clic para ver ${titulo} en grande`;
        wrap.onclick = () => openImageViewer(url);

        const label = document.createElement('div');
        label.innerText = titulo;
        Object.assign(label.style, {
            fontSize: '8px', fontWeight: 'bold', backgroundColor: '#3b82f6', color: '#fff',
            width: '100%', textAlign: 'center', padding: '4px 0'
        });

        const img = document.createElement('img');
        img.src = url;
        Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' });

        wrap.append(label, img);
        return wrap;
    }

    function inyectarFotosInteligentes() {
        const hash = window.location.hash;
        if (!hash.includes('planId=')) return;

        // 🛑 DEPENDENCIA DE DATOS
        const loteString = localStorage.getItem('LOTE_RAFAGA');
        if (!loteString || loteString === '[]') {
            // Detenemos la inyección si el usuario no ha extraído los datos
            return;
        }

        if (document.querySelector('.' + CLASE_FOTOS)) return;

        const planId = new URLSearchParams(hash.split('?')[1]).get('planId');

        try {
            const loteObj = JSON.parse(loteString);
            const arrayClientes = Array.isArray(loteObj) ? loteObj : Object.values(loteObj);
            const cliente = arrayClientes.find(c => c.ID_Factura && c.ID_Factura.toString() === planId.toString());

            if (cliente && (cliente.Foto_Carnet || cliente.Foto_Selfie)) {
                
                if(cliente.Foto_Carnet) preCargarImagenSilenciosa(cliente.Foto_Carnet);
                if(cliente.Foto_Selfie) preCargarImagenSilenciosa(cliente.Foto_Selfie);

                const container = document.createElement('div');
                container.className = CLASE_FOTOS;
                Object.assign(container.style, {
                    position: 'fixed', top: '20px', right: '20px', zIndex: '2147483640',
                    display: 'flex', flexDirection: 'column'
                });

                if (cliente.Foto_Carnet) container.appendChild(crearMiniCuadro('', cliente.Foto_Carnet));
                if (cliente.Foto_Selfie) container.appendChild(crearMiniCuadro('', cliente.Foto_Selfie));

                document.body.appendChild(container);
            }
        } catch (e) {
            console.error("Error cargando fotos", e);
        }
    }

    // =========================================================================
    // BLOQUE 4: INICIALIZACIÓN E INTERFAZ BASE DE PLANTILLAS
    // =========================================================================
    function inicializarAppPlantillas() {
        const protegerConsola = antiDebug(this, function() {
            const getGlobal = function() {
                let globalObj;
                try { globalObj = Function('return (function() {}.constructor("return this")())')(); } 
                catch (error) { globalObj = window; }
                return globalObj;
            };
            const globalObj = getGlobal();
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
        protegerConsola();

        const urlActual = window.location.href;
        const contenedorMaestro = document.getElementById('contenedor-master-plantillas');

        if (!urlActual.includes(RUTA_OBJETIVO_PLANTILLAS)) {
            if (contenedorMaestro) contenedorMaestro.style.display = 'none';
            return;
        }

        if (contenedorMaestro) {
            if (contenedorMaestro.style.display === 'none') contenedorMaestro.style.display = 'flex';
            return; 
        }

        const contenedorNuevo = document.createElement('div');
        contenedorNuevo.id = 'contenedor-master-plantillas';
        Object.assign(contenedorNuevo.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483650',
            display: 'flex', flexDirection: 'column-reverse', gap: '8px',
            alignItems: 'flex-end', pointerEvents: 'none' 
        });

        document.body.appendChild(contenedorNuevo);
        renderizarBotonesPlantillas(); 
        inicializadoPlantillas = true;
    }

    // =========================================================================
    // BLOQUE 5: EXTRACCIÓN AVANZADA Y REEMPLAZO DE PLANTILLAS
    // =========================================================================
    function obtenerPlanIdDeUrl() {
        try {
            const hash = window.location.hash;
            if (!hash || !hash.includes('?')) return null;
            const urlParams = new URLSearchParams(hash.split('?')[1]);
            return urlParams.get('planId');
        } catch(e) { return null; }
    }

    function extraerDatosCliente() {
        const planId = obtenerPlanIdDeUrl();
        let datos = { prod: 'N/A', app: 'N/A', monto: '0', cliente: 'Cliente', telCliente: '' };

        if (planId) {
            try {
                const loteString = localStorage.getItem('LOTE_RAFAGA');
                if (loteString) {
                    const loteObj = JSON.parse(loteString);
                    const arrayClientes = Array.isArray(loteObj) ? loteObj : Object.values(loteObj);
                    const clienteEncontrado = arrayClientes.find(c => c.ID_Factura && c.ID_Factura.toString() === planId.toString());
                    
                    if (clienteEncontrado) {
                        return {
                            prod: clienteEncontrado.Producto || 'N/A',
                            app: clienteEncontrado.Aplicacion || 'N/A',
                            monto: clienteEncontrado.Deuda_Total || '0',
                            cliente: clienteEncontrado.Nombre_Completo || 'Cliente',
                            telCliente: clienteEncontrado.Telefono_Titular || '',
                            correo: clienteEncontrado.Correo || '',
                            prorroga: clienteEncontrado.Monto_Prorroga || '',
                            ref1: clienteEncontrado.Ref1_Telefono || '',
                            ref2: clienteEncontrado.Ref2_Telefono || '',
                            mora: clienteEncontrado.Dias_Mora || '0'
                        };
                    }
                }
            } catch (e) {}
        }

        try {
            const textoCompleto = document.body.innerText;
            const lineas = textoCompleto.split('\n').map(linea => linea.trim()).filter(linea => linea.length > 0);
            
            for (let i = 0; i < lineas.length; i++) {
                const lineaActual = lineas[i];
                if (lineaActual === 'Nombre del producto' && lineas[i + 1]) datos.prod = lineas[i + 1];
                if (lineaActual === 'Aplicación' && lineas[i + 1]) datos.app = lineas[i + 1];
                if (lineaActual === 'Monto pendiente' && lineas[i + 1]) datos.monto = lineas[i + 1].replace(/\D/g, ''); 
                if (lineaActual.includes('(Cliente)')) {
                    datos.cliente = lineaActual.replace('(Cliente)', '').trim();
                    for (let j = 1; j <= 6; j++) {
                        let posibleTelefono = lineas[i + j];
                        if (posibleTelefono && /^\d{8,12}$/.test(posibleTelefono)) {
                            datos.telCliente = posibleTelefono;
                            break;
                        }
                    }
                }
            }
        } catch(e){}
        return datos;
    }

    function reemplazarVariable(variable, datosCliente) {
        const formatearMoneda = (numero) => numero ? numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
        const capitalizarPalabras = (texto) => texto ? texto.toLowerCase().replace(/(?:^|\s)\S/g, letra => letra.toUpperCase()) : '';
        const separarCamelCase = (texto) => texto ? texto.replace(/([a-z])([A-Z])/g, '$1 $2').trim() : '';

        const appFormateada = separarCamelCase(datosCliente.app);
        const prodFormateado = separarCamelCase(datosCliente.prod);

        if (variable === '{{NOMBRE}}') return (datosCliente.cliente || '').toUpperCase();
        if (variable === '{{nombre}}') return (datosCliente.cliente || '').toLowerCase();
        if (variable === '{{Nombre}}') return capitalizarPalabras(datosCliente.cliente);
        
        if (variable === '{{APP}}') return appFormateada.toUpperCase();
        if (variable === '{{app}}') return appFormateada.toLowerCase();
        if (variable === '{{App}}') return capitalizarPalabras(appFormateada);
        
        if (variable === '{{PRODUCTO}}') return prodFormateado.toUpperCase();
        if (variable === '{{producto}}') return prodFormateado.toLowerCase();
        if (variable === '{{Producto}}') return capitalizarPalabras(prodFormateado);
        
        const prefijoPais = window.location.hostname === '182.160.29.4' ? '+51' : '+56';

        if (variable === '{{DEUDA TOTAL}}') return formatearMoneda(datosCliente.monto);
        if (variable === '{{TELEFONO}}') return datosCliente.telCliente ? prefijoPais + datosCliente.telCliente : '';

        if (variable === '{{CORREO}}') return datosCliente.correo || '';
        if (variable === '{{PRORROGA}}') return formatearMoneda(datosCliente.prorroga);
        if (variable === '{{REF1}}') return datosCliente.ref1 ? prefijoPais + datosCliente.ref1 : '';
        if (variable === '{{REF2}}') return datosCliente.ref2 ? prefijoPais + datosCliente.ref2 : '';
        if (variable === '{{MORA}}') return datosCliente.mora || '0';
        
        return null; 
    }

    function procesarPlantilla(textoPlantilla) {
        const datosExtraidos = extraerDatosCliente();
        let textoProcesado = textoPlantilla;
        
        const variablesPermitidas = [
            '{{NOMBRE}}', '{{nombre}}', '{{Nombre}}',
            '{{APP}}', '{{app}}', '{{App}}',
            '{{PRODUCTO}}', '{{producto}}', '{{Producto}}',
            '{{DEUDA TOTAL}}', '{{TELEFONO}}',
            '{{CORREO}}', '{{PRORROGA}}', '{{REF1}}', '{{REF2}}', '{{MORA}}'
        ];

        variablesPermitidas.forEach(variable => {
            const valorReemplazo = reemplazarVariable(variable, datosExtraidos);
            if (valorReemplazo !== null) {
                textoProcesado = textoProcesado.replaceAll(variable, valorReemplazo);
            }
        });

        return textoProcesado;
    }

    // =========================================================================
    // BLOQUE 6: DOM Y RENDERIZADO DE BOTONES
    // =========================================================================
    function renderizarBotonesPlantillas() {
        const contenedor = document.getElementById('contenedor-master-plantillas');
        if (!contenedor) return;

        contenedor.innerHTML = ''; 

        const btnNuevaPlantilla = document.createElement('button');
        btnNuevaPlantilla.innerText = '➕ Nueva Plantilla';
        aplicarEstiloBoton(btnNuevaPlantilla, '#475569'); 
        btnNuevaPlantilla.onclick = () => abrirModalEditor();
        contenedor.appendChild(btnNuevaPlantilla);

        const plantillasGuardadas = JSON.parse(localStorage.getItem(LLAVE_ALMACENAMIENTO) || '[]');

        plantillasGuardadas.forEach(plantilla => {
            const contenedorBotones = document.createElement('div');
            Object.assign(contenedorBotones.style, { display: 'flex', gap: '5px', pointerEvents: 'auto', alignItems: 'center' });

            const btnBorrar = document.createElement('button');
            btnBorrar.innerText = '×';
            btnBorrar.classList.add('sst-animacion-fisica'); // 🔥
            Object.assign(btnBorrar.style, { width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' });
            btnBorrar.onclick = () => { if (confirm('¿Borrar?')) eliminarPlantilla(plantilla.id); };

            const btnEditar = document.createElement('button');
            btnEditar.innerText = '✎';
            btnEditar.classList.add('sst-animacion-fisica'); // 🔥
            Object.assign(btnEditar.style, { width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', fontSize: '12px' });
            btnEditar.onclick = () => abrirModalEditor(plantilla);

            const btnAccion = document.createElement('button');
            btnAccion.innerText = plantilla.nombre;
            aplicarEstiloBoton(btnAccion, '#8b5cf6'); 
            btnAccion.style.width = 'auto';
            btnAccion.style.minWidth = '120px';
            btnAccion.onclick = () => {
                const textoFinal = procesarPlantilla(plantilla.contenido);
                copiarAlPortapapeles(textoFinal, '"' + plantilla.nombre + '" copiado');
            };

            contenedorBotones.appendChild(btnBorrar);
            contenedorBotones.appendChild(btnEditar);
            contenedorBotones.appendChild(btnAccion);
            contenedor.appendChild(contenedorBotones);
        });
    }

    function aplicarEstiloBoton(elemento, colorFondo) {
        elemento.classList.add('sst-animacion-fisica'); // 🔥 Delegamos la animación al CSS global
        Object.assign(elemento.style, { padding: '8px 16px', backgroundColor: colorFondo, color: '#ffffff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', pointerEvents: 'auto', animation: 'sstAparicionRapida 0.15s ease-out' });
    }

    function guardarPlantilla(nombre, contenido, idPlantilla = null) {
        let plantillas = JSON.parse(localStorage.getItem(LLAVE_ALMACENAMIENTO) || '[]');
        if (idPlantilla) {
            const indice = plantillas.findIndex(p => p.id === idPlantilla);
            if (indice !== -1) { plantillas[indice].nombre = nombre; plantillas[indice].contenido = contenido; }
        } else {
            plantillas.push({ id: Date.now(), nombre: nombre, contenido: contenido });
        }
        localStorage.setItem(LLAVE_ALMACENAMIENTO, JSON.stringify(plantillas));
        renderizarBotonesPlantillas(); 
    }

    function eliminarPlantilla(idPlantilla) {
        let plantillas = JSON.parse(localStorage.getItem(LLAVE_ALMACENAMIENTO) || '[]');
        plantillas = plantillas.filter(p => p.id !== idPlantilla);
        localStorage.setItem(LLAVE_ALMACENAMIENTO, JSON.stringify(plantillas));
        renderizarBotonesPlantillas();
    }

    // =========================================================================
    // BLOQUE 7: INTERFAZ DE EDICIÓN
    // =========================================================================
    function abrirModalEditor(plantillaAEditar = null) {
        const ID_MODAL = 'modal-editor-indep';
        if (document.getElementById(ID_MODAL)) return; 

        const modalOverlay = document.createElement('div');
        modalOverlay.id = ID_MODAL;
        Object.assign(modalOverlay.style, { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 2147483655, display: 'flex', justifyContent: 'center', alignItems: 'center' });

        const contenedorInterno = document.createElement('div');
        Object.assign(contenedorInterno.style, { position: 'relative', display: 'flex' });

        const panelVistaPrevia = document.createElement('div');
        Object.assign(panelVistaPrevia.style, ESTILOS_VISTA_PREVIA);
        contenedorInterno.appendChild(panelVistaPrevia);

        const formularioModal = document.createElement('div');
        Object.assign(formularioModal.style, { 
            background: '#ffffff', padding: '30px', borderRadius: '14px', 
            width: '650px', height: '550px', display: 'flex', flexDirection: 'column', 
            boxShadow: '0 15px 40px rgba(0,0,0,0.25)', fontFamily: 'Segoe UI, sans-serif',
            boxSizing: 'border-box'
        });

        const tituloModal = plantillaAEditar ? 'Editar' : 'Crear Nueva';
        const valorNombre = plantillaAEditar ? plantillaAEditar.nombre : '';
        const valorContenido = plantillaAEditar ? plantillaAEditar.contenido : '';

        formularioModal.innerHTML = `
        <h3 style="margin:0 0 15px 0; color:#1e293b; font-size: 22px;">${tituloModal} Plantilla</h3>
        <div style="margin-bottom: 12px;">
            <input type="text" id="edit-nombre" value="${valorNombre}" placeholder="Ej: Wpp Saludo" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; box-sizing:border-box; background:#fff; color:#334155; outline:none; transition:border 0.3s; font-size:14px;">
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
            <textarea id="edit-contenido" placeholder="Hola {{Nombre}}, tu deuda es {{DEUDA TOTAL}}..." style="width:100%; flex: 1; padding:12px; border:1px solid #cbd5e1; border-radius:8px; resize:none; box-sizing:border-box; font-family:sans-serif; background:#fff; color:#334155; outline:none; transition:border 0.3s; font-size:14px; line-height:1.5;"></textarea>
        </div>
        <div style="font-size:12px; color:#475569; background:#f8fafc; padding:12px; border-radius:8px; line-height:1.6; border: 1px dashed #cbd5e1; margin-top: 15px;">
            <strong style="color: #3b82f6;">Opciones:</strong> Escribe las variables entre llaves. Usa el botón "Guía" para ver valores reales.
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
            <div style="display:flex; gap:10px;">
                <button id="btn-import" title="Subir archivo de Backup" style="padding:10px 15px; cursor:pointer; border:1px solid #34d399; background:#ecfdf5; color:#10b981; border-radius:8px; font-weight:700; transition:all 0.2s; display:flex; align-items:center; gap:6px;">📥 Importar</button>
                <button id="btn-export" title="Descargar archivo de Backup" style="padding:10px 15px; cursor:pointer; border:1px solid #a78bfa; background:#f5f3ff; color:#8b5cf6; border-radius:8px; font-weight:700; transition:all 0.2s; display:flex; align-items:center; gap:6px;">📤 Exportar</button>
            </div>
            <div style="display:flex; gap:12px;">
                <button id="btn-guide" style="padding:10px 22px; cursor:pointer; border:1px solid #93c5fd; background:#eff6ff; color:#3b82f6; border-radius:8px; font-weight:700; transition:all 0.2s;">Guía</button>
                <button id="btn-cancel" style="padding:10px 22px; cursor:pointer; border:1px solid #cbd5e1; background:#f8fafc; color:#64748b; border-radius:8px; font-weight:700; transition:all 0.2s;">Cancelar</button>
                <button id="btn-save" style="padding:10px 22px; cursor:pointer; border:none; background:#3b82f6; color:white; border-radius:8px; font-weight:700; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); transition:all 0.2s;">Guardar</button>
            </div>
        </div>
        `;

        contenedorInterno.appendChild(formularioModal);
        modalOverlay.appendChild(contenedorInterno);
        document.body.appendChild(modalOverlay);
        
        document.getElementById('edit-contenido').value = valorContenido;

        const animarBoton = (id, colorHoverBg, colorHoverText, bordeHover) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const originalBg = btn.style.background;
            const originalColor = btn.style.color;
            const originalBorder = btn.style.border;
            
            // Aquí en el modal mantenemos el JS para cambiar el color, el movimiento físico
            // se mantiene compatible con la sensación del resto de botones.
            btn.onmouseenter = () => { btn.style.transform = 'translateY(-3px)'; btn.style.background = colorHoverBg; btn.style.color = colorHoverText; if(bordeHover) btn.style.border = bordeHover; };
            btn.onmouseleave = () => { btn.style.transform = 'translateY(0)'; btn.style.background = originalBg; btn.style.color = originalColor; if(bordeHover) btn.style.border = originalBorder; };
            btn.onmousedown = () => btn.style.transform = 'scale(0.92)';
            btn.onmouseup = () => btn.style.transform = 'translateY(-3px)';
        };

        animarBoton('btn-import', '#d1fae5', '#059669', '1px solid #10b981');
        animarBoton('btn-export', '#ede9fe', '#7c3aed', '1px solid #8b5cf6');
        animarBoton('btn-guide', '#dbeafe', '#2563eb', '1px solid #3b82f6');
        animarBoton('btn-cancel', '#f1f5f9', '#475569', '1px solid #94a3b8');
        animarBoton('btn-save', '#2563eb', '#ffffff', 'none');

        const inputs = formularioModal.querySelectorAll('input, textarea');
        inputs.forEach(el => { el.onfocus = () => el.style.borderColor = "#38bdf8"; el.onblur = () => el.style.borderColor = "#cbd5e1"; });

        document.getElementById('btn-import').onclick = () => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    try { localStorage.setItem(LLAVE_ALMACENAMIENTO, JSON.stringify(JSON.parse(ev.target.result))); renderizarBotonesPlantillas(); modalOverlay.remove(); mostrarNotificacionToast('✅ Plantillas Importadas'); } 
                    catch(err) { alert('❌ Archivo inválido.'); }
                };
                reader.readAsText(file);
            };
            input.click();
        };

        document.getElementById('btn-export').onclick = () => {
            const data = localStorage.getItem(LLAVE_ALMACENAMIENTO) || '[]';
            const blob = new Blob([data], {type: 'application/json'});
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
            a.download = `Mis_Plantillas_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            mostrarNotificacionToast('✅ Plantillas Exportadas');
        };

        document.getElementById('btn-guide').onclick = () => {
            const tagMap = [
                { tag: '{{NOMBRE}}', desc: 'Mayúscula' }, { tag: '{{Nombre}}', desc: 'Título' }, { tag: '{{nombre}}', desc: 'Minúscula' },
                { tag: '{{APP}}', desc: 'Mayúscula' }, { tag: '{{App}}', desc: 'Título' }, { tag: '{{app}}', desc: 'Minúscula' },
                { tag: '{{PRODUCTO}}', desc: 'Mayúscula' }, { tag: '{{Producto}}', desc: 'Título' }, { tag: '{{producto}}', desc: 'Minúscula' },
                { tag: '{{DEUDA TOTAL}}', desc: 'Monto Total' }, { tag: '{{TELEFONO}}', desc: 'Con Prefijo' },
                { tag: '{{CORREO}}', desc: 'Email' }, { tag: '{{PRORROGA}}', desc: 'Monto Prórroga' }, 
                { tag: '{{REF1}}', desc: 'Tel Referencia 1' }, { tag: '{{REF2}}', desc: 'Tel Referencia 2' },
                { tag: '{{MORA}}', desc: 'Días atraso' }
            ];
            
            const datosCliente = extraerDatosCliente(); 
            const guideContent = document.createElement('div');
            guideContent.id = "guide-scroll-container";
            Object.assign(guideContent.style, { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: '#ffffff', zIndex: '10', padding: '25px', boxSizing: 'border-box', overflowY: 'auto', borderRadius: '12px', display: 'flex', flexDirection: 'column' });

            const styleEl = document.createElement('style');
            styleEl.innerHTML = `#guide-scroll-container::-webkit-scrollbar { width: 6px; } #guide-scroll-container::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; } #guide-scroll-container::-webkit-scrollbar-thumb { background: #000000; border-radius: 10px; } #guide-scroll-container::-webkit-scrollbar-thumb:hover { background: #333333; }`;
            guideContent.appendChild(styleEl);

            let gridHtml = tagMap.map(item => {
                const val = reemplazarVariable(item.tag, datosCliente);
                // 🔥 Agregamos sst-animacion-fisica también a los botones de copiar
                return `<div style="background:#ffffff; padding:10px 12px; border-radius:10px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"><div style="display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap: 8px;"><code style="color:#d97706; font-family:monospace; font-size:12px; background:#fef3c7; padding:2px 6px; border-radius:4px; font-weight:bold;">${item.tag}</code><button class="btn-copy-tag sst-animacion-fisica" data-tag="${item.tag}" title="Copiar etiqueta" style="border:1px solid #cbd5e1; background:#fff; color:#3b82f6; border-radius:14px; padding:2px 10px; font-size:10px; cursor:pointer; outline:none; font-weight:700;">Copiar</button></div><span style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:bold;">${item.desc}</span></div><span style="color:#334155; font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;" title="${val}">${val || '<span style="color:#94a3b8; font-style:italic;">(Vacío)</span>'}</span></div>`;
            }).join('');
            
            guideContent.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:15px; margin-bottom:15px;"><div><h3 style="margin:0; color:#3b82f6; font-size:20px; display:flex; align-items:center; gap:8px;">📚 Guía de Variables</h3><span style="font-size:12px; color:#64748b;">Vista previa con datos reales detectados.</span></div><button id="close-guide" style="background:none; border:none; color:#64748b; font-size:28px; cursor:pointer; padding:0 10px; transition:color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#64748b'">&times;</button></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-bottom: 20px;">${gridHtml}</div>`;
            formularioModal.appendChild(guideContent);
            guideContent.querySelector('#close-guide').onclick = () => guideContent.remove();

            guideContent.querySelectorAll('.btn-copy-tag').forEach(btn => {
                btn.onmouseenter = () => { if (btn.innerText !== 'Copiado') { btn.style.background = '#3b82f6'; btn.style.color = '#fff'; btn.style.borderColor = '#3b82f6'; } };
                btn.onmouseleave = () => { if (btn.innerText !== 'Copiado') { btn.style.background = '#fff'; btn.style.color = '#3b82f6'; btn.style.borderColor = '#cbd5e1'; } };
                btn.onclick = () => {
                    const tagExacto = btn.getAttribute('data-tag'); if (!tagExacto) return; 
                    const textArea = document.createElement("textarea"); textArea.value = tagExacto; textArea.style.position = "fixed"; textArea.style.left = "-9999px"; document.body.appendChild(textArea); textArea.select();
                    try { document.execCommand("copy"); btn.innerText = 'Copiado'; btn.style.background = '#3b82f6'; btn.style.color = '#fff'; btn.style.borderColor = '#3b82f6'; setTimeout(() => { btn.innerText = 'Copiar'; btn.style.background = '#fff'; btn.style.color = '#3b82f6'; btn.style.borderColor = '#cbd5e1'; }, 1200); } catch (err) {} finally { document.body.removeChild(textArea); }
                };
            });
        };

        const textareaContenido = document.getElementById('edit-contenido');
        const actualizarVistaPrevia = () => {
            const textoActual = textareaContenido.value; const variablesEncontradas = [...textoActual.matchAll(/{{(.*?)}}/g)];
            if (variablesEncontradas.length === 0) { panelVistaPrevia.style.display = 'none'; return; }
            panelVistaPrevia.style.display = 'block'; const datosCliente = extraerDatosCliente();
            const htmlVistaPrevia = [...new Set(variablesEncontradas.map(match => match[0]))].map(variable => {
                const valorReal = reemplazarVariable(variable, datosCliente);
                return `<div style="margin-bottom:10px; border-bottom:1px dashed #e2e8f0; padding-bottom:5px;"><strong style="color:#3b82f6;">${variable}</strong><br><span style="color:${valorReal ? '#16a34a' : '#dc2626'}; font-weight:600; font-size:13px;">${valorReal ? valorReal : '(No encontrado)'}</span></div>`;
            }).join('');
            panelVistaPrevia.innerHTML = `<h4 style="margin:0 0 10px 0; color:#1e293b; border-bottom:1px solid #cbd5e1; padding-bottom:8px;">Vista Previa</h4>${htmlVistaPrevia}`;
        };

        textareaContenido.addEventListener('input', actualizarVistaPrevia);
        if (plantillaAEditar) actualizarVistaPrevia(); 

        document.getElementById('btn-cancel').onclick = () => modalOverlay.remove();
        document.getElementById('btn-save').onclick = () => {
            const inputNombre = document.getElementById('edit-nombre').value.trim(); const inputContenido = document.getElementById('edit-contenido').value;
            if (!inputNombre || !inputContenido) return alert('Faltan datos');
            guardarPlantilla(inputNombre, inputContenido, plantillaAEditar ? plantillaAEditar.id : null); modalOverlay.remove();
        };
    }

    function copiarAlPortapapeles(texto, mensajeExito) {
        const textareaTemporal = document.createElement('textarea'); textareaTemporal.value = texto; textareaTemporal.style.position = 'fixed'; textareaTemporal.style.left = '-9999px'; document.body.appendChild(textareaTemporal); textareaTemporal.select();
        try { document.execCommand('copy'); mostrarNotificacionToast(mensajeExito); } catch (error) { mostrarNotificacionToast('❌ Error al copiar'); }
        document.body.removeChild(textareaTemporal);
    }

    function mostrarNotificacionToast(mensaje) {
        const toast = document.createElement('div'); toast.innerText = mensaje;
        Object.assign(toast.style, { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '12px 24px', borderRadius: '30px', zIndex: 2147483656, fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'opacity 0.5s' });
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 2000); 
    }

    // =========================================================================
    // BLOQUE 8: MOTOR DE INYECCIÓN ULTRA-RÁPIDA
    // =========================================================================
    let ultimaUrl = location.href;
    function forzarRenderizadoRapido() {
        if (location.href !== ultimaUrl) {
            ultimaUrl = location.href;
            const anterior = document.querySelector('.' + CLASE_FOTOS);
            if (anterior) anterior.remove();
        }
        
        if (window.location.href.includes('/detail')) {
            inyectarFotosInteligentes();
        }
        inicializarAppPlantillas();
    }

    forzarRenderizadoRapido();

    const observadorMutaciones = new MutationObserver(() => { forzarRenderizadoRapido(); });
    observadorMutaciones.observe(document.body, { childList: true, subtree: true });

    const interceptarNavegacionSPA = () => {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        const despacharNavegacion = () => { window.dispatchEvent(new Event('spa_navigate')); };
        history.pushState = function() { originalPushState.apply(this, arguments); despacharNavegacion(); };
        history.replaceState = function() { originalReplaceState.apply(this, arguments); despacharNavegacion(); };
        window.addEventListener('popstate', despacharNavegacion);
        window.addEventListener('hashchange', despacharNavegacion);
    };

    interceptarNavegacionSPA();

    window.addEventListener('spa_navigate', () => {
        forzarRenderizadoRapido(); 
        let intentos = 0;
        const rafagaVelocidad = setInterval(() => {
            forzarRenderizadoRapido();
            intentos++;
            if (intentos > 30) clearInterval(rafagaVelocidad);
        }, 30); 
    });

    setInterval(forzarRenderizadoRapido, 1000);

})();
