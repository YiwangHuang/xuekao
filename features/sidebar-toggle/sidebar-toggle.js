(function() {
    const config = window.featureConfigs.sidebarToggle || {
        showText: "显示目录",
        hideText: "隐藏目录",
        position: "top-right",
        initialState: "shown"
    };

    // 创建按钮
    const button = document.createElement('button');
    button.className = 'feature-button theme-blue position-1';
    button.textContent = config.hideText;

    // 获取需要操作的元素
    const body = document.querySelector('body');
    const sidebar = document.getElementById('quarto-margin-sidebar');

    // 确保元素存在
    if (!body || !sidebar) {
        console.warn('Sidebar toggle: Required elements not found');
        return;
    }

    // 设置初始状态
    if (config.initialState === "hidden") {
        body.classList.add('fullcontent');
        sidebar.style.display = 'none';
        button.textContent = config.showText;
    }

    // 添加按钮到页面
    document.body.appendChild(button);

    // 使用独立的状态变量
    let isFullContent = body.classList.contains('fullcontent');

    // 添加点击事件处理
    button.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        
        isFullContent = !isFullContent;
        
        if (isFullContent) {
            body.classList.add('fullcontent');
            sidebar.style.display = 'none';
            button.textContent = config.showText;
        } else {
            body.classList.remove('fullcontent');
            sidebar.style.display = 'block';
            button.textContent = config.hideText;
        }
    });
})(); 