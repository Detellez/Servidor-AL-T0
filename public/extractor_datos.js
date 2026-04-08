(function() {
    'use strict';

    // 🔥 RESTRICCIÓN DE DOMINIO 🔥
    if (!window.location.href.includes('182.160.25.147')) {
        console.warn("Este script solo está autorizado para el dominio 182.160.25.147");
        return;
    }

    // --- ESTILOS CSS GLOBALES ---
    const inyectarEstilos = () => {
        if (document.getElementById('estilos-rafaga')) return;
        const style = document.createElement('style');
        style.id = 'estilos-rafaga';
        style.innerHTML = `
            #tabla-container-rafaga::-webkit-scrollbar { height: 10px; width: 10px; }
            #tabla-container-rafaga::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.7); border-radius: 8px; margin: 4px; }
            #tabla-container-rafaga::-webkit-scrollbar-thumb { background: #475569; border-radius: 8px; border: 2px solid rgba(15, 23, 42, 1); }
            #tabla-container-rafaga::-webkit-scrollbar-thumb:hover { background: #64748b; }
            .fila-rafaga:hover { background-color: rgba(51, 65, 85, 0.7); transition: background-color 0.2s; }
            
            .btn-rafaga { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: bold; padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; }
            .btn-rafaga:active { transform: scale(0.95) !important; }
            .btn-rafaga:disabled { opacity: 0.6; cursor: wait; transform: none !important; box-shadow: none !important; }

            .btn-red { background: #ef4444; color: white; }
            .btn-blue { background: #3b82f6; color: white; }
            .btn-green { background: #34d399; color: black; }
            
            .correo-celda { padding: 3px 6px; border-radius: 4px; display: inline-block; min-width: 60px; font-weight: bold; }
            .correo-alerta { background-color: #f97316 !important; color: white !important; }
            .correo-valido { color: #93c5fd; }
            
            #rafaga-tooltip {
                position: fixed; pointer-events: none; z-index: 2147483647;
                background: rgba(15, 23, 42, 0.95); border: 1px solid #8b5cf6;
                border-radius: 8px; padding: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(139, 92, 246, 0.4);
                backdrop-filter: blur(10px); display: none; max-width: 320px;
                color: #cbd5e1; font-family: system-ui, sans-serif; font-size: 12px;
            }
            #rafaga-tooltip img { max-width: 280px; max-height: 280px; border-radius: 6px; border: 1px solid #475569; }
            .celda-hover-info { text-decoration: underline dashed #a78bfa; text-underline-offset: 4px; cursor: help; }
        `;
        document.head.appendChild(style);
    };

    // --- UTILS ---
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const mostrarAviso = (texto, color = '#60a5fa', tipo = 'info', tiempo = 2000) => {
        if (!document.body) return;
        document.querySelectorAll('.addon-aviso-temp').forEach(e => e.remove());
        const div = document.createElement('div');
        div.className = 'addon-aviso-temp';
        let icono = tipo === 'success' ? '✅' : tipo === 'error' ? '⛔' : 'ℹ️';
        if(tipo==='success') color='#34d399'; if(tipo==='error') color='#f87171';
        
        div.innerHTML = `<span style="font-size:15px; margin-right:8px;">${icono}</span><span style="font-weight:600; font-size:13px;">${texto}</span>`;
        Object.assign(div.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', 
            backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff', borderRadius: '30px', 
            zIndex: 2147483645, borderLeft: `3px solid ${color}`, backdropFilter: 'blur(10px)'
        });
        document.body.appendChild(div);
        setTimeout(() => div.remove(), tiempo); 
    };

    const blindarElemento = (el) => {
        if (!el) return;
        ['mousedown', 'mouseup', 'click', 'keydown', 'keyup', 'keypress'].forEach(evt => {
            el.addEventListener(evt, (e) => e.stopPropagation());
        });
    };

    // ==========================================
    // 🚀 NUESTRO MOTOR DE EXTRACCIÓN (3 PUERTAS)
    // ==========================================
    async function iniciarExtraccionAPI() {
        const inputToken = document.getElementById('input-token-api');
        if (!inputToken || !inputToken.value.trim()) return mostrarAviso('⚠️ Por favor, pega el Token primero', '#fbbf24', 'warning');
        
        let token = inputToken.value.trim();
        if (!token.toLowerCase().startsWith('bearer ')) {
            token = "Bearer " + token;
        }

        const btnExtraer = document.getElementById('btn-extraer-todo');
        if (btnExtraer) { btnExtraer.disabled = true; btnExtraer.innerText = '⏳ Extrayendo...'; }

        const headers = {
            "accept": "application/json;charset=UTF-8",
            "accept-language": "es-419,es;q=0.6",
            "authorization": token,
            "content-type": "application/json;charset=UTF-8",
            "sec-gpc": "1"
        };

        let todosLosClientes = [];
        let baseDeDatosFinal = [];
        const tiposDeCaso = [1, 2];

        try {
            for (let tipo of tiposDeCaso) {
                mostrarAviso(`Buscando bandeja ${tipo}...`, '#3b82f6', 'info');
                let urlPuerta1 = `http://182.160.25.147:8093/api/case/colCaseList?pageNum=1&pageSize=5000&collection=1&caseType=${tipo}&orderStatus=2`;
                let res = await fetch(urlPuerta1, { method: "GET", headers: headers });
                let data = await res.json();
                if (data.data && data.data.items) {
                    todosLosClientes.push(...data.data.items);
                }
                await sleep(500); 
            }

            if (todosLosClientes.length === 0) {
                mostrarAviso('No se encontraron clientes o el token expiró', '#fbbf24', 'warning');
                if (btnExtraer) { btnExtraer.disabled = false; btnExtraer.innerText = '⚡Extraer Todo⚡'; }
                return;
            }

            const TAMANO_PAQUETE = 15;
            for (let i = 0; i < todosLosClientes.length; i += TAMANO_PAQUETE) {
                const paquete = todosLosClientes.slice(i, i + TAMANO_PAQUETE);
                
                if (btnExtraer) btnExtraer.innerText = `⏳ Detalles ${Math.min(i + TAMANO_PAQUETE, todosLosClientes.length)}/${todosLosClientes.length}...`;

                const promesasPaquete = paquete.map(async (cliente) => {
                    let urlPuerta2 = `http://182.160.25.147:8093/api/case/details?userId=${cliente.userId}&acqChannel=${cliente.acqChannel}&caseNo=${cliente.caseNo}`;
                    let urlPuerta3 = `http://182.160.25.147:8093/api/case/applyExtension/${cliente.caseNo}`;

                    try {
                        let [resDetalle, resProrroga] = await Promise.all([
                            fetch(urlPuerta2, { method: "GET", headers: headers }),
                            fetch(urlPuerta3, { method: "GET", headers: headers })
                        ]);

                        let dataDetalle = await resDetalle.json();
                        let dataProrroga = await resProrroga.json();

                        if (dataDetalle.data) {
                            let p2 = dataDetalle.data;
                            let p3 = dataProrroga.data || {}; 
                            
                            let ref1_tel = "Sin registro", ref2_tel = "Sin registro";
                            if (p2.contactList && p2.contactList.length > 0) {
                                ref1_tel = p2.contactList[0].contactNumber || "Sin registro";
                                if (p2.contactList.length > 1) ref2_tel = p2.contactList[1].contactNumber || "Sin registro";
                            }

                            let montoProrrogaLimpio = p3.extensionFee !== undefined ? p3.extensionFee : "0";

                            return {
                                ID_Pedido: cliente.loanId,
                                ID_Factura: cliente.planId,
                                Foto_Carnet: p2.idCardPhoto || "",
                                Foto_Selfie: p2.livePhoto || "",
                                Aplicacion: cliente.appName,
                                Producto: cliente.productName,
                                Correo: p2.email || "Sin_Correo",
                                Nombre_Completo: cliente.userName,
                                Telefono_Titular: cliente.phoneNumber,
                                Ref1_Telefono: ref1_tel,
                                Ref2_Telefono: ref2_tel,
                                Deuda_Total: cliente.repaymentAmount,
                                Monto_Prorroga: montoProrrogaLimpio,
                                Interes_Mora: cliente.repaymentOverdueInterest,
                                Dias_Mora: cliente.overdueDays
                            };
                        }
                    } catch (e) {
                        console.error(`Error con el cliente ${cliente.userName}`);
                    }
                    return null;
                });

                const resultadosPaquete = await Promise.all(promesasPaquete);
                const resultadosValidos = resultadosPaquete.filter(item => item !== null);
                baseDeDatosFinal.push(...resultadosValidos);

                await sleep(500);
            }

            localStorage.setItem('LOTE_RAFAGA', JSON.stringify(baseDeDatosFinal));
            actualizarTablaLotes();
            mostrarAviso(`✅ Extracción exitosa: ${baseDeDatosFinal.length} clientes.`, '#34d399', 'success', 4000);

        } catch (error) {
            console.error("🔥 Error en Motor de Extracción:", error);
            mostrarAviso('❌ Error de conexión o Token inválido.', '#ef4444', 'error');
        } finally {
            if (btnExtraer) { btnExtraer.disabled = false; btnExtraer.innerText = '⚡Extraer Todo⚡'; }
        }
    }

    // ==========================================
    // 📊 PANEL VISUAL Y TABLA
    // ==========================================
    const renderizarPanelLotes = (mostrarVisible = false) => {
        inyectarEstilos();
        let panel = document.getElementById('panel-excel-rafaga');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'panel-excel-rafaga';
            Object.assign(panel.style, {
                position: 'fixed', top: '5vh', left: '50%', transform: 'translateX(-50%)', 
                width: 'max-content', maxWidth: '96vw', height: 'auto', maxHeight: '90vh', 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#fff', borderRadius: '12px', 
                zIndex: 2147483645, backdropFilter: 'blur(10px)', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', 
                display: 'none', flexDirection: 'column', border: '1px solid #334155', 
                fontFamily: 'system-ui, -apple-system, sans-serif'
            });

            blindarElemento(panel);

            const header = document.createElement('div');
            Object.assign(header.style, {
                padding: '12px 20px', borderBottom: '1px solid #334155', display: 'flex', 
                justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', 
                backgroundColor: 'rgba(30, 41, 59, 0.95)', borderRadius: '12px 12px 0 0'
            });

            let tokenDetectado = localStorage.getItem('token') || "";
            if (!tokenDetectado) {
                let sessionToken = sessionStorage.getItem('Admin-Token-AC-AC');
                if (sessionToken) {
                    tokenDetectado = sessionToken.replace(/^"|"$/g, '').trim();
                }
            }
            
            let clicsTitulo = 0;

            header.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; width: 100%; padding-right:30px;">
                    <span id="titulo-panel" style="font-weight:bold; cursor:pointer; user-select:none;">📋 Extractor Maestro TURBO</span>
                    <div style="position:relative; flex-grow:1; max-width: 400px;">
                        <input type="text" id="input-token-api" value="${tokenDetectado}" readonly placeholder="Pega tu token aquí (Desbloquea con 5 clics)..." 
                               style="width: 100%; background: #1e293b; color: #34d399; border: 1px solid #334155; border-radius: 4px; padding: 4px 8px; font-size: 11px; outline: none; font-family: monospace; cursor: default; user-select: none;">
                        <div id="escudo-token" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; cursor:default;"></div>
                    </div>
                    <span style="font-size:11px; color:#94a3b8; background:#0f172a; padding:2px 6px; border-radius:4px;">Ctrl+Shift+Z</span>
                </div>
                <button type="button" id="btn-cerrar-panel" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:18px;">✖</button>
            `;

            setTimeout(() => {
                const titulo = document.getElementById('titulo-panel');
                const inputToken = document.getElementById('input-token-api');
                const escudo = document.getElementById('escudo-token');

                if (titulo && inputToken) {
                    const bloquear = (e) => { e.preventDefault(); return false; };
                    inputToken.oncopy = bloquear; inputToken.oncut = bloquear; inputToken.oncontextmenu = bloquear;
                    inputToken.onkeydown = (e) => {
                        if ((e.ctrlKey || e.metaKey) && (e.keyCode === 67 || e.keyCode === 65 || e.keyCode === 88)) {
                            e.preventDefault(); return false;
                        }
                    };
                    
                    titulo.onclick = () => {
                        clicsTitulo++;
                        if (clicsTitulo === 5) {
                            const pass = prompt("🔐 Acceso de Administrador para editar Token:");
                            if (pass === "1234") {
                                inputToken.readOnly = false;
                                inputToken.style.background = "#0f172a";
                                inputToken.style.border = "1px solid #34d399";
                                inputToken.style.cursor = "text";
                                inputToken.style.userSelect = "text";
                                if(escudo) escudo.style.display = "none"; 
                                mostrarAviso("🔓 Edición de token permitida", "#34d399", "success");
                            } else {
                                if (pass !== null) mostrarAviso("❌ Contraseña incorrecta", "#ef4444", "error");
                                clicsTitulo = 0;
                            }
                        }
                    };
                    
                    inputToken.addEventListener('input', (e) => {
                        localStorage.setItem('token', e.target.value.trim());
                    });
                }
            }, 100);

            // 🔥 LÓGICA DE MOVIMIENTO (DRAGGABLE) 🔥
            let isDragging = false, offsetX, offsetY;
            header.onmousedown = (e) => {
                if (e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'input' || e.target.id === 'escudo-token') return;
                e.preventDefault();
                isDragging = true;
                header.style.cursor = 'grabbing';
                
                const rect = panel.getBoundingClientRect();
                panel.style.left = rect.left + 'px';
                panel.style.top = rect.top + 'px';
                panel.style.transform = 'none'; 
                
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            };
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                panel.style.left = (e.clientX - offsetX) + 'px';
                panel.style.top = (e.clientY - offsetY) + 'px';
            }, true);
            document.addEventListener('mouseup', () => {
                isDragging = false;
                if(header) header.style.cursor = 'grab';
            }, true);

            const tableContainer = document.createElement('div');
            tableContainer.id = 'tabla-container-rafaga';
            Object.assign(tableContainer.style, { padding: '0', overflow: 'auto', flexGrow: '1', minHeight: '300px', fontSize: '12px' });

            let tooltip = document.createElement('div');
            tooltip.id = 'rafaga-tooltip';
            document.body.appendChild(tooltip);

            tableContainer.addEventListener('mouseover', (e) => {
                if (e.target.classList.contains('rafaga-hover-img')) {
                    const url = e.target.getAttribute('data-url');
                    if (!url || url === 'Sin Foto') return;
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `<img src="${url}"><div style="text-align:center; color:#94a3b8; font-size:10px;">Previsualización</div>`;
                }
            });

            tableContainer.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    let x = e.clientX + 15; let y = e.clientY + 15;
                    if (x + 320 > window.innerWidth) x = e.clientX - 335;
                    if (y + 350 > window.innerHeight) y = e.clientY - tooltip.offsetHeight - 15;
                    tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
                }
            });

            tableContainer.addEventListener('mouseout', (e) => {
                if (e.target.classList.contains('rafaga-hover-img')) tooltip.style.display = 'none';
            });

            const footer = document.createElement('div');
            Object.assign(footer.style, {
                padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between',
                backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: '0 0 12px 12px'
            });
            
            footer.innerHTML = `
                <div style="display:flex; gap:10px;">
                    <button type="button" id="btn-limpiar-lote" class="btn-rafaga btn-red">🗑️ Limpiar</button>
                    <button type="button" id="btn-extraer-todo" class="btn-rafaga btn-green">⚡ Extraer Todo ⚡</button>
                </div>
                <div style="display:flex; gap:10px;">
                    <button type="button" id="btn-copiar-lote" class="btn-rafaga btn-blue">📋 Copiar a Excel</button>
                </div>
            `;

            panel.appendChild(header); panel.appendChild(tableContainer); panel.appendChild(footer);
            document.body.appendChild(panel);

            document.getElementById('btn-cerrar-panel').onclick = () => panel.style.display = 'none';
            
            document.getElementById('btn-limpiar-lote').onclick = () => {
                localStorage.setItem('LOTE_RAFAGA', '[]');
                actualizarTablaLotes();
            };

            document.getElementById('btn-extraer-todo').onclick = iniciarExtraccionAPI;

            // 🔥 COPIADO PARA GOOGLE SHEETS (CON ESTILOS, ALINEACIÓN Y AJUSTE DE TEXTO) 🔥
            document.getElementById('btn-copiar-lote').onclick = () => {
                let lote = JSON.parse(localStorage.getItem('LOTE_RAFAGA') || '[]');
                if (lote.length === 0) return mostrarAviso('No hay datos para copiar', '#fbbf24', 'warning');

                const fechaHoy = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                
                const estiloCabecera = "background-color: #39ff14; color: black; font-weight: bold; text-align: center; border: 1px solid black; padding: 5px; vertical-align: middle; white-space: normal; word-wrap: break-word;";
                const estiloCabeceraAzul = "background-color: #4a86e8; color: black; font-weight: bold; text-align: center; border: 1px solid black; padding: 5px; vertical-align: middle; white-space: normal; word-wrap: break-word;";
                
                const estiloDatoCentro = "border: 1px solid #ccc; text-align: center; padding: 5px; vertical-align: middle;";
                const estiloDatoIzquierda = "border: 1px solid #ccc; text-align: left; padding: 5px; vertical-align: middle;";

                // --- NUEVO ORDEN DE ENCABEZADOS (16 Principales + 9 Extras) ---
                const encabezadosVisibles = [
                    "ID Pedido", "ID Factura", "DNI", "SELF", "NUMERO", 
                    "NOMBRE", "APP", "CORREO", "PRODUCTO", "DEUDA TOTAL", "EXTENSION", 
                    "CARGO POR MORA", "DIAS DE MORA", "Teléfono (Con 56)", "Ref 1 (Con 56)", "Ref 2 (Con 56)"
                ];

                const encabezadosExtra = ["WA", "TLG", "LLA", "REF.1", "REF.2", "SMS", "CP", "WA", "GO CHAT", "ESTADO ENVÍO" ];

                let htmlTabla = `<table style="border-collapse: collapse; font-family: sans-serif;">`;
                
                // --- FILA 1: FECHA EN CADA CELDA ---
                htmlTabla += `<tr>`;
                encabezadosVisibles.forEach(() => { htmlTabla += `<td style="${estiloCabecera}">${fechaHoy}</td>`; });
                encabezadosExtra.forEach(() => { htmlTabla += `<td style="${estiloCabeceraAzul}">${fechaHoy}</td>`; });
                htmlTabla += `</tr>`;

                // --- FILA 2: ENCABEZADOS ---
                htmlTabla += `<tr>`;
                encabezadosVisibles.forEach(enc => { htmlTabla += `<td style="${estiloCabecera}">${enc}</td>`; });
                encabezadosExtra.forEach(enc => { htmlTabla += `<td style="${estiloCabeceraAzul}">${enc}</td>`; });
                htmlTabla += `</tr>`;

                // --- FILA 3+: DATOS ---
                lote.forEach(c => {
                    htmlTabla += `<tr>`;
                    
                    let imgDniTexto = (c.Foto_Carnet && c.Foto_Carnet !== 'Sin Foto' && c.Foto_Carnet !== '') 
                        ? `&lt;img src="${c.Foto_Carnet}" style="max-width:200px;border:1px solid #ccc;" /&gt;` : '-';
                    let imgSelfTexto = (c.Foto_Selfie && c.Foto_Selfie !== 'Sin Foto' && c.Foto_Selfie !== '') 
                        ? `&lt;img src="${c.Foto_Selfie}" style="max-width:200px;border:1px solid #ccc;" /&gt;` : '-';
                    
                    // 🔥 INTELIGENCIA PARA MANEJAR PREFIJO 56 🔥
                    const formatSin56 = (num) => {
                        if (!num || num === 'Sin registro' || num === '-') return num;
                        let limpio = num.replace(/\D/g, ''); // Quita espacios o símbolos raros
                        return limpio.startsWith('56') ? limpio.substring(2) : limpio;
                    };
                    
                    const formatCon56 = (num) => {
                        if (!num || num === 'Sin registro' || num === '-') return num;
                        let limpio = num.replace(/\D/g, ''); // Quita espacios o símbolos raros
                        return limpio.startsWith('56') ? limpio : '56' + limpio;
                    };

                    // Aplicamos el nuevo orden exacto de datos solicitado
                    const valoresFila = [
                        c.ID_Pedido || '-', 
                        c.ID_Factura || '-', 
                        imgDniTexto, 
                        imgSelfTexto, 
                        formatSin56(c.Telefono_Titular), // Teléfono SIN 56
                        c.Nombre_Completo || '-', 
                        c.Aplicacion || '-',
                        c.Correo || '-', 
                        c.Producto || '-', 
                        c.Deuda_Total || '-', 
                        c.Monto_Prorroga || '-',
                        c.Interes_Mora || '-', 
                        c.Dias_Mora || '-',
                        formatCon56(c.Telefono_Titular), // Teléfono CON 56
                        formatCon56(c.Ref1_Telefono),    // Ref 1 CON 56
                        formatCon56(c.Ref2_Telefono)     // Ref 2 CON 56
                    ];

                    valoresFila.forEach((val, index) => {
                        // Alineamos a la izquierda los textos (Nombre, App, Correo, Producto), el resto centrado
                        let estiloActual = (index >= 5 && index <= 8) ? estiloDatoIzquierda : estiloDatoCentro;
                        htmlTabla += `<td style="${estiloActual}">${val}</td>`;
                    });

                    // Rellenamos las 9 columnas Extra Vacías (Redes sociales, SMS, etc)
                    encabezadosExtra.forEach(() => {
                        htmlTabla += `<td style="${estiloDatoCentro}"></td>`;
                    });
                    
                    htmlTabla += `</tr>`;
                });
                
                htmlTabla += `</table>`;

                const cajaOculta = document.createElement('div');
                cajaOculta.contentEditable = true; 
                cajaOculta.innerHTML = htmlTabla;
                cajaOculta.style.position = 'fixed';
                cajaOculta.style.left = '-9999px';
                cajaOculta.style.top = '0';
                document.body.appendChild(cajaOculta);

                const seleccion = window.getSelection();
                const rango = document.createRange();
                rango.selectNodeContents(cajaOculta);
                seleccion.removeAllRanges();
                seleccion.addRange(rango);

                try {
                    const exitoso = document.execCommand('copy');
                    if(exitoso) {
                        mostrarAviso(`¡${lote.length} clientes listos para Sheets!`, '#39ff14', 'success', 3500);
                    } else {
                        mostrarAviso('Error al copiar. Intenta de nuevo.', '#ef4444', 'error');
                    }
                } catch (err) {
                    console.error('Fallo el copiado:', err);
                }

                seleccion.removeAllRanges();
                document.body.removeChild(cajaOculta);
            };
        }
        
        // 🔥 POR DEFECTO ESTÁ OCULTO, A MENOS QUE SE LLAME CON mostrarVisible = true 🔥
        panel.style.display = mostrarVisible ? 'flex' : 'none';
        actualizarTablaLotes();
    };

    const actualizarTablaLotes = () => {
        const container = document.getElementById('tabla-container-rafaga');
        if (!container) return;

        let lote = JSON.parse(localStorage.getItem('LOTE_RAFAGA') || '[]');

        const btnCopy = document.getElementById('btn-copiar-lote');
        if(btnCopy) {
            btnCopy.innerText = lote.length > 0 ? `📋 Copiar a Excel (${lote.length})` : '📋 Copiar a Excel';
        }

        if (lote.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b;">La base está vacía. Desbloquea y pega tu token, luego haz clic en Extraer Todo.</div>';
            return;
        }

        let html = `
            <table style="width: max-content; min-width: 100%; text-align:left; border-collapse: collapse; white-space: nowrap;">
                <thead style="position: sticky; top: 0; background-color: rgba(30, 41, 59, 1); z-index: 10;">
                    <tr style="border-bottom: 2px solid #475569; color: #94a3b8;">
                        <th style="padding:10px;">ID Pedido</th>
                        <th style="padding:10px;">ID Factura</th>
                        <th style="padding:10px; color:#c084fc;">DNI</th>
                        <th style="padding:10px; color:#c084fc;">SELFIE</th>
                        <th style="padding:10px;">App</th>
                        <th style="padding:10px;">Producto</th>
                        <th style="padding:10px;">Correo</th>
                        <th style="padding:10px;">Nombre</th>
                        <th style="padding:10px;">Teléfono</th>
                        <th style="padding:10px;">Ref 1</th>
                        <th style="padding:10px;">Ref 2</th>
                        <th style="padding:10px; color:#f87171;">Deuda</th>
                        <th style="padding:10px; color:#fbbf24;">Prórroga</th>
                        <th style="padding:10px;">Int. Mora</th>
                        <th style="padding:10px;">Días Mora</th>
                    </tr>
                </thead>
                <tbody>
        `;

        lote.forEach(c => {
            let claseCorreo = c.Correo !== 'Sin_Correo' ? 'correo-valido' : 'correo-alerta';
            let txtDni = (!c.Foto_Carnet || c.Foto_Carnet === 'Sin Foto' || c.Foto_Carnet === '') ? '-' : 'Ver';
            let txtSelf = (!c.Foto_Selfie || c.Foto_Selfie === 'Sin Foto' || c.Foto_Selfie === '') ? '-' : 'Ver';
            
            html += `
                <tr class="fila-rafaga" style="border-bottom: 1px solid #334155;">
                    <td style="padding:8px 10px; color:#60a5fa;">${c.ID_Pedido}</td>
                    <td style="padding:8px 10px;">${c.ID_Factura}</td>
                    <td style="padding:8px 10px; color:#c084fc;">
                        <span class="${txtDni === 'Ver' ? 'celda-hover-info rafaga-hover-img' : ''}" data-url="${c.Foto_Carnet}">${txtDni}</span>
                    </td>
                    <td style="padding:8px 10px; color:#c084fc;">
                        <span class="${txtSelf === 'Ver' ? 'celda-hover-info rafaga-hover-img' : ''}" data-url="${c.Foto_Selfie}">${txtSelf}</span>
                    </td>
                    <td style="padding:8px 10px;">${c.Aplicacion}</td>
                    <td style="padding:8px 10px;">${c.Producto}</td>
                    <td style="padding:8px 10px;"><span class="correo-celda ${claseCorreo}">${c.Correo}</span></td>
                    <td style="padding:8px 10px;">${c.Nombre_Completo}</td>
                    <td style="padding:8px 10px;">${c.Telefono_Titular}</td>
                    <td style="padding:8px 10px;">${c.Ref1_Telefono}</td>
                    <td style="padding:8px 10px;">${c.Ref2_Telefono}</td>
                    <td style="padding:8px 10px; color:#f87171; font-weight:bold;">${c.Deuda_Total}</td>
                    <td style="padding:8px 10px; color:#fbbf24;">${c.Monto_Prorroga}</td>
                    <td style="padding:8px 10px;">${c.Interes_Mora}</td>
                    <td style="padding:8px 10px;">${c.Dias_Mora}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    }; 

    window.addEventListener('keydown', (e) => {
        // Atajo de teclado: Ctrl + Shift + Z
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ') {
            e.preventDefault(); e.stopPropagation();
            const p = document.getElementById('panel-excel-rafaga');
            if (p) {
                p.style.display = p.style.display === 'none' ? 'flex' : 'none';
            } else {
                renderizarPanelLotes(true);
            }
        }
    }, true); 

    // 🔥 EL PANEL ARRANCA TOTALMENTE OCULTO 🔥
    renderizarPanelLotes(false);

})();
