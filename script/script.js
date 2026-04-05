const canvas = document.getElementById('c');
const context = canvas.getContext('2d');
const debugElement = document.getElementById('debug');
const button = document.getElementById('btn');
const petals = [];

const petalCount = 50;

// let petalImg = new Image();
// petalImg.src = 'img/petal.png';
// //'img/bomb-2 (1).png';

const imagelist = [
    'img/cl.png','img/fl.png','img/Sax.png','img/Tb.png','img/Tp.png','img/Eu.png','img/Hr.png',
]

const userAgent = navigator.userAgent ?? navigator.vendor ?? window.opera;
const isIOS = /iPad|iPhone|iPod/.test(userAgent);
const isAndroid = /Android/.test(userAgent);
const osSigh = isIOS ? -1 : 1;

let tiltX = 0;
let tiltY = 0;

function rand(a, b) {
    return a + Math.random() * (b - a);
}

function clamp(x, min, max) {
    // x の値を範囲 [min, max] に制限する
    if (x > max) {
        return max;
    } else if (x < min) {
        return min;
    } else {
        return x;
    }
}

function resize() {
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function generatePetal(fromTop = true) {
    const petal = {};
    petal.x = rand(0,innerWidth);
    petal.y = fromTop ? rand(-innerHeight * 0.2, 0) : rand(0, innerHeight);
    petal.size = rand(32, 64);
    petal.angle = rand(0, 2 * Math.PI);
    petal.alpha = rand(1);
    petal.fallSpeed = rand(40, 90);
    petal.driftSpeed = rand(-15, 15);
    petal.rotateSpeed = rand((-Math.PI * 2) / 3, (Math.PI * 2) / 3);
    //petal.swayPhase = rand(0, 2 * Math.PI);                          // 揺れの初期位相
    //petal.swayAmp = rand(4, 16);                                     // 揺れの振幅
    //petal.swayPhaseSpeed = rand(0.6, 1.6);
    let petalImg = new Image();
    const imagenum = Math.floor(rand(0, 7));
    console.log(imagenum)
    petalImg.src = imagelist[imagenum];
    petal.image = petalImg
    return petal;
}

function generatePetals(petalCount) {
    for (let i = 0; i < petalCount; i++) {
        const petal = generatePetal(false);
        petals.push(petal);
    }
}

let last = performance.now();

function drawPetals(petals) {
    // if (!petalImg.complete) return;


    petals.forEach((petal) => {
        // (x, y)を中心に、angle(度)回転した花びらを size の大きさで描画
        context.save();

        context.translate(petal.x, petal.y);
        context.rotate(petal.angle);
        context.globalAlpha = petal.alpha;

        const width = petal.size;
        const height = petal.size;
        context.drawImage(petal.image, -width / 2, -height / 2, width, height);

        context.restore();
    });
}

function normalizeScreenAxes(accelX, accelY) {
    const screenAngle = ((getScreenAngle() % 360) + 360) % 360; // 角度を 0°~360° に正規化

    let virtualAccelX;
    let virtualAccelY;

    if (screenAngle === 0) {
        virtualAccelX = accelX;
        virtualAccelY = accelY;
    } else if (screenAngle === 90) {
        virtualAccelX = accelX;
        virtualAccelY = -accelY;
    } else if (screenAngle === 180) {
        virtualAccelX = -accelX;
        virtualAccelY = -accelY;
    } else if (screenAngle === 270) {
        virtualAccelX = -accelX;
        virtualAccelY = accelY;
    }

    return {virtualAccelX, virtualAccelY, screenAngle};
}

function onMotion(e) {
    const acceleration = e.accelerationIncludingGravity;
    if (!acceleration) return;

    const accelX = -(acceleration.x ?? 0) * osSign;
    const accelY = (acceleration.y ?? 0) * osSign;

    const {virtualAccelX, virtualAccelY, screenAngle} = normalizeScreenAxes(
        accelX,
        accelY
    );

    // 傾け度合いを [-1, 1] の範囲で設定する
    tiltX = clamp(virtualAccelX / 9.8, -1, 1);
    tiltY = clamp(virtualAccelY / 9.8, -1, 1);

    if (debugElement !== null) {
        debugElement.textContent = `OS:${isIOS ? 'IOS' : isAndroid ? 'android' : 'Other'} angle:${screenAngle} tiltX:${tiltX.toFixed(2)} tiltY:${tiltY.toFixed(2)}`;
    }
}

function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    context.clearRect(0, 0, innerWidth, innerHeight);
    context.fillStyle = 'rgba(11,16,32,1)';
    context.fillRect(0, 0, innerWidth, innerHeight);

    const wind = tiltX * 90;
    const gravityBoost = tiltY * 20;

    for (let i = 0; i < petals.length; i++) {
        const petal = petals[i];
        //petal.swayPhase += petal.swayPhaseSpeed * dt;
        ///const swaySpeed = petal.swayAmp * Math.sin(petal.swayPhase);

        const speedX = petal.driftSpeed + wind;
        const speedY = petal.fallSpeed + gravityBoost;

        //const speedX = petal.driftSpeed;// + swaySpeed
        //const speedY = petal.fallSpeed;

        petal.x += speedX * dt;
        petal.y += speedY * dt;
        petal.angle =+ petal.rotateSpeed * dt;

        if (
            petal.y > innerHeight + 64 ||
            petal.x < -60 ||
            petal.x > innerWidth + 60
        ) {
            const newPetal = generatePetal();

            // 傾きがあるときに描画位置を調整
            if (wind > 30) {
                newPetal.x = rand(-30, innerWidth * 0.2);
            }
            if (wind < -30) {
                newPetal.x = rand(innerWidth * 0.8, innerWidth + 30);
            }

            // 既存の petal を newPetal と入れ替え
            petals[i] = newPetal;
        }
    }
    drawPetals(petals);
    requestAnimationFrame(tick);
}

window.addEventListener('resize', resize);

window.addEventListener('DOMContentLoaded', () => {
    resize();
    generatePetals(petalCount);
    console.log(petals);
    //drawPetals(petals);
    tick(performance.now());
});

btn.addEventListener('click', async () => {
    try {
        if (
            typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function'
        ) {
            const res = await DeviceMotionEvent.requestPermission();
            if (res !== 'granted') {
                btn.textContent = '許可されませんでした';
                return;
            }
        }
        window.addEventListener('devicemotion', onMotion, {passive: true});
        btn.textContent = '許可OK';
        btn.disabled = true;
    } catch (err) {
        btn.textContent = '失敗しました';
    }
});