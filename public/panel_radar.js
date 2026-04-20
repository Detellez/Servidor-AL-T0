(function() {
    'use strict';

    // ==========================================
    // 🌐 PANEL INTELIGENTE V12 (MODO COLLECTION - TOP LEFT)
    // ==========================================
    const CEREBRO_URL = 'https://script.google.com/macros/s/AKfycbx2MmJpsF1jgwyhmH4AuYpOoRQKv4U6AEo9HQiDv7LxXx8TR3qNHFLczu1TyCMvCAsl/exec';
    const API_URL = CEREBRO_URL;
    const SECURITY_TOKEN = 'SST_V12_CORP_SECURE_2026_X9';

    // Variables globales para el radar Auto Ping
    let isPinging = false;
    let isPaused = false;
    let pingDirection = 'top'; 
    let pingCount = 0;

    // --- EXTRAER USUARIO NATIVO (JSON PARSE) ---
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

    // ==========================================
    // 2. UTILIDADES DE UI Y NOTIFICACIONES
    // ==========================================

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

    // 🔥 NUEVA FUNCIÓN DE ESTILOS DE BOTONES (TEMA CLARO)
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

    // Paleta de colores idéntica a los botones de tu otro script
    const btnThemes = {
        blue: { bg: '#eff6ff', text: '#3b82f6', border: '1px solid #93c5fd', hBg: '#dbeafe', hText: '#2563eb', hBorder: '1px solid #3b82f6' },
        purple: { bg: '#f5f3ff', text: '#8b5cf6', border: '1px solid #a78bfa', hBg: '#ede9fe', hText: '#7c3aed', hBorder: '1px solid #8b5cf6' },
        red: { bg: '#fef2f2', text: '#ef4444', border: '1px solid #fca5a5', hBg: '#fee2e2', hText: '#dc2626', hBorder: '1px solid #ef4444' },
        orange: { bg: '#fff7ed', text: '#d97706', border: '1px solid #fdba74', hBg: '#ffedd5', hText: '#b45309', hBorder: '1px solid #d97706' },
        indigo: { bg: '#e0e7ff', text: '#6366f1', border: '1px solid #a5b4fc', hBg: '#c7d2fe', hText: '#4f46e5', hBorder: '1px solid #6366f1' }
    };

    // ==========================================
    // 3. CONSTRUCCIÓN DEL PANEL
    // ==========================================

    function buildPanel() {
        const urlActual = window.location.href;
        const origen = window.location.origin;
        const urlPermitida1 = origen + '/collection/#/';
        const urlPermitida2 = origen + '/collection/#';

        if (urlActual !== urlPermitida1 && urlActual !== urlPermitida2) {
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
            width: '45px', height: '45px', 
            backgroundColor: '#ffffff', color: '#1e293b', 
            borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer', fontSize: '22px', fontWeight: 'bold', transition: 'all 0.3s',
            border: '1px solid #cbd5e1', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
            pointerEvents: 'auto'
        });
        toggleBtn.innerHTML = '☰'; 
        toggleBtn.title = "Panel de Control";

        toggleBtn.onmouseenter = () => { toggleBtn.style.color = '#3b82f6'; toggleBtn.style.borderColor = '#3b82f6'; toggleBtn.style.transform = 'scale(1.05)'; };
        toggleBtn.onmouseleave = () => { toggleBtn.style.color = '#1e293b'; toggleBtn.style.borderColor = '#cbd5e1'; toggleBtn.style.transform = 'scale(1)'; };

        const menuContent = document.createElement('div');
        Object.assign(menuContent.style, {
            pointerEvents: 'auto',
            backgroundColor: '#ffffff', 
            padding: '15px', borderRadius: '14px', 
            display: 'none', flexDirection: 'column', gap: '8px', 
            width: '260px', border: '1px solid #cbd5e1',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15)',
            position: 'relative', marginTop: '10px', transformOrigin: 'top left' 
        });

        const hidePanel = () => {
            menuContent.style.display = 'none';
            toggleBtn.style.display = 'flex'; 
        };

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

        // --- BOTÓN 1: "ABRIR MI HOJA" ---
        const btnOpenSheet = document.createElement('button');
        btnOpenSheet.innerText = '📂 ABRIR MI HOJA';
        Object.assign(btnOpenSheet.style, {
            width: '100%', padding: '9px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '800', fontSize: '12px', marginBottom: '5px'
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
        menuContent.appendChild(btnOpenSheet);

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
                padding: '9px 5px', width: '100%', fontSize: '12px', borderRadius: '8px', cursor: 'pointer', 
                fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center'
            });
            animarBotonLight(btn, themeConfig);
            return btn;
        };

        let btnPingStart, btnPingAbajo, btnPingPause, btnPingRestart;

        // 🔥 FUNCIÓN RADAR (Colores adaptados a fondo claro)
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
                // Resalte adaptado a fondo blanco
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

        // --- BOTONES DEL RADAR (APLICANDO TEMAS) ---
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

        // Apagado inicialmente SOLO la Pausa.
        btnPingPause.disabled = true; btnPingPause.style.opacity = '0.5'; btnPingPause.style.cursor = 'not-allowed';

        gridPingTop.append(btnPingStart, btnPingPause);
        gridPingBottom.append(btnPingRestart, btnPingAbajo);
        pingContainer.append(gridPingTop, gridPingBottom);
        menuContent.appendChild(pingContainer);

        wrapper.append(toggleBtn, menuContent);
        document.body.appendChild(wrapper);
    }

    // ==========================================
    // 5. INICIALIZACIÓN Y MONITOREO
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

    buildPanel();

    let currentUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            buildPanel(); 
        }
    }).observe(document, { subtree: true, childList: true });

})();
