// =============================================
//  川犬 — VTuber Official Site
//  Interactions & Particle Background
// =============================================

// --- モニター電源ON → ズームイン演出 ---
(function monitorBootSequence() {
    // ?noboot=1 の場合はブート演出をスキップ（iframe内での読み込み時）
    const params = new URLSearchParams(window.location.search);
    if (params.get('noboot') === '1') {
        const overlay = document.getElementById('boot-overlay');
        if (overlay) overlay.remove();
        document.body.classList.remove('monitor-booting');
        return;
    }

    const overlay = document.getElementById('boot-overlay');
    if (!overlay) return;

    // --- SVGモニターをビューポート比率に合わせて動的調整 ---
    const svg = document.querySelector('.monitor-svg');
    const screenContent = document.querySelector('.monitor-screen-content');
    const iframe = document.querySelector('.screen-iframe');
    const monitor = document.querySelector('.boot-monitor');

    function adaptMonitorToViewport() {
        if (!svg || !screenContent || !monitor) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const aspect = vw / vh; // e.g. 1.78 for 16:9

        // SVG座標系（画面幅は636固定、高さをアスペクト比で調整）
        const scrW = 636;
        const scrH = Math.round(scrW / aspect);
        const scrX = 82;
        const scrY = 42;

        // ベゼル（画面の周囲にパディング）
        const bezPad = 10;
        const framePad = 22;

        const innerX = scrX - bezPad;
        const innerY = scrY - bezPad;
        const innerW = scrW + bezPad * 2;
        const innerH = scrH + bezPad * 2;

        const outerX = scrX - framePad;
        const outerY = scrY - framePad;
        const outerW = scrW + framePad * 2;
        const outerH = scrH + framePad * 2;

        // LED・スタンド位置
        const ledY = outerY + outerH + 8;
        const brandY = ledY - 6;
        const standTopY = ledY + 12;
        const standBotY = standTopY + 50;
        const baseY = standBotY + 15;
        const viewBoxH = baseY + 30;
        const cx = 400; // 横中央

        // SVG viewBox更新
        svg.setAttribute('viewBox', `0 0 800 ${viewBoxH}`);

        // rects更新（順番: outerBezel, innerBezel, screen, glow, reflection）
        const rects = svg.querySelectorAll('rect');
        // outer bezel (index 0)
        rects[0].setAttribute('x', outerX);
        rects[0].setAttribute('y', outerY);
        rects[0].setAttribute('width', outerW);
        rects[0].setAttribute('height', outerH);
        // inner bezel (index 1)
        rects[1].setAttribute('x', innerX);
        rects[1].setAttribute('y', innerY);
        rects[1].setAttribute('width', innerW);
        rects[1].setAttribute('height', innerH);
        // screen, glow, reflection (index 2, 3, 4) — same dimensions
        for (let i = 2; i <= 4; i++) {
            rects[i].setAttribute('x', scrX);
            rects[i].setAttribute('y', scrY);
            rects[i].setAttribute('width', scrW);
            rects[i].setAttribute('height', scrH);
        }

        // brand line
        const brandLine = svg.querySelector('rect[fill="#222228"]');
        if (brandLine) {
            brandLine.setAttribute('y', brandY);
        }

        // LED
        const led = svg.querySelector('.monitor-led');
        if (led) led.setAttribute('cy', ledY);

        // スタンド（首）
        const standPath = svg.querySelector('path');
        if (standPath) {
            standPath.setAttribute('d',
                `M350 ${standTopY} L350 ${standBotY} Q350 ${standBotY + 10} 360 ${standBotY + 10} L440 ${standBotY + 10} Q450 ${standBotY + 10} 450 ${standBotY} L450 ${standTopY}`
            );
        }

        // ベース（楕円2つ）
        const ellipses = svg.querySelectorAll('ellipse');
        if (ellipses[0]) {
            ellipses[0].setAttribute('cy', baseY);
        }
        if (ellipses[1]) {
            ellipses[1].setAttribute('cy', baseY - 3);
        }

        // iframe オーバーレイ位置（パーセント）
        const pctLeft = (scrX / 800) * 100;
        const pctTop = (scrY / viewBoxH) * 100;
        const pctWidth = (scrW / 800) * 100;
        const pctHeight = (scrH / viewBoxH) * 100;
        screenContent.style.left = pctLeft + '%';
        screenContent.style.top = pctTop + '%';
        screenContent.style.width = pctWidth + '%';
        screenContent.style.height = pctHeight + '%';

        // transform-origin（画面中央）
        const originX = ((scrX + scrW / 2) / 800) * 100;
        const originY = ((scrY + scrH / 2) / viewBoxH) * 100;
        monitor.style.transformOrigin = `${originX}% ${originY}%`;

        // iframe を実際のビューポートサイズで描画→縮小（完全一致のミニチュア）
        if (iframe) {
            iframe.style.width = vw + 'px';
            iframe.style.height = vh + 'px';
            const containerWidth = screenContent.offsetWidth || (monitor.offsetWidth * pctWidth / 100);
            const scale = containerWidth / vw;
            iframe.style.transform = `scale(${scale})`;
        }
    }

    adaptMonitorToViewport();
    window.addEventListener('resize', adaptMonitorToViewport);

    // タイムライン（ms）
    const PHASE = {
        APPEAR: 200,
        POWER_ON: 1600,
        SCREEN_ON: 2300,
        ZOOM_IN: 2900,
        FADE_OUT: 4000,
        CLEANUP: 4500,
    };

    // Phase 2: 電源ON
    setTimeout(() => {
        overlay.classList.add('phase-power-on');
    }, PHASE.POWER_ON);

    // Phase 3: 画面表示
    setTimeout(() => {
        overlay.classList.add('phase-screen-on');
    }, PHASE.SCREEN_ON);

    // Phase 4: ズームイン（位置・サイズ完全一致で計算）
    setTimeout(() => {
        if (screenContent && monitor) {
            const screenW = screenContent.offsetWidth;
            const screenH = screenContent.offsetHeight;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const Z = Math.max(vw / screenW, vh / screenH);

            // モニター内でのスクリーン位置（px）
            const monitorRect = monitor.getBoundingClientRect();
            const screenRect = screenContent.getBoundingClientRect();
            const sx = screenRect.left - monitorRect.left;
            const sy = screenRect.top - monitorRect.top;
            // モニターのビューポート内位置
            const mx = monitorRect.left;
            const my = monitorRect.top;

            // ズーム後にスクリーン左上がビューポート(0,0)に来るtransform-origin
            const ox = (-mx - sx * Z) / (1 - Z);
            const oy = (-my - sy * Z) / (1 - Z);
            monitor.style.transformOrigin = `${ox}px ${oy}px`;

            monitor.style.setProperty('--zoom-scale', Z.toFixed(4));
        }
        overlay.classList.add('phase-zoom-in');
    }, PHASE.ZOOM_IN);

    // Phase 5: フェードアウト
    setTimeout(() => {
        overlay.classList.add('phase-fade-out');
    }, PHASE.FADE_OUT);

    // Cleanup: DOM除去＋スクロール解除
    setTimeout(() => {
        overlay.remove();
        document.body.classList.remove('monitor-booting');
        window.removeEventListener('resize', adaptMonitorToViewport);
    }, PHASE.CLEANUP);
})();

// --- パーティクル背景 ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const particles = [];
const PARTICLE_COUNT = 60;

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += 0.02;

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        const o = this.opacity * (0.6 + Math.sin(this.pulse) * 0.4);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 106, ${o})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 106, ${o * 0.15})`;
        ctx.fill();
    }
}

for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
}

// Draw lines between nearby particles
function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const o = (1 - dist / 150) * 0.08;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(0, 255, 106, ${o})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });
    drawConnections();
}

animateParticles();

// --- ナビゲーション スクロール制御 ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// --- 実績タイムライン ---
// 外部JSONから実績データを読み込み（キャッシュ防止）
fetch('data/achievements.json?t=' + Date.now())
    .then(res => res.json())
    .then(data => renderAchievements(data))
    .catch(err => {
        console.error('実績データの読み込みに失敗:', err);
        renderAchievements([]);
    });

function renderAchievements(ACHIEVEMENTS_DATA) {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    const totalGroups = ACHIEVEMENTS_DATA.length;

    ACHIEVEMENTS_DATA.forEach((yearGroup, index) => {
        const isLeft = index % 2 === 0;
        const side = isLeft ? 'tl-left' : 'tl-right';

        // グループ間コネクタ（最初のグループ以外）
        if (index > 0) {
            const prevIsLeft = (index - 1) % 2 === 0;
            const connector = document.createElement('div');
            connector.className = `timeline-connector ${prevIsLeft ? 'timeline-connector-lr' : 'timeline-connector-rl'}`;
            container.appendChild(connector);
        }

        // グループコンテナ
        const group = document.createElement('div');
        group.className = `timeline-group ${side}`;

        // 年マーカー
        const yearDiv = document.createElement('div');
        yearDiv.className = 'timeline-year';
        yearDiv.innerHTML = `<span class="timeline-year-label">${yearGroup.year}</span>`;
        group.appendChild(yearDiv);

        // 各アイテム
        yearGroup.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'timeline-item';

            const isLink = !!item.url;
            const tag = isLink ? 'a' : 'div';
            const linkAttrs = isLink
                ? ` href="${item.url}" target="_blank" rel="noopener"`
                : '';
            const arrowHtml = isLink
                ? '<div class="link-arrow">→</div>'
                : '';

            let visualHtml;
            if (item.thumb) {
                visualHtml = `<img class="timeline-thumb" src="${item.thumb}" alt="" loading="lazy">`;
            } else {
                visualHtml = `<div class="timeline-icon">${item.icon || '📌'}</div>`;
            }

            itemDiv.innerHTML = `
                <${tag} class="timeline-card"${linkAttrs}>
                    ${visualHtml}
                    <div class="timeline-body">
                        <div class="timeline-title">${item.title}</div>
                        <div class="timeline-desc">${item.description}</div>
                        <div class="timeline-date">${item.date}</div>
                    </div>
                    ${arrowHtml}
                </${tag}>
            `;
            group.appendChild(itemDiv);
        });

        // 最後のグループにエンドマーカーを追加
        if (index === totalGroups - 1) {
            const endDiv = document.createElement('div');
            endDiv.className = 'timeline-end';
            endDiv.innerHTML = '<span class="timeline-end-label">— 現在に至る</span>';
            group.appendChild(endDiv);
        }

        container.appendChild(group);
    });

    // タイムライン要素をスクロールリビールに登録
    const timelineRevealEls = container.querySelectorAll('.timeline-year, .timeline-item, .timeline-end, .timeline-connector');
    timelineRevealEls.forEach(el => revealObserver.observe(el));
}

// --- スクロールリビール ---
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
});

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// --- スムーズスクロール（ナビリンク） ---
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// --- アバターホバーエフェクト ---
const avatar = document.getElementById('hero-avatar');
if (avatar) {
    avatar.addEventListener('mouseenter', () => {
        avatar.style.transform = 'scale(1.05)';
        avatar.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    });
    avatar.addEventListener('mouseleave', () => {
        avatar.style.transform = 'scale(1)';
    });
}
