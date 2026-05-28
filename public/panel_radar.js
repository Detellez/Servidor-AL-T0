(function() {
    'use strict';

    // ==========================================
    // 🌐 PANEL INTELIGENTE V12 + TERMINAL V4 UNIFICADOS
    // ==========================================
    
    // --- CONFIGURACIÓN RADAR ---
    const CEREBRO_URL = 'https://script.google.com/macros/s/AKfycbx2MmJpsF1jgwyhmH4AuYpOoRQKv4U6AEo9HQiDv7LxXx8TR3qNHFLczu1TyCMvCAsl/exec';
    const API_URL = CEREBRO_URL;
    const SECURITY_TOKEN = 'SST_V12_CORP_SECURE_2026_X9';

    let isPinging = false;
    let isPaused = false;
    let pingDirection = 'top'; 
    let pingCount = 0;

    // --- TEMAS DE BOTONES ---
    const btnThemes = {
        blue: { bg: '#eff6ff', text: '#3b82f6', border: '1px solid #93c5fd', hBg: '#dbeafe', hText: '#2563eb', hBorder: '1px solid #3b82f6' },
        purple: { bg: '#f5f3ff', text: '#8b5cf6', border: '1px solid #a78bfa', hBg: '#ede9fe', hText: '#7c3aed', hBorder: '1px solid #8b5cf6' },
        red: { bg: '#fef2f2', text: '#ef4444', border: '1px solid #fca5a5', hBg: '#fee2e2', hText: '#dc2626', hBorder: '1px solid #ef4444' },
        orange: { bg: '#fff7ed', text: '#d97706', border: '1px solid #fdba74', hBg: '#ffedd5', hText: '#b45309', hBorder: '1px solid #d97706' },
        indigo: { bg: '#e0e7ff', text: '#6366f1', border: '1px solid #a5b4fc', hBg: '#c7d2fe', hText: '#4f46e5', hBorder: '1px solid #6366f1' },
        emerald: { bg: '#ecfdf5', text: '#10b981', border: '1px solid #6ee7b7', hBg: '#d1fae5', hText: '#059669', hBorder: '1px solid #10b981' } // Tema para la Terminal
    };

    // ==========================================
    // 💻 LÓGICA DE LA TERMINAL
    // ==========================================
    const TerminalApp = {
        clientes: [],
        clientesFiltrados: [],
        host: window.location.hostname,
        token: '',
        
        init: function() {
            if (document.getElementById('terminal-overlay')) return;
            this.extraerToken();
            this.inyectarCSS();
            this.crearEstructura();
            // Ya no creamos el botón flotante aquí, se abre desde el Panel Radar
        },

        extraerToken: function() {
            let tv = localStorage.getItem('token') || '';
            tv = tv.replace(/^"|"$/g, '').trim();
            this.token = tv.toLowerCase().startsWith('bearer ') ? tv : "Bearer " + tv;
        },

        getHeaders: function() {
            return {
                "accept": "application/json;charset=UTF-8",
                "accept-language": "es-ES,es;q=0.9",
                "authorization": this.token,
                "content-type": "application/json;charset=UTF-8",
                "sec-gpc": "1"
            };
        },

        inyectarCSS: function() {
            const style = document.createElement('style');
            style.innerHTML = `
                /* Overlay y Contenedores Terminal */
                #terminal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10, 15, 20, 0.95); z-index: 9999999; display: none; font-family: 'Courier New', Courier, monospace; color: #0f0; backdrop-filter: blur(5px); }
                #term-container { width: 95%; max-width: 1600px; height: 95vh; margin: 2.5vh auto; background: #0c0f12; border: 1px solid #1f2937; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 30px rgba(0,255,0,0.1); }
                .term-header { background: #111827; border-bottom: 1px solid #0f0; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; color: #0f0; font-weight: bold; }
                .term-header-close { color: #ef4444; cursor: pointer; font-size: 20px; transition: 0.2s; }
                .term-header-close:hover { text-shadow: 0 0 10px #ef4444; }
                .term-body { flex: 1; display: flex; overflow: hidden; }
                .term-main { flex: 1; display: flex; flex-direction: column; padding: 15px; border-right: 1px solid #1f2937; overflow: hidden; }
                .term-sidebar { width: 280px; padding: 15px; overflow-y: auto; background: #080a0c; display: flex; flex-direction: column; gap: 15px; }
                
                /* Controles Terminal */
                .term-controls { display: flex; gap: 15px; margin-bottom: 10px; align-items: flex-end; flex-wrap: wrap; }
                .term-input, .term-select, .term-textarea { background: #000; border: 1px solid #0f0; color: #0f0; padding: 6px 10px; font-family: monospace; border-radius: 4px; outline: none; }
                .term-input:focus, .term-textarea:focus { box-shadow: 0 0 8px rgba(0,255,0,0.4); }
                .term-btn { background: transparent; border: 1px solid #0f0; color: #0f0; padding: 6px 15px; cursor: pointer; border-radius: 4px; font-family: monospace; font-weight: bold; transition: 0.2s; white-space: nowrap; }
                .term-btn:hover { background: rgba(0, 255, 0, 0.1); box-shadow: 0 0 10px rgba(0,255,0,0.3); }
                
                /* Panel de Mensajes */
                .term-msg-group { display: flex; gap: 15px; border: 1px solid #1f2937; padding: 10px; border-radius: 6px; background: #080a0c; margin-bottom: 15px; align-items: flex-end; flex-wrap: wrap;}
                .term-msg-item { display: flex; flex-direction: column; gap: 4px; }
                
                /* Tabla Terminal */
                .term-table-wrapper { flex: 1; overflow: auto; border: 1px solid #1f2937; margin-bottom: 15px; background: #0a0a0a; }
                .term-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                .term-table th { background: #111827; color: #fff; text-align: left; padding: 8px; position: sticky; top: 0; border-bottom: 1px solid #374151; z-index: 10;}
                .term-table td { padding: 6px 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb; }
                .term-table tr:hover td { background: rgba(0,255,0,0.05); color: #0f0; }
                
                /* Sidebar Panels */
                .term-panel { border: 1px solid #374151; border-radius: 6px; background: #0f1115; }
                .term-panel-title { color: #60a5fa; font-size: 11px; padding: 8px 10px; border-bottom: 1px solid #374151; letter-spacing: 1px; }
                .term-panel-row { display: flex; justify-content: space-between; padding: 4px 10px; font-size: 11px; color: #9ca3af; }
                .term-val-orange { color: #f59e0b; } .term-val-red { color: #ef4444; } 
                
                /* Console Log */
                .term-log { height: 120px; background: #000; border: 1px solid #1f2937; padding: 10px; font-size: 11px; overflow-y: auto; border-radius: 4px; }
                .term-log-line { margin-bottom: 3px; }
                .term-log-time { color: #6b7280; margin-right: 8px; }
                .term-log-msg { color: #0f0; }
                .term-log-err { color: #ef4444; }
                .term-check { accent-color: #0f0; width: 14px; height: 14px; cursor: pointer;}
                
                /* Modales Terminal */
                #term-historial-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #111827; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; box-shadow: 0 0 50px rgba(0,0,0,0.9); z-index: 2147483647; display: none; width: 600px; max-height: 80vh; overflow-y: auto; }
                #term-historial-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); z-index: 2147483646; display: none; }
                #term-confirm-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 2147483648; display: none; backdrop-filter: blur(3px); }
                #term-confirm-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #0a0a0a; border: 2px solid #10b981; padding: 25px; border-radius: 6px; box-shadow: 0 0 40px rgba(16, 185, 129, 0.2); z-index: 2147483649; display: none; width: 450px; text-align: center; font-family: monospace; }
                .term-confirm-title { color: #f59e0b; font-size: 16px; font-weight: bold; margin-bottom: 20px; letter-spacing: 1px; }
                .term-confirm-desc { color: #e5e7eb; font-size: 13px; margin-bottom: 25px; white-space: pre-line; line-height: 1.5; }
                .term-confirm-btns { display: flex; justify-content: center; gap: 20px; }
                .term-confirm-btn-rojo { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 8px 20px; cursor: pointer; border-radius: 4px; font-weight: bold; font-family: monospace; transition: 0.2s;}
                .term-confirm-btn-rojo:hover { background: rgba(239, 68, 68, 0.1); box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
                .term-confirm-btn-verde { background: transparent; border: 1px solid #10b981; color: #10b981; padding: 8px 20px; cursor: pointer; border-radius: 4px; font-weight: bold; font-family: monospace; transition: 0.2s;}
                .term-confirm-btn-verde:hover { background: rgba(16, 185, 129, 0.1); box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
            `;
            document.head.appendChild(style);
        },

        crearEstructura: function() {
            const overlay = document.createElement('div');
            overlay.id = 'terminal-overlay';
            
            overlay.innerHTML = `
                <div id="term-container">
                    <div class="term-header">
                        <span>TERMINAL ADMINISTRATIVA | <span style="color:#f59e0b">CH & PE</span></span>
                        <span class="term-header-close" onclick="document.getElementById('terminal-overlay').style.display='none'">✖</span>
                    </div>
                    <div class="term-body">
                        <div class="term-main">
                            <div class="term-controls">
                                <div>
                                    <div style="font-size:10px; color:#10b981; margin-bottom:3px;">Filtro de Bandeja:</div>
                                    <select id="term-sel-bandeja" class="term-select">
                                        <option value="ALL">Todas las Bandejas</option>
                                        <option value="1">Bandeja 1 (No Seguido)</option>
                                        <option value="2">Bandeja 2 (Seguido)</option>
                                        <option value="3">Bandeja 3 (Crítico)</option>
                                    </select>
                                </div>
                                <div>
                                    <div style="font-size:10px; color:#10b981; margin-bottom:3px;">Tipo de Cliente:</div>
                                    <select id="term-sel-duplicidad" class="term-select">
                                        <option value="ALL">Todos los Registros</option>
                                        <option value="UNIQUE">Clientes Únicos</option>
                                        <option value="DUPLICATE">Repetidos (Multi-App)</option>
                                    </select>
                                </div>
                                <div>
                                    <div style="font-size:10px; color:#f59e0b; margin-bottom:3px;">Días Mora:</div>
                                    <select id="term-sel-mora" class="term-select" style="border-color:#f59e0b; color:#f59e0b;">
                                        <option value="ALL">Todos los Días</option>
                                        <option value="0">0 días</option>
                                        <option value="1">1 día</option>
                                        <option value="2">2 días</option>
                                        <option value="3">3 días</option>
                                        <option value="4">4 días</option>
                                        <option value="5">5 días</option>
                                        <option value="6">6 días</option>
                                        <option value="7">7 días</option>
                                        <option value="8+">8 o más días</option>
                                    </select>
                                </div>
                                <div style="flex:1"></div>
                                <button class="term-btn" id="term-btn-clic-titular" style="border-color:#0ea5e9; color:#0ea5e9;" title="Simula copiar Teléfono Titular">
                                    [> CLIC TITULAR <span class="lbl-count-sel">(0)</span> ]
                                </button>
                                <button class="term-btn" id="term-btn-clic-refs" style="border-color:#f59e0b; color:#f59e0b;" title="Simula copiar Referencias 1 y 2">
                                    [> CLIC REFS <span class="lbl-count-sel">(0)</span> ]
                                </button>
                            </div>

                            <div class="term-msg-group">
                                <div class="term-msg-item">
                                    <span style="font-size:10px; color:#3b82f6; font-weight:bold;">Mensaje Titular:</span>
                                    <div style="display:flex; gap:5px;">
                                        <input type="text" id="term-msg-titular" class="term-input" style="width:130px;" value=" ">
                                        <button class="term-btn" id="term-btn-ejecutar-titular" style="border-color:#3b82f6; color:#3b82f6; padding: 4px 8px;" title="Inyectar a Titular">
                                            [> EJECUTAR]
                                        </button>
                                    </div>
                                </div>
                                <div class="term-msg-item">
                                    <span style="font-size:10px; color:#10b981; font-weight:bold;">Mensaje Ref 1:</span>
                                    <div style="display:flex; gap:5px;">
                                        <input type="text" id="term-msg-ref1" class="term-input" style="width:130px;" value=" ">
                                        <button class="term-btn" id="term-btn-ejecutar-ref1" style="border-color:#10b981; color:#10b981; padding: 4px 8px;" title="Inyectar a Referencia 1">
                                            [> EJECUTAR]
                                        </button>
                                    </div>
                                </div>
                                <div class="term-msg-item">
                                    <span style="font-size:10px; color:#f59e0b; font-weight:bold;">Mensaje Ref 2:</span>
                                    <div style="display:flex; gap:5px;">
                                        <input type="text" id="term-msg-ref2" class="term-input" style="width:130px;" value=" ">
                                        <button class="term-btn" id="term-btn-ejecutar-ref2" style="border-color:#f59e0b; color:#f59e0b; padding: 4px 8px;" title="Inyectar a Referencia 2">
                                            [> EJECUTAR]
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="term-table-wrapper">
                                <table class="term-table" id="term-tabla-main">
                                    <thead>
                                        <tr>
                                            <th><input type="checkbox" id="term-check-all" class="term-check"></th>
                                            <th>ID Pedido</th>
                                            <th>Cliente</th>
                                            <th>Teléfono</th>
                                            <th>App</th>
                                            <th>Bandeja</th>
                                            <th>Días Mora</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="term-tbody"></tbody>
                                </table>
                            </div>
                            
                            <div class="term-log" id="term-console">
                                <div class="term-log-line"><span class="term-log-time">[SISTEMA]</span><span class="term-log-msg">Terminal lista. Esperando conexión...</span></div>
                            </div>
                        </div>

                        <div class="term-sidebar">
                            <div class="term-panel" style="border-color:#10b981;">
                                <div class="term-panel-title" style="color:#10b981; border-color:#10b981;">FILTRO POR IDs</div>
                                <div style="padding: 10px;">
                                    <textarea id="term-filtro-ids" class="term-textarea" style="width: 100%; min-height: 80px; overflow: hidden; resize: none; box-sizing: border-box; word-break: break-all; line-height: 1.5; transition: height 0.1s ease-out;" placeholder="Pega varios IDs juntos (ej: 1507420...1507234...)"></textarea>
                                    <div style="font-size:9px; color:#64748b; margin-top:5px; text-align:center;">Se filtrará en tiempo real</div>
                                </div>
                            </div>
                            <div class="term-panel">
                                <div class="term-panel-title">APPS (GENERAL)</div>
                                <div id="term-panel-apps"></div>
                            </div>
                            <div class="term-panel">
                                <div class="term-panel-title">ESTADO DE MORA</div>
                                <div id="term-panel-mora"></div>
                            </div>
                            <div class="term-panel">
                                <div class="term-panel-title">CLIENTES REPETIDOS</div>
                                <div id="term-panel-repetidos"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="term-historial-backdrop" onclick="document.getElementById('term-historial-modal').style.display='none'; this.style.display='none';"></div>
                <div id="term-historial-modal">
                    <div style="display:flex; justify-content:space-between; color:#3b82f6; font-weight:bold; border-bottom:1px solid #1f2937; padding-bottom:10px; margin-bottom:10px;">
                        <span id="term-historial-title">Historial de Seguimientos</span>
                        <span style="cursor:pointer; color:#ef4444; font-size:16px;" onclick="document.getElementById('term-historial-modal').style.display='none'; document.getElementById('term-historial-backdrop').style.display='none';">✖ Cerrar</span>
                    </div>
                    <div id="term-historial-content" style="font-size:12px; color:#e5e7eb;">Cargando...</div>
                </div>

                <div id="term-confirm-backdrop"></div>
                <div id="term-confirm-modal">
                    <div class="term-confirm-title" id="term-confirm-title">[?] CONFIRMAR ACCIÓN</div>
                    <div class="term-confirm-desc" id="term-confirm-desc">¿Estás seguro de continuar?</div>
                    <div class="term-confirm-btns">
                        <button class="term-confirm-btn-rojo" id="term-confirm-cancelar">[X] CANCELAR</button>
                        <button class="term-confirm-btn-verde" id="term-confirm-aceptar">[>] ACEPTAR</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Listeners Generales Terminal
            document.getElementById('term-check-all').addEventListener('change', (e) => {
                document.querySelectorAll('.term-check-row').forEach(cb => cb.checked = e.target.checked);
                this.actualizarContadorSel();
            });

            document.getElementById('term-sel-bandeja').addEventListener('change', () => this.renderizar());
            document.getElementById('term-sel-duplicidad').addEventListener('change', () => this.renderizar());
            document.getElementById('term-sel-mora').addEventListener('change', () => this.renderizar());
            document.getElementById('term-filtro-ids').addEventListener('input', (e) => {
                e.target.style.height = 'auto'; 
                e.target.style.height = (e.target.scrollHeight) + 'px';
                this.renderizar();
            });

            // Listeners Confirmaciones
            document.getElementById('term-btn-ejecutar-titular').addEventListener('click', () => {
                let cant = document.querySelectorAll('.term-check-row:checked').length;
                if(cant === 0) return alert("Selecciona al menos un cliente en la tabla.");
                let msj = document.getElementById('term-msg-titular').value.trim() || "NC LLA";
                this.pedirConfirmacion(
                    `¿Ejecutar masivo a <span style="color:#3b82f6">${cant}</span> clientes seleccionados?<br><br>Destino: Titular<br>Mensaje: <span style="color:#10b981">"${msj}"</span>`, 
                    () => this.iniciarSeguimientoEspecifico('1', 'term-msg-titular', 'Titular')
                );
            });

            document.getElementById('term-btn-ejecutar-ref1').addEventListener('click', () => {
                let cant = document.querySelectorAll('.term-check-row:checked').length;
                if(cant === 0) return alert("Selecciona al menos un cliente en la tabla.");
                let msj = document.getElementById('term-msg-ref1').value.trim() || "NC LLA";
                this.pedirConfirmacion(
                    `¿Ejecutar masivo a <span style="color:#10b981">${cant}</span> clientes seleccionados?<br><br>Destino: Referencia 1<br>Mensaje: <span style="color:#10b981">"${msj}"</span>`, 
                    () => this.iniciarSeguimientoEspecifico('2', 'term-msg-ref1', 'Ref 1')
                );
            });

            document.getElementById('term-btn-ejecutar-ref2').addEventListener('click', () => {
                let cant = document.querySelectorAll('.term-check-row:checked').length;
                if(cant === 0) return alert("Selecciona al menos un cliente en la tabla.");
                let msj = document.getElementById('term-msg-ref2').value.trim() || "NC LLA";
                this.pedirConfirmacion(
                    `¿Ejecutar masivo a <span style="color:#f59e0b">${cant}</span> clientes seleccionados?<br><br>Destino: Referencia 2<br>Mensaje: <span style="color:#10b981">"${msj}"</span>`, 
                    () => this.iniciarSeguimientoEspecifico('3', 'term-msg-ref2', 'Ref 2')
                );
            });

            document.getElementById('term-btn-clic-titular').addEventListener('click', () => {
                let cant = document.querySelectorAll('.term-check-row:checked').length;
                if(cant === 0) return alert("Selecciona al menos un cliente en la tabla.");
                this.pedirConfirmacion(`¿Simular CLIC TITULAR para <span style="color:#0ea5e9">${cant}</span> clientes seleccionados?`, () => this.iniciarClicsTitular());
            });

            document.getElementById('term-btn-clic-refs').addEventListener('click', () => {
                let cant = document.querySelectorAll('.term-check-row:checked').length;
                if(cant === 0) return alert("Selecciona al menos un cliente en la tabla.");
                this.pedirConfirmacion(`¿Simular CLIC A REFERENCIAS para <span style="color:#f59e0b">${cant}</span> clientes seleccionados?`, () => this.iniciarClicsReferencias());
            });
        },

        pedirConfirmacion: function(descripcionHtml, onAceptarCallback) {
            const backdrop = document.getElementById('term-confirm-backdrop');
            const modal = document.getElementById('term-confirm-modal');
            const elDesc = document.getElementById('term-confirm-desc');
            const btnCancelar = document.getElementById('term-confirm-cancelar');
            const btnAceptar = document.getElementById('term-confirm-aceptar');

            elDesc.innerHTML = descripcionHtml;
            backdrop.style.display = 'block';
            modal.style.display = 'block';

            const nuevoBtnCancelar = btnCancelar.cloneNode(true);
            const nuevoBtnAceptar = btnAceptar.cloneNode(true);
            btnCancelar.parentNode.replaceChild(nuevoBtnCancelar, btnCancelar);
            btnAceptar.parentNode.replaceChild(nuevoBtnAceptar, btnAceptar);

            const cerrarModal = () => { backdrop.style.display = 'none'; modal.style.display = 'none'; };
            nuevoBtnCancelar.addEventListener('click', cerrarModal);
            nuevoBtnAceptar.addEventListener('click', () => { cerrarModal(); onAceptarCallback(); });
        },

        log: function(msg, isError = false) {
            const consola = document.getElementById('term-console');
            const time = new Date().toLocaleTimeString('en-US', { hour12: false });
            const cls = isError ? 'term-log-err' : 'term-log-msg';
            consola.innerHTML += `<div class="term-log-line"><span class="term-log-time">[${time}]</span><span class="${cls}">${msg}</span></div>`;
            consola.scrollTop = consola.scrollHeight;
        },

        abrir: async function() {
            document.getElementById('terminal-overlay').style.display = 'block';
            this.extraerToken(); 
            if (!this.token) {
                this.log("Error: No se detectó Token. Inicie sesión.", true);
                return;
            }
            this.log("Conectando al servidor CRM...");
            await this.extraerCartera();
        },

        extraerCartera: async function() {
            this.clientes = [];
            this.log("Extrayendo bandejas 1, 2 y 3. Por favor espere...");
            const headers = this.getHeaders();
            try {
                for (let tipo of [1, 2, 3]) {
                    let res = await fetch(`http://${this.host}:8093/api/case/colCaseList?pageNum=1&pageSize=5000&collection=1&caseType=${tipo}&orderStatus=2`, { method: "GET", headers: headers });
                    let data = await res.json();
                    if (data.data && data.data.items) {
                        let items = data.data.items.map(c => ({...c, _bandejaOriginal: tipo}));
                        this.clientes.push(...items);
                        this.log(`Bandeja ${tipo}: Obtenidos ${items.length} registros.`);
                    }
                }
                this.log(`Extracción completa. Total en cartera: ${this.clientes.length}`);
                this.procesarStats();
                this.renderizar();
            } catch (e) {
                this.log("Error crítico de red al extraer cartera.", true);
            }
        },

        procesarStats: function() {
            let apps = {}, mora = {}, dnise = {};
            this.clientes.forEach(c => {
                let a = c.appName || 'Desconocida';
                let m = c.overdueDays || 0;
                let id = c.userId || c.userName; 
                apps[a] = (apps[a] || 0) + 1;
                mora[m] = (mora[m] || 0) + 1;
                dnise[id] = (dnise[id] || 0) + 1;
            });

            const coloresApp = ["#f59e0b", "#10b981", "#3b82f6", "#c084fc", "#ef4444", "#06b6d4", "#f43f5e", "#8b5cf6", "#84cc16", "#eab308"];
            let htmlApps = '';
            Object.entries(apps).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => {
                let hash = 0;
                for(let i=0; i<k.length; i++) hash += k.charCodeAt(i);
                let colorApp = coloresApp[hash % coloresApp.length];
                htmlApps += `<div class="term-panel-row"><span style="color:${colorApp}; font-weight:bold;">${k}</span><span class="term-val-orange">${v}</span></div>`;
            });
            document.getElementById('term-panel-apps').innerHTML = htmlApps;

            let htmlMora = '';
            Object.entries(mora).sort((a,b)=>a[0]-b[0]).forEach(([k,v]) => htmlMora += `<div class="term-panel-row"><span>${k} días</span><span class="term-val-orange">${v}</span></div>`);
            document.getElementById('term-panel-mora').innerHTML = htmlMora;

            let htmlRep = '';
            Object.entries(dnise).filter(x=>x[1]>1).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => htmlRep += `<div class="term-panel-row"><span>UID: ${String(k).substring(0,8)}...</span><span class="term-val-red">${v} préstamos</span></div>`);
            document.getElementById('term-panel-repetidos').innerHTML = htmlRep || `<div style="padding:10px; font-size:10px; color:#6b7280;">No hay duplicados</div>`;
            
            this.clientes.forEach(c => { c._esDuplicado = dnise[c.userId || c.userName] > 1; });
        },

        renderizar: function() {
            let filtroBandeja = document.getElementById('term-sel-bandeja').value;
            let filtroDuplicidad = document.getElementById('term-sel-duplicidad').value;
            let filtroMora = document.getElementById('term-sel-mora').value;
            let filtroIdsRaw = document.getElementById('term-filtro-ids').value;

            let idsFiltrar = [];
            if (filtroIdsRaw.trim() !== '') {
                let matches = filtroIdsRaw.match(/\d{15,20}/g);
                if (matches) idsFiltrar = matches;
            }

            this.clientesFiltrados = this.clientes.filter(c => {
                let pasaBandeja = (filtroBandeja === 'ALL') || (String(c._bandejaOriginal) === filtroBandeja);
                let pasaDuplicidad = true;
                if (filtroDuplicidad === 'UNIQUE') pasaDuplicidad = !c._esDuplicado;
                if (filtroDuplicidad === 'DUPLICATE') pasaDuplicidad = c._esDuplicado;

                let pasaMora = true;
                if (filtroMora !== 'ALL') {
                    if (filtroMora === '8+') pasaMora = c.overdueDays >= 8;
                    else pasaMora = String(c.overdueDays) === filtroMora;
                }
                
                let pasaIds = true;
                if (idsFiltrar.length > 0) {
                    pasaIds = idsFiltrar.includes(String(c.loanId)) || idsFiltrar.includes(String(c.caseNo));
                }

                return pasaBandeja && pasaDuplicidad && pasaMora && pasaIds;
            });

            this.clientesFiltrados.sort((a, b) => {
                if (a._esDuplicado && !b._esDuplicado) return -1;
                if (!a._esDuplicado && b._esDuplicado) return 1;  
                let nombreA = (a.userName || "").toUpperCase();
                let nombreB = (b.userName || "").toUpperCase();
                if (nombreA < nombreB) return -1;
                if (nombreA > nombreB) return 1;
                return 0;
            });

            let tbody = document.getElementById('term-tbody');
            tbody.innerHTML = '';
            
            const coloresApp = ["#f59e0b", "#10b981", "#3b82f6", "#c084fc", "#ef4444", "#06b6d4", "#f43f5e", "#8b5cf6", "#84cc16", "#eab308"];

            this.clientesFiltrados.forEach((c, idx) => {
                let lblBandeja = c._bandejaOriginal === 1 ? 'No Seguido' : c._bandejaOriginal === 2 ? 'Seguido' : 'Crítico';
                let safeName = (c.userName || "Cliente").replace(/'/g, "").replace(/"/g, "").replace(/`/g, "");

                let appName = c.appName || "Desconocida";
                let hash = 0;
                for(let i=0; i<appName.length; i++) hash += appName.charCodeAt(i);
                let colorDinamicoApp = coloresApp[hash % coloresApp.length];

                let tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="term-check term-check-row" data-idx="${idx}" checked></td>
                    <td style="color:#60a5fa">${c.loanId || c.caseNo}</td>
                    <td>${c.userName} ${c._esDuplicado ? '<span style="color:#ef4444; font-size:10px; font-weight:bold;">[Multi]</span>' : ''}</td>
                    <td>${c.phoneNumber}</td>
                    <td style="color:${colorDinamicoApp}; font-weight:bold;">${appName}</td>
                    <td>${lblBandeja}</td>
                    <td>${c.overdueDays}</td>
                    <td><button class="term-btn btn-historial" data-id="${c.id || c.caseNo}" data-name="${safeName}" style="padding:4px 8px; font-size:10px; background:#1e3a8a; border-color:#3b82f6;">Historial</button></td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.term-check-row').forEach(cb => cb.addEventListener('change', () => this.actualizarContadorSel()));
            
            document.querySelectorAll('.btn-historial').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    let id = e.target.getAttribute('data-id');
                    let nombre = e.target.getAttribute('data-name');
                    this.mostrarHistorial(id, nombre);
                });
            });

            this.actualizarContadorSel();
        },

        actualizarContadorSel: function() {
            let selectedCount = document.querySelectorAll('.term-check-row:checked').length;
            document.querySelectorAll('.lbl-count-sel').forEach(el => el.innerText = `(${selectedCount})`);
        },

        mostrarHistorial: async function(caseId, nombre) {
            const modal = document.getElementById('term-historial-modal');
            const backdrop = document.getElementById('term-historial-backdrop');
            const content = document.getElementById('term-historial-content');
            const title = document.getElementById('term-historial-title');
            
            title.innerText = `Historial: ${nombre}`;
            backdrop.style.display = 'block';
            modal.style.display = 'block';
            content.innerHTML = `<div style="text-align:center; padding: 20px; color:#10b981; font-family:monospace;">🔍 Consultando historial en el servidor...</div>`;

            const token = localStorage.getItem("token");
            if (!token) return content.innerHTML = `<div style="color:#ef4444; text-align:center; padding:20px; font-family:monospace;">❌ Error: No se encontró el token.</div>`;

            try {
                const response = await fetch(`http://${this.host}:8093/api/case/colRecord/${caseId}/list`, {
                    method: "GET", headers: { "accept": "application/json;charset=UTF-8", "authorization": token, "content-type": "application/json;charset=UTF-8" }
                });

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                const data = await response.json();
                
                let registros = data.data || data;
                if (!Array.isArray(registros) && data.items) registros = data.items;
                if (!Array.isArray(registros) && data.data && data.data.items) registros = data.data.items;

                if (!Array.isArray(registros) || registros.length === 0) {
                    content.innerHTML = `<div style="color:#f59e0b; text-align:center; padding:20px; font-family:monospace;">⚠️ Este cliente no tiene seguimientos.</div>`;
                    return;
                }

                let html = `<table style="width:100%; border-collapse:collapse; font-size:12px; font-family:monospace;">
                            <tr style="border-bottom:1px solid #10b981; color:#10b981; text-align:left;">
                                <th style="padding:8px;">📅 Fecha</th>
                                <th style="padding:8px;">🎯 Destino</th>
                                <th style="padding:8px;">💬 Mensaje</th>
                                <th style="padding:8px;">👤 Op</th>
                            </tr>`;
                
                registros.forEach(r => {
                    let fechaRaw = r.createTime || r.updateTime;
                    let fechaFormateada = "-";
                    if (fechaRaw) {
                        let d = new Date(fechaRaw);
                        if (!isNaN(d.getTime())) {
                            fechaFormateada = d.toLocaleString('es-BO', { 
                                timeZone: 'America/La_Paz', day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true 
                            });
                        } else { fechaFormateada = fechaRaw; }
                    }

                    let remark = r.colRemark || r.remark || "-"; 
                    let operador = r.createBy || r.updateBy || "-"; 
                    
                    let destino = "Otro"; let colorDest = "#e5e7eb";
                    if (r.contactPerson == 1) { destino = "Titular"; colorDest = "#3b82f6"; }
                    if (r.contactPerson == 2) { destino = "Ref 1"; colorDest = "#10b981"; }
                    if (r.contactPerson == 3) { destino = "Ref 2"; colorDest = "#f59e0b"; }
                    
                    html += `
                        <tr style="border-bottom:1px solid #1f2937; transition: background 0.2s;">
                            <td style="padding:8px; color:#60a5fa;">${fechaFormateada}</td>
                            <td style="padding:8px; color:${colorDest}; font-weight:bold;">${destino}</td>
                            <td style="padding:8px; color:#10b981; font-weight:bold;">${remark}</td>
                            <td style="padding:8px; color:#9ca3af;">${operador}</td>
                        </tr>
                    `;
                });
                html += `</table>`;
                content.innerHTML = html;

            } catch (error) {
                content.innerHTML = `<div style="color:#ef4444; text-align:center; padding:20px; font-family:monospace;">❌ Error al obtener el historial:<br>${error.message}</div>`;
            }
        },

        iniciarClicsTitular: async function() {
            let seleccionadosIdx = Array.from(document.querySelectorAll('.term-check-row:checked')).map(cb => cb.getAttribute('data-idx'));
            const urlPost = `http://${this.host}:8093/api/event/click/record`;
            const headers = this.getHeaders();
            let totalExito = 0, totalError = 0;

            this.log(`📱 SIMULANDO CLIC TITULAR PARA ${seleccionadosIdx.length} CLIENTES...`);

            for (let idx of seleccionadosIdx) {
                let c = this.clientesFiltrados[idx];
                const payloadTitular = {
                    button: "CopyPhone", appOrderId: c.loanId, installmentId: String(c.planId),
                    appOrderDetail: {
                        caseId: String(c.id || ""), userId: String(c.userId || ""), caseNo: c.caseNo || "", appOrderId: c.loanId, loanId: c.loanId, planId: String(c.planId),
                        productName: c.productName || "Dinero Ya", ticketStatus: String(c.ticketStatus || "2"), billStatus: String(c.billStatus || "1"), userName: c.userName || "SIN NOMBRE",
                        phoneNumber: c.phoneNumber || "", repaymentAmount: c.repaymentAmount || 0, repaidAmount: c.repaidAmount || 0, repaymentOverdueInterest: c.repaymentOverdueInterest || 0,
                        dueDate: c.dueDate || null, overdueDays: c.overdueDays || 0, caseLevel: String(c.caseLevel || "3"), groupName: c.groupName || "S0", assignTime: c.assignTime || null, closeTime: null,
                        collectorNickname: c.collectorNickname || "", acqChannel: c.acqChannel || "PEFL", appName: c.appName || "", areaCode: c.areaCode || "51", collType: null,
                        customerLevel: c.customerLevel || 6, colRecords: String(c.colRecords || "11"), tryRepaymentCount: 0
                    }
                };

                try {
                    let r1 = await fetch(urlPost, { method: "POST", mode: "cors", credentials: "include", headers: headers, body: JSON.stringify(payloadTitular) });
                    if(r1.ok) { totalExito++; this.log(`✔️ [${c.userName}] Clic Titular inyectado`); } else { totalError++; }
                } catch (error) { totalError++; this.log(`❌ [${c.userName}] Error clic titular.`, true); }
                await new Promise(r => setTimeout(r, 200)); 
            }
            this.log(`✅ CLIC TITULAR FINALIZADO. Exitosas: ${totalExito} | Fallidas: ${totalError}`);
        },

        iniciarClicsReferencias: async function() {
            let seleccionadosIdx = Array.from(document.querySelectorAll('.term-check-row:checked')).map(cb => cb.getAttribute('data-idx'));
            const urlPost = `http://${this.host}:8093/api/event/click/record`;
            const headers = this.getHeaders();
            let totalExito = 0, totalError = 0;

            this.log(`📱 SIMULANDO CLICS A REFERENCIAS PARA ${seleccionadosIdx.length} CLIENTES...`);

            for (let idx of seleccionadosIdx) {
                let c = this.clientesFiltrados[idx];
                const payloadRef = {
                    button: "CopyContactPhone", appOrderId: c.loanId, installmentId: String(c.planId),
                    appOrderDetail: {
                        taskId: null, loanId: c.loanId, planId: String(c.planId), orderSystem: "PEFL", productName: c.productName || "Rápido Crédito", billStatus: null,
                        loanAmount: c.repaymentAmount || 0, applicationDate: c.applicationDate || null, receiptAmount: 0, installmentAmount: c.repaymentAmount || 0, outstandingAmount: c.repaymentAmount || 0,
                        repaidAmount: 0, overdueInterest: c.repaymentOverdueInterest || 0, disbursedDate: c.disbursedDate || null, dueDate: c.dueDate || null, billSettlementDate: null,
                        overdueDays: c.overdueDays || 0, disburseAccountName: null, bankAccountNumber: null, extensionCount: 0, customerLevel: 1, payerName: null, payerAccount: null, payerBank: null,
                        payeeName: c.userName || "SIN NOMBRE", payeeAccount: "", payeeBank: "" 
                    }
                };
                const fetchOptions = { method: "POST", mode: "cors", credentials: "include", headers: headers, body: JSON.stringify(payloadRef) };

                try {
                    let r1 = await fetch(urlPost, fetchOptions);
                    if(r1.ok) totalExito++; else totalError++;
                    await new Promise(r => setTimeout(r, 200));

                    let r2 = await fetch(urlPost, fetchOptions);
                    if(r2.ok) { totalExito++; this.log(`✔️ [${c.userName}] Doble Clic a Referencias inyectado`); } else { totalError++; }
                } catch (error) { totalError += 2; this.log(`❌ [${c.userName}] Error clics referencias.`, true); }
                await new Promise(r => setTimeout(r, 300)); 
            }
            this.log(`✅ CLICS REFERENCIAS FINALIZADO. Exitosas: ${totalExito} | Fallidas: ${totalError}`);
        },

        iniciarSeguimientoEspecifico: async function(destinoId, inputId, nombreDestino) {
            let seleccionadosIdx = Array.from(document.querySelectorAll('.term-check-row:checked')).map(cb => cb.getAttribute('data-idx'));
            let mensajeFinal = document.getElementById(inputId).value.trim() || "NC LLA";
            let fechaHoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' }); 
            const headers = this.getHeaders();
            let totalEnviados = 0, totalSaltados = 0;

            this.log(`🚀 INICIANDO SEGUIMIENTOS A ${seleccionadosIdx.length} CLIENTES... Destino: ${nombreDestino}`);

            for (let idx of seleccionadosIdx) {
                let c = this.clientesFiltrados[idx];
                let histText = "";

                try {
                    let resH = await fetch(`http://${this.host}:8093/api/case/colRecord/${c.caseNo}/list`, { method: "GET", headers: headers });
                    histText = await resH.text();
                } catch(e) {}

                if (histText.includes(mensajeFinal) && histText.includes(fechaHoy) && (histText.includes(`"contactPerson":"${destinoId}"`) || histText.includes(`"contactPerson":${destinoId}`))) {
                    this.log(`⏭️ [${c.userName} - ${nombreDestino}] Saltado (Ya existe hoy)`);
                    totalSaltados++;
                    continue;
                }

                const payload = { caseNo: c.caseNo, contactPerson: destinoId, contactMethod: "1", contactResult: "2", colResult: "11", remark: mensajeFinal, imageUrl: "" };
                
                try {
                    let resP = await fetch(`http://${this.host}:8093/api/case/editColRecord`, { method: "POST", headers: headers, body: JSON.stringify(payload) });
                    if(resP.ok) { this.log(`✔️ [${c.userName} - ${nombreDestino}] Mensaje: "${mensajeFinal}" inyectado.`); totalEnviados++; }
                } catch(e) { this.log(`❌ [${c.userName}] Error de red.`, true); }
                await new Promise(r => setTimeout(r, 250)); 
            }
            this.log(`✅ RÁFAGA FINALIZADA (${nombreDestino}). Enviados: ${totalEnviados} | Evitados: ${totalSaltados}`);
        }
    };


    // ==========================================
    // ⚙️ LÓGICA DEL PANEL RADAR
    // ==========================================

    function extraerUsuarioNativo() {
        let nombreExtraido = null;
        try {
            let localData = localStorage.getItem('userInfo');
            if (localData) {
                let parsedLocal = JSON.parse(localData);
                if (parsedLocal && parsedLocal.data && parsedLocal.data.userName) nombreExtraido = parsedLocal.data.userName;
                else if (parsedLocal && parsedLocal.userName) nombreExtraido = parsedLocal.userName;
            }
        } catch (e) {}

        if (!nombreExtraido) {
            try {
                let sessionData = sessionStorage.getItem('sessionObj-AC');
                if (sessionData) {
                    let parsedSession = JSON.parse(sessionData);
                    if (parsedSession && parsedSession.data && parsedSession.data.username) nombreExtraido = parsedSession.data.username;
                    else if (parsedSession && parsedSession.username) nombreExtraido = parsedSession.username;
                }
            } catch (e) {}
        }
        return nombreExtraido ? String(nombreExtraido).trim() : null;
    }

    const getLoggedUser = () => localStorage.getItem('usuarioLogueado');

    function showNotification(message, duration = 3000, type = 'info') {
        document.querySelectorAll('.addon-aviso-temp').forEach(el => el.remove());
        const toast = document.createElement('div');
        toast.className = 'addon-aviso-temp';
        
        let icon = 'ℹ️'; let accentColor = '#3b82f6'; 
        if (type === 'success' || message.includes('✅')) { icon = '✅'; accentColor = '#10b981'; } 
        else if (type === 'error' || message.includes('❌')) { icon = '⛔'; accentColor = '#ef4444'; } 
        else if (type === 'warning' || message.includes('⚠️') || message.includes('⏸️')) { icon = '⚠️'; accentColor = '#f59e0b'; }

        toast.innerHTML = `<span style="font-size:16px; margin-right:10px;">${icon}</span><span style="font-weight:600; font-size:13px; color: #ffffff; letter-spacing: 0.5px;">${message}</span>`;

        Object.assign(toast.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
            padding: '12px 24px', backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#ffffff',
            borderRadius: '30px', zIndex: '2147483640', boxShadow: `0 4px 15px rgba(0,0,0,0.2)`, 
            border: `1px solid ${accentColor}`, display: 'flex', alignItems: 'center', 
            fontFamily: "'Segoe UI', sans-serif", pointerEvents: 'none'
        });
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, duration);
    }

    const animarBotonLight = (btn, themeConfig) => {
        Object.assign(btn.style, { 
            backgroundColor: themeConfig.bg, color: themeConfig.text, border: themeConfig.border, 
            transform: 'scale(1)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' 
        });
        
        btn.onmouseenter = () => { 
            if (!btn.disabled) Object.assign(btn.style, { backgroundColor: themeConfig.hBg, color: themeConfig.hText, border: themeConfig.hBorder, transform: 'translateY(-2px)' }); 
        };
        btn.onmouseleave = () => { 
            if (!btn.disabled) Object.assign(btn.style, { backgroundColor: themeConfig.bg, color: themeConfig.text, border: themeConfig.border, transform: 'scale(1)' }); 
        };
        btn.onmousedown = () => { if (!btn.disabled) btn.style.transform = 'scale(0.95)'; };
        btn.onmouseup = () => { if (!btn.disabled) btn.style.transform = 'translateY(-2px)'; }; 
    };

    function buildPanel() {
        const urlActual = window.location.href;
        const origen = window.location.origin;
        if (urlActual !== (origen + '/collection/#/') && urlActual !== (origen + '/collection/#')) {
            const existingPanel = document.querySelector('.addon-panel-independent');
            if (existingPanel) existingPanel.remove();
            return;
        }

        if (document.querySelector('.addon-panel-independent')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'addon-panel-independent';
        Object.assign(wrapper.style, {
            position: 'fixed', left: '15px', top: '15px', 
            zIndex: '2147483640', display: 'flex', flexDirection: 'column', 
            alignItems: 'flex-start', pointerEvents: 'none', 
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        });

        const toggleBtn = document.createElement('div');
        Object.assign(toggleBtn.style, {
            width: '45px', height: '45px', backgroundColor: '#ffffff', color: '#1e293b', 
            borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer', fontSize: '22px', fontWeight: 'bold', transition: 'all 0.3s',
            border: '1px solid #cbd5e1', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', pointerEvents: 'auto'
        });
        toggleBtn.innerHTML = '☰'; toggleBtn.title = "Panel de Control";
        toggleBtn.onmouseenter = () => { toggleBtn.style.color = '#3b82f6'; toggleBtn.style.borderColor = '#3b82f6'; toggleBtn.style.transform = 'scale(1.05)'; };
        toggleBtn.onmouseleave = () => { toggleBtn.style.color = '#1e293b'; toggleBtn.style.borderColor = '#cbd5e1'; toggleBtn.style.transform = 'scale(1)'; };

        const menuContent = document.createElement('div');
        Object.assign(menuContent.style, {
            pointerEvents: 'auto', backgroundColor: '#ffffff', padding: '15px', borderRadius: '14px', 
            display: 'none', flexDirection: 'column', gap: '8px', width: '260px', border: '1px solid #cbd5e1',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15)', position: 'relative', marginTop: '10px', transformOrigin: 'top left' 
        });

        const hidePanel = () => { menuContent.style.display = 'none'; toggleBtn.style.display = 'flex'; };

        toggleBtn.onclick = () => {
            toggleBtn.style.display = 'none';
            menuContent.style.display = 'flex';
            menuContent.style.opacity = '0';
            menuContent.style.transform = 'scale(0.9) translateY(-10px)';
            setTimeout(() => {
                menuContent.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                menuContent.style.opacity = '1';
                menuContent.style.transform = 'scale(1) translateY(0)';
            }, 10);
        };

        const minimizeBtn = document.createElement('div');
        minimizeBtn.innerHTML = '×';
        Object.assign(minimizeBtn.style, {
            position: 'absolute', top: '10px', right: '10px', width: '24px', height: '24px', borderRadius: '50%',
            background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: 'all 0.2s ease'
        });
        minimizeBtn.onmouseenter = () => { minimizeBtn.style.background = '#fee2e2'; minimizeBtn.style.color = '#ef4444'; minimizeBtn.style.transform = 'scale(1.1)'; };
        minimizeBtn.onmouseleave = () => { minimizeBtn.style.background = '#f1f5f9'; minimizeBtn.style.color = '#64748b'; minimizeBtn.style.transform = 'scale(1)'; };
        minimizeBtn.onclick = hidePanel;

        const headerContent = document.createElement('div');
        headerContent.innerHTML = `
            <div style="margin-bottom: 5px; margin-top: 2px;">
                <div style="color:#1e293b; font-size:15px; font-weight:800; letter-spacing:1px; text-transform:uppercase; text-align: center;">
                    PANEL DE CONTROL
                </div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 15px; font-size:11px; color:#64748b; margin-top:8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 9px; opacity: 0.8; font-weight:600;">CUENTA CRM</div>
                        <div id="lbl-cuenta-crm" style="font-weight:700; font-size: 13px; color:#d97706;">---</div>
                    </div>
                    <div style="width: 1px; height: 20px; background: #e2e8f0;"></div>
                    <div style="text-align: center;">
                        <div style="font-size: 9px; opacity: 0.8; font-weight:600;">SESIÓN ACTIVA</div>
                        <div id="lbl-usuario-addon" style="font-weight:700; font-size: 13px; color:#059669;">---</div>
                    </div>
                </div>
                <div style="width: 100%; height: 1px; background: #e2e8f0; margin: 12px 0;"></div>
            </div>
        `;
        menuContent.append(minimizeBtn, headerContent);

        // 🔥 CONTENEDOR GRID PARA BOTONES HOJA Y TERMINAL
        const topButtonsContainer = document.createElement('div');
        Object.assign(topButtonsContainer.style, {
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%', marginBottom: '5px'
        });

        // --- BOTÓN 1: "ABRIR MI HOJA" ---
        const btnOpenSheet = document.createElement('button');
        btnOpenSheet.innerText = '📂 MI HOJA';
        Object.assign(btnOpenSheet.style, {
            padding: '9px 5px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '800', fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center'
        });
        animarBotonLight(btnOpenSheet, btnThemes.blue); 
        btnOpenSheet.onclick = async () => {
            hidePanel(); 
            const user = extraerUsuarioNativo() || getLoggedUser();
            if (!user) return showNotification('❌ Falta Usuario', 3000, 'error');
            showNotification('🔍 Buscando hoja...', 2000);
            try {
                const response = await fetch(`${API_URL}?token=${SECURITY_TOKEN}&usuario=${user}`);
                const data = await response.json();
                if (data.id) window.open('https://docs.google.com/spreadsheets/d/' + data.id + '/edit', '_blank');
                else showNotification('❌ Sin hoja asignada', 3000, 'error');
            } catch (err) { showNotification('⚠️ Error conexión', 3000, 'warning'); }
        };

        // --- BOTÓN 2: "TERMINAL" (INTEGRACIÓN) ---
        const btnTerminal = document.createElement('button');
        btnTerminal.innerText = '💻 TERMINAL';
        Object.assign(btnTerminal.style, {
            padding: '9px 5px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '800', fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center'
        });
        animarBotonLight(btnTerminal, btnThemes.emerald); 
        btnTerminal.onclick = () => {
            hidePanel(); 
            TerminalApp.abrir(); // Dispara la apertura del overlay
        };

        topButtonsContainer.append(btnOpenSheet, btnTerminal);
        menuContent.appendChild(topButtonsContainer);

        // --- SECCIÓN AUTO PING ---
        const pingContainer = document.createElement('div');
        Object.assign(pingContainer.style, { display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' });

        const gridPingTop = document.createElement('div');
        Object.assign(gridPingTop.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' });
        
        const gridPingBottom = document.createElement('div');
        Object.assign(gridPingBottom.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' });

        const createActionBtnLight = (text, themeConfig, clickAction) => {
            const btn = document.createElement('button');
            btn.innerText = text;
            btn.onclick = () => clickAction(btn); 
            Object.assign(btn.style, {
                padding: '9px 5px', width: '100%', fontSize: '11px', borderRadius: '8px', cursor: 'pointer', 
                fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center'
            });
            animarBotonLight(btn, themeConfig);
            return btn;
        };

        let btnPingStart, btnPingAbajo, btnPingPause, btnPingRestart;

        async function processPingQueue() {
            while (isPinging) {
                if (isPaused) {
                    const activeBtn = (pingDirection === 'top') ? btnPingStart : btnPingAbajo;
                    activeBtn.innerHTML = 'Continuar ▶️';
                    activeBtn.disabled = false; activeBtn.style.opacity = '1'; activeBtn.style.cursor = 'pointer';
                    btnPingPause.disabled = true; btnPingPause.style.opacity = '0.5'; btnPingPause.style.cursor = 'not-allowed';
                    showNotification('⏸️ Auto Ping Pausado', 2000, 'warning');
                    return; 
                }

                let unclicked = Array.from(document.querySelectorAll('.uniui-wallet:not(.sst-pinged)'));
                
                if (unclicked.length === 0) {
                    showNotification(`✅ Completado: ${pingCount} pings enviados`, 4000, 'success');
                    resetPingUI();
                    break;
                }

                let targetIcon = (pingDirection === 'bottom') ? unclicked[unclicked.length - 1] : unclicked[0];
                let container = targetIcon.closest('uni-view') || targetIcon;
                
                container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                container.style.border = '1px solid #10b981'; 
                container.style.borderRadius = '4px';
                
                targetIcon.click();
                targetIcon.classList.add('sst-pinged');
                
                if (targetIcon.parentElement) {
                    targetIcon.parentElement.style.setProperty('color', '#10b981', 'important');
                    targetIcon.parentElement.style.setProperty('font-weight', 'bold', 'important');
                }
                targetIcon.style.setProperty('color', '#10b981', 'important');
                
                pingCount++;
                const activeBtn = (pingDirection === 'top') ? btnPingStart : btnPingAbajo;
                activeBtn.innerHTML = `⚡ ${pingCount} envíos`;
                
                await new Promise(r => setTimeout(r, 1500)); 
                container.style.border = 'none';
            }
        }

        function resetPingUI() {
            isPinging = false;
            isPaused = false;
            pingCount = 0;
            
            btnPingStart.innerHTML = 'Ping Arriba ⚡';
            btnPingStart.disabled = false; btnPingStart.style.opacity = '1'; btnPingStart.style.cursor = 'pointer';
            
            btnPingAbajo.innerHTML = 'Ping Abajo 👇';
            btnPingAbajo.disabled = false; btnPingAbajo.style.opacity = '1'; btnPingAbajo.style.cursor = 'pointer';

            btnPingPause.disabled = true; btnPingPause.style.opacity = '0.5'; btnPingPause.style.cursor = 'not-allowed';
        }

        btnPingStart = createActionBtnLight('Ping Arriba ⚡', btnThemes.purple, (btn) => {
            if (!isPinging || (isPinging && isPaused)) {
                pingDirection = 'top';
                isPinging = true; isPaused = false;
                btn.disabled = true; btn.style.opacity = '0.7'; btn.style.cursor = 'not-allowed';
                btnPingAbajo.disabled = true; btnPingAbajo.style.opacity = '0.5'; btnPingAbajo.style.cursor = 'not-allowed';
                btnPingPause.disabled = false; btnPingPause.style.opacity = '1'; btnPingPause.style.cursor = 'pointer';
                processPingQueue();
            }
        });

        btnPingPause = createActionBtnLight('Pausar ⏸️', btnThemes.red, () => {
            if (isPinging && !isPaused) isPaused = true;
        });

        btnPingRestart = createActionBtnLight('Reiniciar 🔄', btnThemes.orange, () => {
            document.querySelectorAll('.sst-pinged').forEach(el => {
                el.classList.remove('sst-pinged');
                el.style.color = '';
                if (el.parentElement) {
                    el.parentElement.style.color = '';
                    el.parentElement.style.fontWeight = '';
                }
            });
            resetPingUI();
            showNotification('🔄 Pings reseteados', 2000, 'info');
        });

        btnPingAbajo = createActionBtnLight('Ping Abajo 👇', btnThemes.indigo, (btn) => {
             if (!isPinging || (isPinging && isPaused)) {
                pingDirection = 'bottom';
                isPinging = true; isPaused = false;
                btn.disabled = true; btn.style.opacity = '0.7'; btn.style.cursor = 'not-allowed';
                btnPingStart.disabled = true; btnPingStart.style.opacity = '0.5'; btnPingStart.style.cursor = 'not-allowed';
                btnPingPause.disabled = false; btnPingPause.style.opacity = '1'; btnPingPause.style.cursor = 'pointer';
                processPingQueue();
            }
        });

        btnPingPause.disabled = true; btnPingPause.style.opacity = '0.5'; btnPingPause.style.cursor = 'not-allowed';

        gridPingTop.append(btnPingStart, btnPingPause);
        gridPingBottom.append(btnPingRestart, btnPingAbajo);
        pingContainer.append(gridPingTop, gridPingBottom);
        menuContent.appendChild(pingContainer);

        wrapper.append(toggleBtn, menuContent);
        document.body.appendChild(wrapper);
    }

    // ==========================================
    // 🚀 INICIALIZACIÓN GLOBAL
    // ==========================================

    setInterval(() => {
        const lblCuenta = document.getElementById('lbl-cuenta-crm');
        const lblUsuario = document.getElementById('lbl-usuario-addon');

        if (lblCuenta) {
            const cuentaNativa = extraerUsuarioNativo();
            lblCuenta.innerText = cuentaNativa ? cuentaNativa : 'N/A';
        }
        if (lblUsuario) {
            const userAddon = getLoggedUser();
            lblUsuario.innerText = userAddon ? userAddon : 'N/A';
        }
    }, 1000);

    const initAll = () => {
        buildPanel();
        TerminalApp.init(); // Inicializa el DOM de la terminal en el fondo
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    let currentUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            buildPanel(); 
        }
    }).observe(document, { subtree: true, childList: true });

})();
