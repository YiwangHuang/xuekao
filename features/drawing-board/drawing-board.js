(function() {
    const config = window.featureConfigs.drawingBoard || {
        buttonText: "画板模式",
        showBorder: true,
        mouseEnabled: true
    };

    // 创建按钮
    const button = document.createElement('button');
    button.className = 'feature-button theme-purple position-4';
    button.textContent = config.buttonText;
    document.body.appendChild(button);

    // 创建画板容器
    const container = document.createElement('div');
    container.className = 'drawing-board-container';
    container.style.display = 'none';
    
    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.className = 'drawing-board';
    container.appendChild(canvas);
    document.body.appendChild(container);

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let isEnabled = false;
    let lastX = 0;
    let lastY = 0;

    // 预设选项
    const colorPresets = [
        { color: '#000000', name: '黑色' },
        { color: '#ff0000', name: '红色' },
        { color: '#0000ff', name: '蓝色' },
        { color: '#008000', name: '绿色' }
    ];

    const sizePresets = [
        { size: 2, name: '细' },
        { size: 5, name: '中' },
        { size: 8, name: '粗' }
    ];

    // 1. 状态管理
    let state = {
        lastColor: '#000000',
        penWidth: 2,        // 所有颜色共享这个粗细值
        eraserWidth: 8,     // 橡皮擦独立的粗细值
        isEraser: false
    };

    // 1. 添加历史记录数组
    let undoStack = [];  // 撤回栈
    let redoStack = [];  // 重做栈
    const MAX_STACK = 50;  // 限制栈的大小

    // 2. 在工具栏中添加撤回和重做按钮
    function createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'drawing-toolbar';

        // 添加拖动功能
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // 拖动开始
        toolbar.addEventListener('mousedown', (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === toolbar) {
                isDragging = true;
            }
        });

        // 拖动中
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                toolbar.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        // 拖动结束
        document.addEventListener('mouseup', () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        });

        // 防止工具栏拖出视窗
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const rect = toolbar.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                // 限制水平方向
                if (rect.right > viewportWidth) {
                    currentX = viewportWidth - rect.width;
                }
                if (rect.left < 0) {
                    currentX = 0;
                }

                // 限制垂直方向
                if (rect.bottom > viewportHeight) {
                    currentY = viewportHeight - rect.height;
                }
                if (rect.top < 0) {
                    currentY = 0;
                }

                xOffset = currentX;
                yOffset = currentY;
                toolbar.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        // 创建颜色组
        const colorGroup = document.createElement('div');
        colorGroup.className = 'color-group';

        // 添颜色按钮
        colorPresets.forEach(preset => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'color-btn';
            colorBtn.style.backgroundColor = preset.color;
            colorBtn.title = preset.name;
            colorBtn.addEventListener('click', () => {
                state.lastColor = preset.color;
                state.isEraser = false;
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = preset.color;
                ctx.lineWidth = state.penWidth;  // 使用保存的画笔粗细
                updateToolbarUI();
            });
            colorGroup.appendChild(colorBtn);
        });

        // 添加橡皮擦按钮
        const eraserBtn = document.createElement('button');
        eraserBtn.className = 'eraser-btn';
        eraserBtn.innerHTML = '⌫';  // 使用退格符号
        eraserBtn.title = '橡皮擦';
        eraserBtn.addEventListener('click', () => {
            if (state.isEraser) {
                // 切换回画笔
                state.isEraser = false;
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = state.lastColor;
                ctx.lineWidth = state.penWidth;  // 使用共享的画笔粗细
            } else {
                // 切换到橡皮擦
                state.isEraser = true;
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = state.eraserWidth;  // 使用橡皮擦的粗细
            }
            updateToolbarUI();
        });
        colorGroup.appendChild(eraserBtn);

        // 添加分隔线
        toolbar.appendChild(colorGroup);
        toolbar.appendChild(document.createElement('div')).className = 'toolbar-separator';

        // 创建粗细组
        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'size-group';

        // 创建当前选中的粗细按钮
        const currentSize = document.createElement('button');
        currentSize.className = 'current-size';
        const currentDot = document.createElement('span');
        currentDot.className = 'dot';
        currentDot.style.width = '2px';
        currentDot.style.height = '2px';
        currentSize.appendChild(currentDot);

        // 创建粗细选项容器
        const sizeOptions = document.createElement('div');
        sizeOptions.className = 'size-options';

        // 添加粗细选项
        sizePresets.forEach(preset => {
            const sizeBtn = document.createElement('button');
            sizeBtn.className = 'size-btn';
            sizeBtn.title = preset.name;
            sizeBtn.addEventListener('click', () => {
                handleSizeChange(preset.size);
                sizeOptions.classList.remove('show');
                updateToolbarUI();
            });
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.style.width = preset.size + 'px';
            dot.style.height = preset.size + 'px';
            
            sizeBtn.appendChild(dot);
            
            sizeOptions.appendChild(sizeBtn);
        });

        // 点击当前粗细按钮时显示/隐藏选项
        currentSize.addEventListener('click', () => {
            sizeOptions.classList.toggle('show');
        });

        // 点击其他地方时隐藏选项
        document.addEventListener('click', (e) => {
            if (!sizeGroup.contains(e.target)) {
                sizeOptions.classList.remove('show');
            }
        });

        sizeGroup.appendChild(currentSize);
        sizeGroup.appendChild(sizeOptions);
        toolbar.appendChild(colorGroup);
        toolbar.appendChild(document.createElement('div')).className = 'toolbar-separator';
        toolbar.appendChild(sizeGroup);

        // 添加分隔线
        const separator1 = document.createElement('div');
        separator1.className = 'toolbar-separator';
        toolbar.appendChild(separator1);

        // 添加清空按钮
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-btn';
        clearBtn.innerHTML = '×';  // 使用 × 符号代替文字
        clearBtn.title = '清空画布';
        clearBtn.addEventListener('click', () => {
            if (confirm('确定要清空画布吗？')) {
                const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                undoStack.push(currentState);
                redoStack = [];
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                updateUndoRedoButtons();
            }
        });
        toolbar.appendChild(clearBtn);

        // 添加第二个分隔线
        const separator2 = document.createElement('div');
        separator2.className = 'toolbar-separator';
        toolbar.appendChild(separator2);

        // 添加撤回按钮
        const undoBtn = document.createElement('button');
        undoBtn.className = 'undo-btn';
        undoBtn.innerHTML = '↶';
        undoBtn.title = '撤回';
        undoBtn.onclick = () => {
            console.log('Undo clicked', undoStack.length); // 调试用
            undo();
        };
        toolbar.appendChild(undoBtn);

        // 添加重做按钮
        const redoBtn = document.createElement('button');
        redoBtn.className = 'redo-btn';
        redoBtn.innerHTML = '↷';
        redoBtn.title = '重做';
        redoBtn.onclick = () => {
            console.log('Redo clicked', redoStack.length); // 调试用
            redo();
        };
        toolbar.appendChild(redoBtn);

        document.body.appendChild(toolbar);

        // 默认选中第一个颜色和粗细
        toolbar.querySelector('.color-btn').classList.add('active');
        toolbar.querySelector('.size-btn').classList.add('active');

        return toolbar;
    }

    // 3. 简化UI更新
    function updateToolbarUI() {
        const toolbar = document.querySelector('.drawing-toolbar');
        const eraserBtn = toolbar.querySelector('.eraser-btn');
        const colorBtns = toolbar.querySelectorAll('.color-btn');
        
        // 重置所有按钮状态
        colorBtns.forEach(btn => btn.classList.remove('active'));
        eraserBtn.classList.remove('active');

        if (state.isEraser) {
            eraserBtn.classList.add('active');
        } else {
            colorBtns.forEach(btn => {
                const btnColor = btn.style.backgroundColor;
                const btnHex = rgbToHex(btnColor);
                if (btnHex === state.lastColor.toLowerCase()) {
                    btn.classList.add('active');
                }
            });
        }

        // 更新粗细显示
        const currentDot = toolbar.querySelector('.current-size .dot');
        if (currentDot) {
            const size = state.isEraser ? state.eraserWidth : state.penWidth;
            currentDot.style.width = size + 'px';
            currentDot.style.height = size + 'px';
            ctx.lineWidth = size;
        }
    }

    // 添加颜色转换辅助函数
    function rgbToHex(rgb) {
        // 处理 rgb(r, g, b) 格式
        const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgbMatch) {
            const [_, r, g, b] = rgbMatch;
            return '#' + [r, g, b].map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
        // 如果已经是十六进制格式，直接返回小写形式
        return rgb.toLowerCase();
    }

    // 2. 修改粗细选择的处理
    function handleSizeChange(size) {
        if (state.isEraser) {
            state.eraserWidth = size;
        } else {
            state.penWidth = size;  // 所有颜色共享这个值
        }
        ctx.lineWidth = size;
        
        // 更新UI显示
        const currentDot = document.querySelector('.current-size .dot');
        if (currentDot) {
            currentDot.style.width = size + 'px';
            currentDot.style.height = size + 'px';
        }
    }

    // 3. 保存画布状态
    function saveState() {
        console.log('Saving state'); // 调试用
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStack.push(imageData);
        if (undoStack.length > MAX_STACK) {
            undoStack.shift();
        }
        redoStack = []; // 清空重做栈
        updateUndoRedoButtons();
    }

    // 4. 撤回功能
    function undo() {
        if (undoStack.length === 0) return;
        console.log('Undoing...'); // 调试用
        
        // 保存当前状态到重做栈
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        redoStack.push(currentState);
        
        // 恢复上一个状态
        const previousState = undoStack.pop();
        ctx.putImageData(previousState, 0, 0);
        
        updateUndoRedoButtons();
    }

    // 5. 重做功能
    function redo() {
        if (redoStack.length === 0) return;
        console.log('Redoing...'); // 调试用
        
        // 保存当前状态到撤回栈
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStack.push(currentState);
        
        // 恢复重做状态
        const nextState = redoStack.pop();
        ctx.putImageData(nextState, 0, 0);
        
        updateUndoRedoButtons();
    }

    // 6. 更新按钮状态
    function updateUndoRedoButtons() {
        const undoBtn = document.querySelector('.undo-btn');
        const redoBtn = document.querySelector('.redo-btn');
        
        if (undoBtn) {
            undoBtn.disabled = undoStack.length === 0;
            undoBtn.style.opacity = undoStack.length === 0 ? '0.5' : '1';
        }
        if (redoBtn) {
            redoBtn.disabled = redoStack.length === 0;
            redoBtn.style.opacity = redoStack.length === 0 ? '0.5' : '1';
        }
    }

    // 创建工具栏
    const toolbar = createToolbar();
    
    // 只设置初始颜色
    const firstColorBtn = toolbar.querySelector('.color-btn');
    if (firstColorBtn) {
        firstColorBtn.click();
    }

    // 更新按钮点击事件
    button.addEventListener('click', () => {
        isEnabled = !isEnabled;
        container.style.display = isEnabled ? 'block' : 'none';
        toolbar.style.display = isEnabled ? 'flex' : 'none';
        if (isEnabled && config.showBorder) {
            container.classList.add('active');
        } else {
            container.classList.remove('active');
        }
        resizeCanvas();
    });

    // 调整画布大小的核心函数
    function resizeCanvas() {
        // 获取文档的实际大小（考虑滚动区域）
        const docHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        
        const docWidth = Math.max(
            document.body.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.clientWidth,
            document.documentElement.scrollWidth,
            document.documentElement.offsetWidth
        );

        // 保存当前的画笔设置，因为设置canvas尺寸会重置上下文
        const currentLineWidth = ctx.lineWidth;
        const currentStrokeStyle = ctx.strokeStyle;

        // 处理高分辨率屏幕(Retina)显示问题
        // 1. devicePixelRatio 表示物理像素与CSS像素的比例
        // 2. 在高分辨率屏幕上，一个CSS像素可能对应多个物理像素
        // 3. 为了保证绘图清晰，需要根据此比例调整canvas的实际大小
        const dpr = window.devicePixelRatio || 1;
        
        // canvas的实际大小会根据dpr变大，以匹配物理像素
        canvas.width = docWidth * dpr;
        canvas.height = docHeight * dpr;
        
        // 但显��大小保持不变，这样可以让一个CSS像素对应多个canvas像素
        canvas.style.width = docWidth + 'px';
        canvas.style.height = docHeight + 'px';
        container.style.width = docWidth + 'px';
        container.style.height = docHeight + 'px';
        container.style.left = '0';
        container.style.top = '0';
        
        // 缩放绘图上下文以匹配设备像素比
        // 这样确保绘制的线条粗细在视觉上保持一致
        // 同时在高分辨率屏幕上能够显示更清晰的线条
        ctx.scale(dpr, dpr);
        
        // 恢复画笔设置
        ctx.lineWidth = currentLineWidth;
        ctx.strokeStyle = currentStrokeStyle;
        ctx.lineCap = 'round';
    }

    // 2. 修改绘画事件处理
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function draw(e) {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        // 在绘画结束时保存状态
        saveState();
    }

    // 初始化画布属性
    function initCanvas() {
        canvas = document.createElement('canvas');
        canvas.className = 'drawing-board';
        
        // 使用 2d 上下文，并优化性能设置
        ctx = canvas.getContext('2d', {
            willReadFrequently: false,  // 设为false因为我们不需要频繁读取像素
            alpha: false,               // 禁用alpha通道以提升性能
            desynchronized: true        // 减少延迟，提升性能
        });
        
        // 禁用图像平滑，因为我们是画线条而不是处理图像
        ctx.imageSmoothingEnabled = false;
        
        // 优化线条设置
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.miterLimit = 1;            // 减小斜接限制，提升性能
        
        // 设置合成操作
        ctx.globalCompositeOperation = 'source-over';
        
        container.appendChild(canvas);
        resizeCanvas();
    }

    // 触控事件处理（默认支持）
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();  // 防止触摸时页面滚动
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        isDrawing = true;
        [lastX, lastY] = [
            touch.clientX - rect.left,
            touch.clientY - rect.top
        ];
        saveState();  // 保存当前状态用于撤销
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        [lastX, lastY] = [x, y];
    });

    canvas.addEventListener('touchend', () => {
        isDrawing = false;
    });

    canvas.addEventListener('touchcancel', () => {
        isDrawing = false;
    });

    // 鼠标事件处理（可选）
    if (config.mouseEnabled) {
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
            saveState();
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });

        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        canvas.addEventListener('mouseout', () => {
            isDrawing = false;
        });
    }

    // 监听窗口大小变化，实时调整画布大小
    window.addEventListener('resize', resizeCanvas);

    // 4. 简化CSS
    const style = document.createElement('style');
    style.textContent = `
        .color-btn.active, .eraser-btn.active {
            transform: scale(1.2) !important;
            box-shadow: 0 0 5px rgba(0,0,0,0.2) !important;
        }
    `;
    document.head.appendChild(style);
})(); 