// =============================================
//  川犬 — VTuber Official Site
//  Interactions & Particle Background
// =============================================
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

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

    // タイムライン — iframe 読み込み完了後に電源ON以降を開始
    // Phase 1: モニター登場（即時、まだ暗い）
    // ... → iframe 読み込み完了を待つ
    // Phase 2〜: 電源ON → 画面表示 → ズームイン → フェードアウト

    function startBootAnimation() {
        const DELAY = {
            POWER_ON: 200,      // iframe読み込み完了から
            SCREEN_ON: 900,
            ZOOM_IN: 1500,
            FADE_OUT: 2600,
            CLEANUP: 3100,
        };

        setTimeout(() => {
            overlay.classList.add('phase-power-on');
        }, DELAY.POWER_ON);

        setTimeout(() => {
            overlay.classList.add('phase-screen-on');
        }, DELAY.SCREEN_ON);

        // Phase 4: ズームイン
        setTimeout(() => {
            if (screenContent && monitor) {
                const screenW = screenContent.offsetWidth;
                const screenH = screenContent.offsetHeight;
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                const Z = Math.max(vw / screenW, vh / screenH);

                const monitorRect = monitor.getBoundingClientRect();
                const screenRect = screenContent.getBoundingClientRect();
                const sx = screenRect.left - monitorRect.left;
                const sy = screenRect.top - monitorRect.top;
                const mx = monitorRect.left;
                const my = monitorRect.top;

                const ox = (-mx - sx * Z) / (1 - Z);
                const oy = (-my - sy * Z) / (1 - Z);
                monitor.style.transformOrigin = `${ox}px ${oy}px`;

                monitor.style.setProperty('--zoom-scale', Z.toFixed(4));
            }
            overlay.classList.add('phase-zoom-in');
        }, DELAY.ZOOM_IN);

        // Phase 5: フェードアウト
        setTimeout(() => {
            overlay.classList.add('phase-fade-out');
        }, DELAY.FADE_OUT);

        // Cleanup
        setTimeout(() => {
            overlay.remove();
            document.body.classList.remove('monitor-booting');
            window.removeEventListener('resize', adaptMonitorToViewport);
        }, DELAY.CLEANUP);
    }

    // iframe 読み込み完了を待ってからアニメーション開始
    if (iframe) {
        let started = false;
        const go = () => { if (!started) { started = true; startBootAnimation(); } };
        iframe.addEventListener('load', go, { once: true });
        // 安全タイムアウト（5秒で強制開始）
        setTimeout(go, 5000);
    } else {
        startBootAnimation();
    }
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

// --- ドロップダウン制御 ---
const dropdowns = document.querySelectorAll('.nav-dropdown');

dropdowns.forEach(dd => {
    const toggle = dd.querySelector('.nav-dropdown-toggle');
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dd.classList.contains('open');
        // 他のドロップダウンを閉じる
        dropdowns.forEach(d => {
            d.classList.remove('open');
            d.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
            dd.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
        }
    });
});

// 外部クリックでドロップダウンを閉じる
document.addEventListener('click', () => {
    dropdowns.forEach(d => {
        d.classList.remove('open');
        d.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
    });
});

// ESCキーでドロップダウンを閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        dropdowns.forEach(d => {
            d.classList.remove('open');
            d.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
        });
    }
});

// --- リンクセクション（カルーセル） ---
const LINKS_CATEGORY_ORDER = ['youtube', 'booth_trpg', 'booth_goods', 'x'];
const LINKS_NAV_IDS = {
    youtube: 'youtube',
    booth_trpg: 'scenarios',
    booth_goods: 'goods',
    x: 'x',
};
const LINKS_DESCRIPTIONS = {
    youtube: 'チャンネルを見る →',
    booth_trpg: 'ショップを見る →',
    booth_goods: 'ショップを見る →',
    x: 'フォローする →',
};

// リンクデータ読み込み: API自動取得 → フォールバック links.json
(async function loadLinks() {
    let linksData = {};
    try {
        // まず API で最新データを自動取得（editor-server.py 稼働時）
        const apiRes = await fetch('/api/fetch-links');
        if (!apiRes.ok) throw new Error(`API ${apiRes.status}`);
        const result = await apiRes.json();
        if (result.ok && result.data) {
            linksData = result.data;
            console.log('Links: API から最新データを取得');
            // キャッシュ保存（次回用、失敗しても無視）
            fetch('/api/save-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(linksData),
            }).catch(() => { });
        } else {
            throw new Error('API response not ok');
        }
    } catch {
        // API 未対応（GitHub Pages 等）→ キャッシュ JSON にフォールバック
        try {
            const jsonRes = await fetch('data/links.json?t=' + Date.now());
            if (jsonRes.ok) {
                linksData = await jsonRes.json();
                console.log('Links: キャッシュ JSON から読み込み');
            }
        } catch (e2) {
            console.error('リンクデータの読み込みに失敗:', e2);
        }
    }
    renderLinks(linksData);
})();

function renderLinks(linksData) {
    const container = document.getElementById('links-container');
    if (!container) return;

    LINKS_CATEGORY_ORDER.forEach(key => {
        const cat = linksData[key];
        if (!cat) return;

        const block = document.createElement('div');
        block.className = 'link-category';
        block.dataset.cat = key;
        if (LINKS_NAV_IDS[key]) block.id = LINKS_NAV_IDS[key];

        // ヘッダー
        const header = document.createElement('div');
        header.className = 'link-category-header';
        header.innerHTML = `
            <div class="link-category-icon">${cat.icon || ''}</div>
            <div class="link-category-title">${cat.label || key}</div>
            <a class="link-category-more" href="${cat.profileUrl || '#'}" target="_blank" rel="noopener">
                ${LINKS_DESCRIPTIONS[key] || ''}
            </a>
        `;
        block.appendChild(header);

        // X はリンクのみ
        if (key === 'x') {
            const simple = document.createElement('a');
            simple.className = 'link-card-simple';
            simple.href = cat.profileUrl || '#';
            simple.target = '_blank';
            simple.rel = 'noopener';
            simple.innerHTML = `
                <div style="flex:1;font-size:0.9rem;color:rgba(255,255,255,0.5);">主にTRPGに関するネタポストや配信・シナリオリリースの告知を行います。</div>
                <div class="link-arrow">→</div>
            `;
            block.appendChild(simple);
        } else if (cat.items && cat.items.length > 0) {
            // カルーセル
            const wrapper = document.createElement('div');
            wrapper.className = 'carousel-wrapper';

            const btnLeft = document.createElement('button');
            btnLeft.className = 'carousel-btn carousel-btn-left';
            btnLeft.setAttribute('aria-label', '前へ');
            btnLeft.textContent = '‹';

            const btnRight = document.createElement('button');
            btnRight.className = 'carousel-btn carousel-btn-right';
            btnRight.setAttribute('aria-label', '次へ');
            btnRight.textContent = '›';

            const track = document.createElement('div');
            track.className = 'carousel-track';

            cat.items.forEach(item => {
                const card = document.createElement('a');
                card.className = 'content-card';
                card.href = item.url || '#';
                card.target = '_blank';
                card.rel = 'noopener';

                const thumbHtml = item.thumb
                    ? `<div class="content-card-thumb"><img src="${item.thumb}" alt="" loading="lazy"></div>`
                    : '';
                const meta = item.date || item.description || '';

                card.innerHTML = `
                    ${thumbHtml}
                    <div class="content-card-info">
                        <div class="content-card-title">${item.title || ''}</div>
                        <div class="content-card-meta">${meta}</div>
                    </div>
                `;
                track.appendChild(card);
            });

            wrapper.appendChild(btnLeft);
            wrapper.appendChild(track);
            wrapper.appendChild(btnRight);
            block.appendChild(wrapper);

            // カルーセル操作
            setupCarousel(track, btnLeft, btnRight);
        }

        container.appendChild(block);
    });

    // スクロールリビールに登録
    container.querySelectorAll('.link-category').forEach(el => revealObserver.observe(el));
}

// --- カルーセル操作 ---
function setupCarousel(track, btnLeft, btnRight) {
    const scrollAmount = 234; // card width (220) + gap (14)

    // 矢印ボタンクリック
    btnLeft.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    btnRight.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // 矢印の表示/非表示 + 末端ハイライト
    function updateArrows() {
        const sl = track.scrollLeft;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const atEnd = sl >= maxScroll - 10;
        btnLeft.classList.toggle('visible', sl > 30);
        btnRight.classList.toggle('visible', !atEnd);

        // 末端到達時: 「もっと見る」リンクを強調
        const block = track.closest('.link-category');
        const moreLink = block ? block.querySelector('.link-category-more') : null;
        if (moreLink) moreLink.classList.toggle('highlight', atEnd);
    }
    track.addEventListener('scroll', updateArrows);
    // 初回チェック（レンダリング後に実行）
    requestAnimationFrame(() => requestAnimationFrame(updateArrows));

    // ドラッグスクロール
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;

    track.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX;
        scrollStart = track.scrollLeft;
        track.classList.add('dragging');
    });

    track.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.pageX - startX;
        track.scrollLeft = scrollStart - dx;
    });

    const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('dragging');
    };
    track.addEventListener('mouseup', stopDrag);
    track.addEventListener('mouseleave', stopDrag);

    // ドラッグ中のリンククリック防止
    track.addEventListener('click', (e) => {
        if (Math.abs(track.scrollLeft - scrollStart) > 5) {
            e.preventDefault();
        }
    }, true);
}
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
        group.id = `year-${yearGroup.year}`;

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

    // Achievements ドロップダウンに年リストを動的注入
    const yearMenu = document.getElementById('achievements-year-menu');
    if (yearMenu && ACHIEVEMENTS_DATA.length > 0) {
        yearMenu.innerHTML = '';
        // 「全体を見る」リンク
        const allLink = document.createElement('a');
        allLink.href = '#achievements';
        allLink.textContent = 'All';
        yearMenu.appendChild(allLink);
        // 各年リンク
        ACHIEVEMENTS_DATA.forEach(yg => {
            const a = document.createElement('a');
            a.href = `#year-${yg.year}`;
            a.textContent = yg.year;
            yearMenu.appendChild(a);
        });
    }
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

// --- スムーズスクロール（ナビリンク + ドロップダウンリンク） ---
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                // ドロップダウンを閉じる
                dropdowns.forEach(d => {
                    d.classList.remove('open');
                    d.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
                });
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}
setupSmoothScroll();

// ドロップダウン内のリンクが動的に追加された場合に再バインド
const smoothScrollObserver = new MutationObserver(() => setupSmoothScroll());
const yearMenuEl = document.getElementById('achievements-year-menu');
if (yearMenuEl) smoothScrollObserver.observe(yearMenuEl, { childList: true });

// --- About ランダム一言 ---
const aboutRandomEl = document.getElementById('about-random');
if (aboutRandomEl) {
    const randomPhrases = [
        '苦手な食べ物は牡蠣。',
        '得意料理はオムライス。',
        '好きなお菓子はマカロン。',
        '好きな食べ物はなす。',
        '1d100で100を出すことに快感を覚える。',
        '1d100で1を出すことに快感を覚える。',
        'ここぞというダイスロールで「運命の、ダイスロール！」と叫ぶ。',
        '毎日が楽しい。',
        '川犬の正式名称は川出犬流（かわでけんる）。',
        '最近はTRPG関連のミニゲームを作ったりするのにハマってるらしい。',
    ];
    aboutRandomEl.textContent = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
}

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

// --- カスタムカテゴリセレクト ---
const customSelect = document.getElementById('category-select');
if (customSelect) {
    const toggle = customSelect.querySelector('.form-custom-select-toggle');
    const textEl = customSelect.querySelector('.form-custom-select-text');
    const hiddenInput = document.getElementById('contact-category');
    const options = customSelect.querySelectorAll('.form-custom-select-option');

    // トグル開閉
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
    });

    // 選択肢クリック
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            textEl.textContent = opt.textContent;
            hiddenInput.value = opt.dataset.value;
            customSelect.classList.remove('open');
        });
    });

    // 外部クリックで閉じる
    document.addEventListener('click', () => customSelect.classList.remove('open'));
    customSelect.addEventListener('click', (e) => e.stopPropagation());
}

// --- お問い合わせフォーム ---
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ハニーポットチェック（ボットが隠しフィールドに入力していたら静かにブロック）
        const honeypot = document.getElementById('contact-website');
        if (honeypot && honeypot.value) {
            // ボットには成功したように見せる（再試行を防止）
            contactForm.style.display = 'none';
            const note = contactForm.parentElement.querySelector('.contact-note');
            if (note) note.style.display = 'none';
            document.getElementById('contact-success').classList.add('show');
            return;
        }

        const submitBtn = document.getElementById('contact-submit');
        const submitText = submitBtn.querySelector('.form-submit-text');
        const originalText = submitText.textContent;

        // 送信中の状態
        submitBtn.disabled = true;
        submitText.textContent = '送信中...';

        const action = contactForm.getAttribute('action');
        const formData = new FormData(contactForm);

        try {
            // Formspree が設定されている場合は実際に送信
            if (action && action !== '#') {
                const res = await fetch(action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' },
                });
                if (!res.ok) throw new Error('送信エラー');
            }

            // 送信完了UI
            contactForm.style.display = 'none';
            const note = contactForm.parentElement.querySelector('.contact-note');
            if (note) note.style.display = 'none';
            document.getElementById('contact-success').classList.add('show');
        } catch (err) {
            console.error('フォーム送信エラー:', err);
            submitText.textContent = 'エラー — もう一度お試しください';
            setTimeout(() => {
                submitText.textContent = originalText;
                submitBtn.disabled = false;
            }, 3000);
        }
    });
}
