(function() {
    // 获取配置
    const config = window.featureConfigs.randomNumber || {
        buttonText: '生成随机数',
        minNumber: 0,
        maxNumber: 50,
        displayTime: 5000,
        position: 'bottom-right'
    };

    // 创建按钮
    const button = document.createElement('button');
    button.className = 'feature-button theme-red position-3';
    button.textContent = config.buttonText;
    
    // 根据配置设置按钮位置
    button.classList.add(`position-${config.position}`);
    
    // 创建显示容器
    const container = document.createElement('div');
    container.className = 'random-number-container';
    
    // 添加到页面
    document.body.appendChild(button);
    document.body.appendChild(container);
    
    // 添加点击事件
    button.addEventListener('click', () => {
        const range = config.maxNumber - config.minNumber + 1;
        const randomNum = Math.floor(Math.random() * range) + config.minNumber;
        container.textContent = randomNum;
        container.style.display = 'block';
        
        // 配置的时间后隐藏
        setTimeout(() => {
            container.style.display = 'none';
        }, config.displayTime);
    });
})(); 