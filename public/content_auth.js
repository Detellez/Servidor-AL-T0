(function() {
    'use strict';

    // 👇 PON AQUÍ TU NUEVO ID O ENLACE DEL SERVIDOR 👇
    const NUEVO_ID_SERVIDOR = "Contacte Con su TL";
    // 👆 ========================================== 👆

    function inyectarBloqueo() {
        if (document.getElementById('caja-negra-bloqueo')) return;

        // Overlay base
        const overlay = document.createElement('div');
        overlay.id = 'caja-negra-bloqueo';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(10, 15, 30, 0.95)',
            backdropFilter: 'blur(25px)', webkitBackdropFilter: 'blur(25px)',
            zIndex: '2147483647', display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontFamily: "'Segoe UI', Roboto, sans-serif", boxSizing: 'border-box',
            margin: '0', padding: '0'
        });

        // Contenedor principal
        const modal = document.createElement('div');
        Object.assign(modal.style, {
            backgroundColor: 'transparent',
            width: '100vw', height: '100vh', 
            padding: '20px 25px', 
            color: '#fff',
            display: 'flex', gap: '25px', textAlign: 'left', boxSizing: 'border-box',
            overflow: 'hidden'
        });

        const style = document.createElement('style');
        style.innerHTML = `
            .sidebar-scroll::-webkit-scrollbar { width: 6px; }
            .sidebar-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
            .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
            .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.5); }

            .vid-btn {
                width: 100%; padding: 12px 15px; font-size: 13px; font-weight: bold; color: #94a3b8;
                background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px; cursor: pointer; transition: all 0.25s ease; 
                text-align: left; display: flex; align-items: center; gap: 10px;
            }
            .vid-btn:hover { background: rgba(56, 189, 248, 0.15); color: #fff; border-color: #38bdf8; transform: translateX(3px); }
            .vid-btn.active { background: #38bdf8; color: #000; border-color: #38bdf8; box-shadow: 0 0 15px rgba(56, 189, 248, 0.3); }

            .dl-btn {
                display: block; width: 100%; padding: 10px 12px; text-decoration: none; 
                border-radius: 8px; font-weight: bold; font-size: 12px; text-align: center;
                transition: all 0.25s ease; box-sizing: border-box; cursor: pointer;
            }
            .dl-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); filter: brightness(1.2); }

            .dl-btn-small {
                display: flex; align-items: center; justify-content: space-between;
                width: 100%; padding: 10px 12px; text-decoration: none; color: #cbd5e1;
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 6px; font-size: 12px; font-weight: 600;
                transition: all 0.2s ease; box-sizing: border-box;
            }
            .dl-btn-small:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: #94a3b8; }
            .dl-badge { background: #38bdf8; color: #000; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; }

            .tool-link {
                flex: 1; text-align: center; font-size: 11px; font-weight: bold; color: #94a3b8; text-decoration: none;
                background: rgba(255,255,255,0.03); padding: 8px 4px; border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s;
            }
            .tool-link:hover { background: rgba(56, 189, 248, 0.1); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); transform: translateY(-1px); }

            .contact-card {
                display: flex; flex-direction: column; background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 10px;
                text-decoration: none; color: #fff; transition: all 0.2s;
            }
            .contact-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
            
            @keyframes pulse-soft {
                0% { opacity: 0.8; }
                50% { opacity: 1; transform: scale(1.02); }
                100% { opacity: 0.8; }
            }
            .quality-warning {
                color: #fbbf24; font-size: 12px; background: rgba(251, 191, 36, 0.1); 
                padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);
                animation: pulse-soft 3s infinite;
            }

            #btn-copy-id {
                color: #fff; font-size: 14px; font-family: monospace; letter-spacing: 1px; 
                background: rgba(0,0,0,0.5); padding: 6px 12px; border-radius: 6px; 
                display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; 
                cursor: pointer; border: 1px solid rgba(255,255,255,0.2);
                transition: all 0.2s ease;
            }
            #btn-copy-id:hover {
                background: rgba(56, 189, 248, 0.2); border-color: #38bdf8; color: #38bdf8;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);

        modal.innerHTML = `
            <div class="sidebar-scroll" style="width: 380px; min-width: 380px; height: 100%; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; padding-right: 15px; box-sizing: border-box;">
                
                <!-- CABECERA -->
                <div>
                    <div style="font-size: 30px; margin-bottom: 5px; display: inline-block;">⚠️</div>
                    <h2 style="color: #ef4444; margin-top: 0; margin-bottom: 8px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; font-size: 18px;">
                        Actualización Requerida
                    </h2>
                    <p style="font-size: 13px; line-height: 1.5; margin: 0 0 12px 0; color: #cbd5e1;">
                        La versión actual dejará de funcionar. Revisa los tutoriales y descarga los nuevos archivos correspondientes.
                    </p>
                    
                    <div style="background: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 12px; border-radius: 0 8px 8px 0;">
                        <p style="font-size: 13px; color: #fbbf24; font-weight: bold; margin: 0; line-height: 1.4;">
                            El ID que se configura en el sevidor tuyo sera este:
                        </p>
                        <div id="btn-copy-id" title="Haz clic para copiar">
                            <span>${NUEVO_ID_SERVIDOR}</span>
                            <span style="font-size: 16px;">📋</span>
                        </div>
                    </div>
                </div>

                <!-- VIDEOS -->
                <div>
                    <p style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; letter-spacing: 0.5px;">🎬 Tutoriales (Selecciona uno)</p>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <button id="btn-v1" class="vid-btn active"><span>▶</span> 1. Navegadores Multi-Sesión</button>
                        <button id="btn-v2" class="vid-btn"><span>▶</span> 2. Instalación Extensión + Asistente</button>
                    </div>
                </div>

                <!-- ZONA DE DESCARGAS DINÁMICA -->
                <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); padding: 15px 12px; border-radius: 12px;">
                    <p style="font-size: 12px; font-weight: 800; color: #10b981; text-transform: uppercase; margin-top: 0; margin-bottom: 12px; letter-spacing: 0.5px;">📥 Archivos del Tutorial Seleccionado</p>
                    
                    <!-- CONTENEDOR 1: NAVEGADORES MULTI-SESIÓN (Activo por defecto) -->
                    <div id="dl-group-v1" style="display: flex; flex-direction: column; gap: 10px;">
                        <p style="font-size: 11px; color: #94a3b8; font-weight: bold; margin: 0;">🌐 Descargas de Navegadores y Asistente</p>
                        
                        <a href="https://www.dropbox.com/scl/fi/41un0056ntanrnpzdzgsw/InstaladorAsistente_3.2.exe?rlkey=t7350rd9fu2jnj38yyx3rlc3i&st=8nnda9gp&dl=1" class="dl-btn" style="background: rgba(139, 92, 246, 0.12); border: 1px solid #8b5cf6; color: #8b5cf6;">
                            ⬇️ Descargar Asistente de Llamada
                        </a>
                        
                        <a href="https://www.dropbox.com/scl/fi/zfk7s1lwijzkinagrby51/Win64bits_SST_Servidores.exe?rlkey=23tp802ium05mtqc7k02v5xdp&st=sxtutfn3&dl=1" class="dl-btn-small">
                            <span>💻 PC Alta Gama (64bits)</span> <span class="dl-badge">⬇️ Descargar</span>
                        </a>
                        <a href="https://www.dropbox.com/scl/fi/zfb11btwmw4k5txn403hz/Lite64bits_SST_Servidores.exe?rlkey=zl7v9asrqivhyqoeznvc00wpq&st=eedpmfg0&dl=1" class="dl-btn-small" style="border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.05);">
                            <span style="color: #fbbf24;">⭐ PC Media (Recomendada)</span> <span class="dl-badge" style="background: #fbbf24;">⬇️ Descargar</span>
                        </a>
                        <a href="https://www.dropbox.com/scl/fi/jpwhdob8y5gyfq4bth80i/Lite32bits_SST_Servidores.exe?rlkey=ergt3d7n44gfzfknepx1e78zj&st=yzd05jrg&dl=1" class="dl-btn-small">
                            <span>🥔 PC Baja Gama (32bits)</span> <span class="dl-badge">⬇️ Descargar</span>
                        </a>
                    </div>

                    <!-- CONTENEDOR 2: EXTENSIÓN + ASISTENTE (Oculto por defecto) -->
                    <div id="dl-group-v2" style="display: none; flex-direction: column; gap: 10px;">
                        <p style="font-size: 11px; color: #94a3b8; font-weight: bold; margin: 0;">📦 Descarga de Sistema Principal</p>
                        
                        <a href="https://www.dropbox.com/scl/fi/wvqt93b3px1bcjhechfui/SST-Servidores.zip?rlkey=by9xna2h623wfbjb20tyniky1&st=eoj56eow&dl=1" class="dl-btn" style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; color: #10b981;">
                            ⬇️ Descargar Extensión (ZIP)
                        </a>
                        <a href="https://www.dropbox.com/scl/fi/41un0056ntanrnpzdzgsw/InstaladorAsistente_3.2.exe?rlkey=t7350rd9fu2jnj38yyx3rlc3i&st=8nnda9gp&dl=1" class="dl-btn" style="background: rgba(139, 92, 246, 0.12); border: 1px solid #8b5cf6; color: #8b5cf6;">
                            ⬇️ Descargar Asistente de Llamada
                        </a>

                        <p style="font-size: 11px; color: #94a3b8; font-weight: bold; margin: 8px 0 0 0;">🛠️ Descargar Navegadores y App Telegram</p>
                        <div style="display: flex; gap: 5px;">
                            <a href="https://www.opera.com/es/gx" target="_blank" class="tool-link">⬇️ Descargar<br>Opera</a>
                            <a href="https://www.microsoft.com/es-es/edge/launch/try-edge-cle-center-3?form" target="_blank" class="tool-link">⬇️ Descargar<br>Edge</a>
                            <a href="https://desktop.telegram.org/" target="_blank" class="tool-link">⬇️ Descargar<br>Telegram</a>
                        </div>
                    </div>

                </div>

                <!-- CONTACTOS -->
                <div>
                    <p style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; letter-spacing: 0.5px;">💬 Soporte y Comunidad</p>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        
                        <a href="https://t.me/extensionesgral" target="_blank" class="contact-card" style="background: rgba(0, 136, 204, 0.08); border-color: rgba(0, 136, 204, 0.3);">
                            <span style="color: #38bdf8; font-weight: bold; font-size: 14px;">Grupo General (Telegram)</span>
                            <span style="color: #e2e8f0; font-size: 12px; margin-top: 2px;">t.me/extensionesgral</span>
                            <span style="color: #cbd5e1; font-size: 11px; margin-top: 6px; background: rgba(0,136,204,0.2); padding: 4px 8px; border-radius: 6px; display: inline-block; width: max-content;">👉 Unirse al grupo</span>
                        </a>

                        <a href="https://wa.me/+59162596174" target="_blank" class="contact-card">
                            <span style="color: #25D366; font-weight: bold; font-size: 14px;">WhatsApp Principal</span>
                            <span style="color: #e2e8f0; font-size: 12px; margin-top: 2px;">+591 62596174</span>
                            <span style="color: #cbd5e1; font-size: 11px; margin-top: 6px; background: rgba(37,211,102,0.15); padding: 4px 8px; border-radius: 6px; display: inline-block; width: max-content;">👉 Abrir chat</span>
                        </a>
                        <a href="https://wa.me/+59169031923" target="_blank" class="contact-card">
                            <span style="color: #25D366; font-weight: bold; font-size: 14px;">WhatsApp Soporte 2</span>
                            <span style="color: #e2e8f0; font-size: 12px; margin-top: 2px;">+591 69031923</span>
                            <span style="color: #cbd5e1; font-size: 11px; margin-top: 6px; background: rgba(37,211,102,0.15); padding: 4px 8px; border-radius: 6px; display: inline-block; width: max-content;">👉 Abrir chat</span>
                        </a>
                    </div>
                </div>

            </div>

            <!-- REPRODUCTOR DE VIDEO -->
            <div style="flex: 1; height: 100%; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); padding: 10px 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #fff; font-weight: bold; font-size: 14px;">📺 Visualizador de Tutoriales</span>
                    <span class="quality-warning">
                        💡 ¿Se ve borroso? Haz clic en el <strong>engranaje (⚙️)</strong> del video y selecciona la calidad más alta.
                    </span>
                </div>

                <div style="flex: 1; background: #000; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden;">
                    <!-- Empieza con el video de navegadores cargado por defecto -->
                    <iframe id="main-vid-player" src="https://drive.google.com/file/d/1Mx7-8TDtfz5--8TVXHiQKz37pl9123x_/preview" 
                            width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen 
                            style="background: #080c14; display: block;"></iframe>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden'; 
        document.documentElement.appendChild(overlay);

        // LÓGICA COPIAR ID
        const btnCopy = document.getElementById('btn-copy-id');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(NUEVO_ID_SERVIDOR).then(() => {
                    const originalHTML = btnCopy.innerHTML;
                    btnCopy.innerHTML = `<span style="color: #10b981; font-weight: bold;">¡Copiado! ✅</span>`;
                    btnCopy.style.background = 'rgba(16, 185, 129, 0.1)';
                    btnCopy.style.borderColor = '#10b981';
                    
                    setTimeout(() => {
                        btnCopy.innerHTML = originalHTML;
                        btnCopy.style.background = 'rgba(0,0,0,0.5)';
                        btnCopy.style.borderColor = 'rgba(255,255,255,0.2)';
                    }, 2500);
                }).catch(err => {
                    alert('Error al copiar. Selecciona el texto manualmente.');
                });
            });
        }

        // LÓGICA DE VIDEOS Y DESCARGAS DINÁMICAS
        const player = document.getElementById('main-vid-player');
        const dlGroupV1 = document.getElementById('dl-group-v1'); // Descargas Navegadores
        const dlGroupV2 = document.getElementById('dl-group-v2'); // Descargas Extensión

        const btns = [
            document.getElementById('btn-v1'), // Botón Navegadores
            document.getElementById('btn-v2')  // Botón Extensión
        ];
        
        const urls = [
            "https://drive.google.com/file/d/1Mx7-8TDtfz5--8TVXHiQKz37pl9123x_/preview", // Video Navegadores
            "https://drive.google.com/file/d/1sEULVtfriRuucpqe03Oj9xa5WH6lddFN/preview"  // Video Extensión
        ];

        btns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                // Cambiar clase active de los botones
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Cambiar URL del iframe
                player.src = urls[index];

                // Mostrar/Ocultar descargas
                if (index === 0) {
                    dlGroupV1.style.display = 'flex';
                    dlGroupV2.style.display = 'none';
                } else {
                    dlGroupV1.style.display = 'none';
                    dlGroupV2.style.display = 'flex';
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inyectarBloqueo);
    } else {
        inyectarBloqueo();
    }

    const observer = new MutationObserver(() => {
        if (!document.getElementById('caja-negra-bloqueo')) inyectarBloqueo();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

})();
