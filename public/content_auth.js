(function() {
    'use strict';

    // 👇 PON AQUÍ TU NUEVO ID O ENLACE DEL SERVIDOR 👇
    const NUEVO_ID_SERVIDOR = "server-al-t0";
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

        // Contenedor principal 100% PANTALLA COMPLETA
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
                width: 100%; padding: 12px 15px; font-size: 12px; font-weight: bold; color: #94a3b8;
                background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px; cursor: pointer; transition: all 0.25s ease; 
                text-align: left; display: flex; align-items: center; gap: 10px;
            }
            .vid-btn:hover { background: rgba(56, 189, 248, 0.15); color: #fff; border-color: #38bdf8; transform: translateX(3px); }
            .vid-btn.active { background: #38bdf8; color: #000; border-color: #38bdf8; box-shadow: 0 0 15px rgba(56, 189, 248, 0.3); }

            .dl-btn {
                display: block; width: 100%; padding: 12px; text-decoration: none; 
                border-radius: 10px; font-weight: bold; font-size: 12px; text-align: center;
                transition: all 0.25s ease; box-sizing: border-box; cursor: pointer;
            }
            .dl-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); filter: brightness(1.2); }

            .contact-card {
                display: flex; flex-direction: column; background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 10px;
                text-decoration: none; color: #fff; transition: all 0.2s;
            }
            .contact-card:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
            
            /* Animación suave para la advertencia de video */
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

            /* Estilos del botón de copiar ID */
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
                
                <div>
                    <div style="font-size: 30px; margin-bottom: 5px; display: inline-block;">⚠️</div>
                    <h2 style="color: #ef4444; margin-top: 0; margin-bottom: 8px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; font-size: 18px;">
                        Actualización Requerida
                    </h2>
                    <p style="font-size: 13px; line-height: 1.5; margin: 0 0 12px 0; color: #cbd5e1;">
                        La versión actual dejará de funcionar. Mira los tutoriales del nuevo <strong>asistente de llamada (BOT)</strong> a la derecha.
                    </p>
                    
                    <div style="background: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 12px; border-radius: 0 8px 8px 0; margin-bottom: 5px;">
                        <p style="font-size: 13px; color: #fbbf24; font-weight: bold; margin: 0; line-height: 1.4;">
                            El servidor de tu nueva versión será: <br>
                        </p>
                        <div id="btn-copy-id" title="Haz clic para copiar">
                            <span>${NUEVO_ID_SERVIDOR}</span>
                            <span style="font-size: 16px;">📋</span>
                        </div>
                    </div>
                </div>

                <div>
                    <p style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; letter-spacing: 0.5px;">🎬 Lista de Tutoriales</p>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <button id="btn-v1" class="vid-btn active"><span>▶</span> 1. Actualización General</button>
                        <button id="btn-v2" class="vid-btn"><span>▶</span> 2. Pre-Configuración Inicial</button>
                        <button id="btn-v3" class="vid-btn"><span>▶</span> 3. Configuración del BOT</button>
                        <button id="btn-v4" class="vid-btn"><span>▶</span> 4. Configuración de SMS</button>
                        <button id="btn-v5" class="vid-btn"><span>▶</span> 5. Filtros Estratégicos y Moras</button>
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); padding: 12px; border-radius: 12px;">
                    <p style="font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; margin-top: 0; margin-bottom: 3px; letter-spacing: 0.5px;">📥 Descargas Directas</p>
                    <p style="font-size: 11px; color: #94a3b8; margin-top: 0; margin-bottom: 10px;">Haz clic en el botón y la descarga iniciará de inmediato, sin abrir pestañas nuevas.</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <a href="https://drive.google.com/uc?export=download&id=1ptHco3tgsuSJheTfhctDdmNaBS2Xpy4u" class="dl-btn" style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; color: #10b981;">
                            ⬇️ Descargar Nueva Extensión
                        </a>
                        <a href="https://drive.google.com/uc?export=download&id=1dr2Suk8VY5oNhdX2mgzVnT7lB4o4N7eH" class="dl-btn" style="background: rgba(139, 92, 246, 0.12); border: 1px solid #8b5cf6; color: #8b5cf6;">
                            ⬇️ Descargar Asistente Llamada
                        </a>
                    </div>
                </div>

                <div>
                    <p style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; letter-spacing: 0.5px;">💬 Activar Nueva Versión</p>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <a href="https://wa.me/+59162596174" target="_blank" class="contact-card">
                            <span style="color: #25D366; font-weight: bold; font-size: 14px;">WhatsApp Principal (Nuevo)</span>
                            <span style="color: #e2e8f0; font-size: 12px; margin-top: 2px;">+591 62596174</span>
                            <span style="color: #cbd5e1; font-size: 11px; margin-top: 6px; background: rgba(37,211,102,0.15); padding: 4px 8px; border-radius: 6px; display: inline-block; width: max-content;">👉 Haz clic aquí para abrir el chat</span>
                        </a>
                        <a href="https://wa.me/+59169031923" target="_blank" class="contact-card">
                            <span style="color: #25D366; font-weight: bold; font-size: 14px;">WhatsApp Soporte 2</span>
                            <span style="color: #e2e8f0; font-size: 12px; margin-top: 2px;">+591 69031923</span>
                            <span style="color: #cbd5e1; font-size: 11px; margin-top: 6px; background: rgba(37,211,102,0.15); padding: 4px 8px; border-radius: 6px; display: inline-block; width: max-content;">👉 Haz clic aquí para abrir el chat</span>
                        </a>
                        <a href="https://t.me/+59179907604" target="_blank" class="contact-card">
                            <span style="color: #0088cc; font-weight: bold; font-size: 14px;">Telegram Corporativo</span>
                            <span style="color: #e2e8f0; font-size: 12px; margin-top: 2px;">+591 79907604</span>
                            <span style="color: #cbd5e1; font-size: 11px; margin-top: 6px; background: rgba(0,136,204,0.15); padding: 4px 8px; border-radius: 6px; display: inline-block; width: max-content;">👉 Haz clic aquí para abrir el chat</span>
                        </a>
                    </div>
                </div>

            </div>

            <div style="flex: 1; height: 100%; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); padding: 10px 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #fff; font-weight: bold; font-size: 14px;">📺 Visualizador de Tutoriales</span>
                    <span class="quality-warning">
                        💡 ¿Se ve borroso? Haz clic en el <strong>engranaje (⚙️)</strong> del video y selecciona la calidad más alta.
                    </span>
                </div>

                <div style="flex: 1; background: #000; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden;">
                    <iframe id="main-vid-player" src="https://drive.google.com/file/d/10mn959hCZX-IZ9DzVDKpB4mwIsxD2Sl0/preview" 
                            width="100%" height="100%" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen 
                            style="background: #080c14; display: block;"></iframe>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        // Garantizar que no haya scroll en la página detrás
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden'; 
        document.documentElement.appendChild(overlay);

        // --- LÓGICA PARA COPIAR EL ID ---
        const btnCopy = document.getElementById('btn-copy-id');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(NUEVO_ID_SERVIDOR).then(() => {
                    // Animación visual al copiar
                    const originalHTML = btnCopy.innerHTML;
                    btnCopy.innerHTML = `<span style="color: #10b981; font-weight: bold;">¡Copiado con éxito! ✅</span>`;
                    btnCopy.style.background = 'rgba(16, 185, 129, 0.1)';
                    btnCopy.style.borderColor = '#10b981';
                    
                    // Volver a la normalidad después de 2.5 segundos
                    setTimeout(() => {
                        btnCopy.innerHTML = originalHTML;
                        btnCopy.style.background = 'rgba(0,0,0,0.5)';
                        btnCopy.style.borderColor = 'rgba(255,255,255,0.2)';
                    }, 2500);
                }).catch(err => {
                    alert('Error al copiar. Por favor selecciona el texto manualmente.');
                });
            });
        }

        // --- LÓGICA DE VIDEOS ---
        const player = document.getElementById('main-vid-player');
        const btns = [
            document.getElementById('btn-v1'), document.getElementById('btn-v2'), 
            document.getElementById('btn-v3'), document.getElementById('btn-v4'),
            document.getElementById('btn-v5')
        ];
        
        const urls = [
            "https://drive.google.com/file/d/10mn959hCZX-IZ9DzVDKpB4mwIsxD2Sl0/preview",
            "https://drive.google.com/file/d/1I9b3cdc1ZxkVBn082kuCFapnLZ7ve21N/preview",
            "https://drive.google.com/file/d/1-kN0tv0---GzCwzlq21srIeF9AyKOAas/preview",
            "https://drive.google.com/file/d/1joSq8J4dyUqi0PuBGGgpjAQOPNf0onyk/preview",
            "https://drive.google.com/file/d/17yDK0sZhvRsU9se90kYgOJGD-YMpyfZp/preview"
        ];

        btns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                player.src = urls[index];
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
