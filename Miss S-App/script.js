const brightness = document.getElementById('brightness');
const temperature = document.getElementById('temperature');
const brightnessValue = document.getElementById('brightnessValue');
const tempValue = document.getElementById('tempValue');
const controls = document.getElementById('controls');
const menuButton = document.getElementById('menuButton');
const breathingHint = document.getElementById('breathingHint');
const colorPicker = document.getElementById('colorPicker');
const colorModeBtn = document.getElementById('colorModeBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenIcon = fullscreenBtn.querySelector('.material-symbols-rounded');

let startY = 0;
let startX = 0;
let lastY = 0;
let lastX = 0;
let isGestureStarted = false;
let isColorMode = false;

// 添加呼吸效果控制
const breathingToggle = document.getElementById('breathingToggle');
let isBreathingEnabled = false;

function startBreathingEffect() {
    document.querySelectorAll('.orb').forEach(orb => {
        orb.classList.add('breathing');
        // 为每个orb设置稍微不同的动画延迟，创造更自然的效果
        orb.style.animationDelay = Math.random() * 2 + 's';
    });
}

function stopBreathingEffect() {
    document.querySelectorAll('.orb').forEach(orb => {
        orb.classList.remove('breathing');
        orb.style.animationDelay = '0s';
    });
}

breathingToggle.addEventListener('click', () => {
    isBreathingEnabled = !isBreathingEnabled;
    breathingToggle.classList.toggle('active');
    
    if (isBreathingEnabled) {
        startBreathingEffect();
    } else {
        stopBreathingEffect();
    }
});

// 初始化呼吸效果
function initBreathingEffect() {
    // 默认关闭呼吸效果
    stopBreathingEffect();
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initBreathingEffect);

function kelvinToRGB(kelvin) {
    const temp = kelvin / 100;
    let r, g, b;

    if (temp <= 66) {
        r = 255;
        g = temp;
        g = 99.4708025861 * Math.log(g) - 161.1195681661;
        if (temp <= 19) {
            b = 0;
        } else {
            b = temp - 10;
            b = 138.5177312231 * Math.log(b) - 305.0447927307;
        }
    } else {
        r = temp - 60;
        r = 329.698727446 * Math.pow(r, -0.1332047592);
        g = temp - 60;
        g = 288.1221695283 * Math.pow(g, -0.0755148492);
        b = 255;
    }

    return {
        r: Math.min(255, Math.max(0, Math.round(r))),
        g: Math.min(255, Math.max(0, Math.round(g))),
        b: Math.min(255, Math.max(0, Math.round(b)))
    };
}

function updateLight() {
    requestAnimationFrame(() => {
        const bright = brightness.value;
        
        if (isColorMode) {
            const color = hexToRgb(colorPicker.value);
            updateLightWithColor(color);
        } else {
            const temp = temperature.value;
            const rgb = kelvinToRGB(temp);
            
            brightnessValue.textContent = bright + '%';
            tempValue.textContent = temp + 'K';
            
            const normalizedBrightness = bright / 100;
            document.body.style.backgroundColor = 
                `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${normalizedBrightness})`;
            
            const glowIntensity = Math.min(1, normalizedBrightness * 0.7);
            document.documentElement.style.setProperty(
                '--primary-color', 
                `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowIntensity})`
            );
        }
    });
}

function showBreathingHint() {
    breathingHint.style.opacity = '1';
    setTimeout(() => {
        breathingHint.style.opacity = '0';
    }, 2000);
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + range * easeProgress;
        
        element.value = current;
        updateLight();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        lastY = startY;
        lastX = startX;
        isGestureStarted = true;
        showBreathingHint();
    }
});

document.addEventListener('touchmove', (e) => {
    if (!isGestureStarted) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = (lastY - currentY) * 0.3;
    const deltaX = (currentX - lastX) * 0.3;
    
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
        const currentBrightness = parseFloat(brightness.value);
        brightness.value = Math.max(0, Math.min(200, currentBrightness + deltaY));
    } else {
        const currentTemp = parseFloat(temperature.value);
        temperature.value = Math.max(2000, Math.min(6500, currentTemp + deltaX * 2));
    }
    
    lastY = currentY;
    lastX = currentX;
    updateLight();
});

document.addEventListener('touchend', () => {
    isGestureStarted = false;
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        isColorMode = false;
        colorModeBtn.classList.remove('mode-active');
        colorPicker.parentElement.classList.remove('mode-active');
        
        const targetBrightness = parseInt(btn.dataset.brightness);
        const targetTemp = parseInt(btn.dataset.temp);
        
        animateValue(brightness, parseFloat(brightness.value), targetBrightness, 500);
        animateValue(temperature, parseFloat(temperature.value), targetTemp, 500);
    });
});

menuButton.addEventListener('click', () => {
    controls.classList.toggle('hidden');
    menuButton.classList.toggle('active');
});

brightness.addEventListener('input', updateLight);
temperature.addEventListener('input', updateLight);

document.addEventListener('dblclick', (e) => {
    if (e.target.closest('.controls')) return;
    
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

function toggleColorMode() {
    isColorMode = !isColorMode;
    colorModeBtn.classList.toggle('mode-active');
    colorPicker.parentElement.classList.toggle('mode-active');
    
    if (isColorMode) {
        const color = hexToRgb(colorPicker.value);
        updateLightWithColor(color);
    } else {
        updateLight();
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function updateLightWithColor(color) {
    const bright = brightness.value;
    brightnessValue.textContent = bright + '%';
    tempValue.textContent = '自定义';
    
    document.body.style.backgroundColor = 
        `rgba(${color.r}, ${color.g}, ${color.b}, ${bright / 100})`;
    document.documentElement.style.setProperty(
        '--primary-color', 
        `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`
    );
}

colorPicker.addEventListener('input', () => {
    if (isColorMode) {
        const color = hexToRgb(colorPicker.value);
        updateLightWithColor(color);
    }
});

colorModeBtn.addEventListener('click', toggleColorMode);

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenIcon.textContent = 'fullscreen_exit';
    } else {
        document.exitFullscreen();
        fullscreenIcon.textContent = 'fullscreen';
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenIcon.textContent = 'fullscreen_exit';
    } else {
        fullscreenIcon.textContent = 'fullscreen';
    }
});

updateLight();

// 更新预设按钮的数据属性
const presets = {
    'high': { brightness: 200, temp: 6500 },  // 最高亮度
    'natural': { brightness: 150, temp: 5000 }, // 增强自然光
    'soft': { brightness: 100, temp: 3500 },   // 标准柔和
    'dark': { brightness: 50, temp: 2700 }     // 暗调
};

// 更新预设按钮的数据属性
document.querySelectorAll('.preset-btn').forEach((btn, index) => {
    const presetName = ['high', 'natural', 'soft', 'dark'][index];
    const preset = presets[presetName];
    btn.dataset.brightness = preset.brightness;
    btn.dataset.temp = preset.temp;
});