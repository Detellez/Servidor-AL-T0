(function() {
    'use strict';

    // 👇 PON AQUÍ TU NUEVO ID O ENLACE DEL SERVIDOR 👇
    const NUEVO_ID_SERVIDOR = "El que te corresponde a tu equipo";
    // 👆 ========================================== 👆

    function inyectarBloqueo() {
        if (document.getElementById('caja-negra-bloqueo')) return;

        // Overlay base (Pantalla Completa Real)
        const overlay = document.createElement('div');
        overlay.id = 'caja-negra-bloqueo';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: '#0f172a', 
            zIndex: '2147483647', display: 'flex', flexDirection: 'column',
            fontFamily: "'Segoe UI', Roboto, sans-serif", boxSizing: 'border-box',
            margin: '0', padding: '0', overflow: 'hidden'
        });

        overlay.innerHTML = `
            <div style="padding: 15px 30px; text-align: center; background: rgba(0,0,0,0.4); border-bottom: 2px solid #ef4444; box-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <span style="font-size: 45px; animation: pulse 2s infinite;">⚠️</span>
                    <div style="text-align: left;">
                        <h2 style="color: #ef4444; margin: 0 0 4px 0; font-weight: 900; text-transform: uppercase; font-size: 26px; letter-spacing: 1px;">
                            Descargar Nueva Versión 
                        </h2>
                        <p style="color: #cbd5e1; margin: 0; font-size: 16px;">
                            El ID de Servidor que corresponde a tu equipo es: 
                            <span style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; padding: 4px 12px; border-radius: 6px; border: 2px dashed #fbbf24; font-family: monospace; font-size: 20px; font-weight: bold; margin-left: 10px; display: inline-block;">
                                ${NUEVO_ID_SERVIDOR}
                            </span>
                        </p>
                    </div>
                </div>

                <div style="text-align: right; background: rgba(255,255,255,0.03); padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); min-width: 250px;">
                    <span style="color: #9ca3af; font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 4px;">Navegadores Soportados:</span>
                    <span style="color: #38bdf8; font-weight: bold; font-size: 14px; display: block;">✓ Google Chrome</span>
                    <span style="color: #38bdf8; font-weight: bold; font-size: 14px; display: block;">✓ Brave Browser</span>
                    <span style="color: #38bdf8; font-weight: bold; font-size: 14px; display: block;">✓ Microsoft Edge</span>
                    <span style="color: #f87171; font-weight: bold; font-size: 11px; text-transform: uppercase; display: block; margin-top: 4px; letter-spacing: 0.5px;">❌ Incompatible con Firefox</span>
                </div>
            </div>

            <div style="display: flex; flex: 1; width: 100%; overflow: hidden;">
                
                <div style="flex: 1; display: flex; flex-direction: column; border-right: 2px solid #1e293b; background: #000;">
                    <div style="background: #1e293b; color: #38bdf8; text-align: center; padding: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-size: 16px; border-bottom: 1px solid #0f172a;">
                        🎥 PASO 1: CÓMO VER TU ID
                    </div>
                    <div style="flex: 1; position: relative; display: flex; justify-content: center; align-items: center; padding: 30px;">
                        <video src="https://i.imgur.com/htOJShz.mp4" autoplay loop muted playsinline style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 0 40px rgba(56,189,248,0.15);"></video>
                    </div>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; background: #000;">
                    <div style="background: #1e293b; color: #10b981; text-align: center; padding: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-size: 16px; border-bottom: 1px solid #0f172a;">
                        📝 PASO 2: DÓNDE PEGARLO
                    </div>
                    <div style="flex: 1; position: relative; display: flex; justify-content: center; align-items: center; padding: 30px;">
                        <img src="https://i.imgur.com/G261GWI.png" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 0 40px rgba(16,185,129,0.15);" />
                    </div>
                </div>

            </div>

            <a href="https://www.dropbox.com/scl/fi/bz6uea21ijpwnswg70m8m/maxCREDIMAXcrm.zip?rlkey=sev71jnwxaz9tv9zapya1stlu&st=4d4ed34j&dl=1" target="_blank" 
               style="display: flex; align-items: center; justify-content: center; background: linear-gradient(to right, #059669, #10b981, #059669); color: white; text-decoration: none; padding: 25px 0; font-weight: 900; font-size: 32px; text-transform: uppercase; letter-spacing: 3px; width: 100%; box-sizing: border-box; transition: background 0.3s; text-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 2;"
               onmouseover="this.style.background='linear-gradient(to right, #047857, #059669, #047857)';"
               onmouseout="this.style.background='linear-gradient(to right, #059669, #10b981, #059669)';">
               <span style="font-size: 40px; margin-right: 20px;">⬇️</span> DESCARGAR NUEVA EXTENSION CREDIMAX
            </a>
        `;

        const style = document.createElement('style');
        style.innerHTML = `@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.15); } 100% { opacity: 1; transform: scale(1); } }`;
        document.head.appendChild(style);

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden'; 
        document.documentElement.appendChild(overlay);
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
