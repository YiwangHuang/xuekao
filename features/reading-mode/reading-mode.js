(function() {
    const config = window.featureConfigs.readingMode || {
        readingModeText: "阅读模式",
        hiddenModeText: "挖空模式",
        underlineColor: "black",
        textColor: "blue",
        position: "top-right"
    };

    // 创建按钮
    const button = document.createElement('button');
    button.className = 'feature-button theme-green position-2';
    button.textContent = config.readingModeText;
    document.body.appendChild(button);

    // 设置 CSS 变量
    document.documentElement.style.setProperty('--underline-color', config.underlineColor);
    document.documentElement.style.setProperty('--text-color', config.textColor);

    const elements = document.querySelectorAll('u');
    let isClickMode = false;

    // 模式切换事件
    button.addEventListener("click", function() {
        isClickMode = !isClickMode;
        
        elements.forEach(element => {
            if (isClickMode) {
                element.classList.add('hidden-text');
            } else {
                element.classList.remove('hidden-text');
            }
        });
        
        button.textContent = isClickMode ? config.hiddenModeText : config.readingModeText;
    });

    // 单个元素点击事件
    elements.forEach(element => {
        element.addEventListener('click', () => {
            if (isClickMode) {
                element.classList.toggle('hidden-text');
            }
        });
    });

    // 键盘事件
    document.addEventListener('keydown', (event) => {
        if (isClickMode) {
            if (event.key === 'ArrowRight') {
                let lastVisibleIndex = -1;
                elements.forEach((element, index) => {
                    if (!element.classList.contains('hidden-text')) {
                        lastVisibleIndex = index;
                    }
                });
                for (let i = lastVisibleIndex + 1; i < elements.length; i++) {
                    if (elements[i].classList.contains('hidden-text')) {
                        elements[i].classList.remove('hidden-text');
                        break;
                    }
                }
            } else if (event.key === 'ArrowLeft') {
                for (let i = elements.length - 1; i >= 0; i--) {
                    if (!elements[i].classList.contains('hidden-text')) {
                        elements[i].classList.add('hidden-text');
                        break;
                    }
                }
            }
        }
    });
})(); 