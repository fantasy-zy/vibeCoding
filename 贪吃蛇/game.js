/**
 * 贪吃蛇游戏主类
 * 功能：实现贪吃蛇游戏的核心逻辑，包括蛇的移动、食物生成、碰撞检测、游戏控制等
 * 核心功能：
 *   - 使用Canvas进行图形渲染
 *   - 实现游戏循环和状态管理
 *   - 提供音效系统
 *   - 支持难度选择和分数记录
 * 使用注意事项：
 *   - 需要HTML5 Canvas支持
 *   - 需要Web Audio API支持（可选）
 *   - 游戏画布尺寸固定为400x400像素
 */
class SnakeGame {
    /**
     * 构造函数：初始化游戏实例
     * 功能：设置游戏的基本属性和初始状态
     * 初始化内容：
     *   - Canvas上下文和网格设置
     *   - 蛇、食物、方向等游戏状态
     *   - 分数和最高分记录
     *   - 音频上下文（如果支持）
     */
    constructor() {
        // 获取Canvas元素和2D绘图上下文
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        // 网格大小：每个格子20像素
        this.gridSize = 20;
        // 网格数量：画布宽度除以网格大小（400/20=20）
        this.tileCount = this.canvas.width / this.gridSize;
        
        // 蛇身数组：存储蛇的每个身体段坐标
        this.snake = [];
        // 食物对象：存储食物的坐标
        this.food = {};
        // 当前移动方向：x和y分别表示水平和垂直方向（-1, 0, 1）
        this.direction = { x: 0, y: 0 };
        // 下一次移动方向：用于防止快速按键导致的反向移动
        this.nextDirection = { x: 0, y: 0 };
        // 当前分数
        this.score = 0;
        // 最高分数：从本地存储读取，如果没有则默认为0
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        
        // 游戏循环定时器
        this.gameLoop = null;
        // 游戏速度：毫秒数，越小速度越快（默认150ms）
        this.gameSpeed = 150;
        // 游戏运行状态标志
        this.isGameRunning = false;
        // 游戏暂停状态标志
        this.isPaused = false;
        // 音效启用标志
        this.soundEnabled = true;
        
        // Web Audio API上下文：用于生成游戏音效
        this.audioContext = null;
        
        // 调用初始化方法
        this.init();
    }
    
    /**
     * 初始化游戏
     * 功能：设置游戏的所有初始状态和事件监听
     * 执行步骤：
     *   1. 初始化音频系统
     *   2. 绑定所有事件监听器
     *   3. 更新最高分显示
     *   4. 重置游戏状态
     *   5. 绘制初始画面
     */
    init() {
        this.initAudio();
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.resetGame();
        this.draw();
    }
    
    /**
     * 初始化音频系统
     * 功能：创建Web Audio API上下文，用于生成游戏音效
     * 异常处理：如果浏览器不支持Web Audio API，输出警告信息
     * 注意事项：某些浏览器需要用户交互后才能创建AudioContext
     */
    initAudio() {
        try {
            // 创建音频上下文，兼容不同浏览器
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    /**
     * 播放游戏音效
     * @param {string} type - 音效类型，可选值：'eat'（吃食物）、'gameover'（游戏结束）、'start'（开始游戏）
     * 功能：使用Web Audio API生成不同类型的音效
     * 实现原理：
     *   - 创建振荡器生成音频波形
     *   - 使用增益节点控制音量
     *   - 通过频率变化实现不同音效
     * 注意事项：如果音效未启用或音频上下文不存在，则不播放音效
     */
    playSound(type) {
        // 检查音效是否启用和音频上下文是否存在
        if (!this.soundEnabled || !this.audioContext) return;
        
        // 创建振荡器（音频源）
        const oscillator = this.audioContext.createOscillator();
        // 创建增益节点（音量控制）
        const gainNode = this.audioContext.createGain();
        
        // 连接音频节点：振荡器 -> 增益节点 -> 输出设备
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 根据音效类型设置不同的音频参数
        switch (type) {
            case 'eat':
                // 吃食物音效：频率从600Hz快速上升到1200Hz
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
                // 音量从0.3快速衰减到0.01
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'gameover':
                // 游戏结束音效：频率从400Hz缓慢下降到100Hz
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
                // 音量从0.3缓慢衰减到0.01
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
            case 'start':
                // 开始游戏音效：频率从300Hz上升到600Hz
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
                // 音量从0.2衰减到0.01
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
        }
    }
    
    /**
     * 重置游戏状态
     * 功能：将游戏恢复到初始状态，准备开始新游戏
     * 重置内容：
     *   - 蛇身位置：设置为初始位置（3个身体段）
     *   - 移动方向：向右移动
     *   - 分数：重置为0
     *   - 食物：生成新的食物位置
     */
    resetGame() {
        // 初始化蛇身：3个身体段，从左到右排列
        this.snake = [
            { x: 10, y: 10 },  // 蛇头
            { x: 9, y: 10 },   // 身体第一段
            { x: 8, y: 10 }    // 身体第二段
        ];
        // 初始方向：向右移动
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        // 重置分数
        this.score = 0;
        // 更新分数显示
        this.updateScoreDisplay();
        // 生成新的食物
        this.generateFood();
    }
    
    /**
     * 生成食物
     * 功能：在游戏区域内随机生成一个食物位置
     * 实现逻辑：
     *   1. 随机生成一个坐标
     *   2. 检查该位置是否与蛇身重叠
     *   3. 如果重叠则重新生成，直到找到空位置
     * 注意事项：确保食物不会生成在蛇身上
     */
    generateFood() {
        let newFood;
        // 循环生成食物，直到找到不在蛇身上的位置
        do {
            // 随机生成食物坐标（0到tileCount-1）
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.isSnakeOnPosition(newFood.x, newFood.y));
        
        // 设置食物位置
        this.food = newFood;
    }
    
    /**
     * 检查蛇是否在指定位置
     * @param {number} x - 要检查的x坐标
     * @param {number} y - 要检查的y坐标
     * @returns {boolean} 如果蛇身在该位置返回true，否则返回false
     * 功能：判断指定坐标是否与蛇身的任何部分重叠
     * 使用场景：生成食物时避免与蛇身重叠
     */
    isSnakeOnPosition(x, y) {
        // 使用some方法检查蛇身数组中是否有匹配的坐标
        return this.snake.some(segment => segment.x === x && segment.y === y);
    }
    
    /**
     * 更新游戏状态
     * 功能：执行每一帧的游戏逻辑更新
     * 执行步骤：
     *   1. 更新移动方向
     *   2. 计算新的蛇头位置
     *   3. 检查碰撞（边界或自身）
     *   4. 如果碰撞则游戏结束
     *   5. 如果吃到食物则增加分数和蛇身
     *   6. 否则移除蛇尾
     *   7. 重新绘制游戏画面
     */
    update() {
        // 将下一次方向应用到当前方向（防止快速按键导致的反向移动）
        this.direction = { ...this.nextDirection };
        
        // 计算新的蛇头位置
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };
        
        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        // 将新蛇头添加到蛇身数组开头
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            // 增加分数（每个食物10分）
            this.score += 10;
            // 更新分数显示
            this.updateScoreDisplay();
            // 播放吃食物音效
            this.playSound('eat');
            // 生成新的食物
            this.generateFood();
        } else {
            // 没有吃到食物，移除蛇尾（保持蛇身长度不变）
            this.snake.pop();
        }
        
        // 重新绘制游戏画面
        this.draw();
    }
    
    /**
     * 检查碰撞
     * @param {Object} head - 蛇头位置对象，包含x和y坐标
     * @returns {boolean} 如果发生碰撞返回true，否则返回false
     * 功能：检查蛇头是否与边界或自身发生碰撞
     * 碰撞类型：
     *   - 边界碰撞：蛇头超出游戏区域
     *   - 自身碰撞：蛇头与蛇身其他部分重叠
     */
    checkCollision(head) {
        // 检查边界碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // 检查自身碰撞（遍历蛇身数组）
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        // 没有碰撞
        return false;
    }
    
    /**
     * 绘制游戏画面
     * 功能：在Canvas上绘制所有游戏元素
     * 绘制顺序：
     *   1. 清空画布并填充背景色
     *   2. 绘制网格线
     *   3. 绘制食物
     *   4. 绘制蛇身
     */
    draw() {
        // 清空画布并填充背景色
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制各个游戏元素
        this.drawGrid();
        this.drawFood();
        this.drawSnake();
    }
    
    /**
     * 绘制网格线
     * 功能：在游戏区域绘制网格线，帮助玩家定位
     * 实现方式：使用Canvas的路径绘制功能，绘制水平和垂直线条
     */
    drawGrid() {
        // 设置网格线样式
        this.ctx.strokeStyle = '#2a2a4e';
        this.ctx.lineWidth = 0.5;
        
        // 绘制垂直网格线
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平网格线
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    /**
     * 绘制蛇身
     * 功能：绘制蛇的所有身体段，包括头部和身体
     * 实现细节：
     *   - 使用径向渐变实现立体效果
     *   - 蛇头使用亮绿色，身体使用渐变透明度
     *   - 蛇头绘制眼睛，眼睛方向跟随移动方向
     */
    drawSnake() {
        // 遍历蛇身数组的每个段
        this.snake.forEach((segment, index) => {
            // 创建径向渐变，实现立体效果
            const gradient = this.ctx.createRadialGradient(
                segment.x * this.gridSize + this.gridSize / 2,
                segment.y * this.gridSize + this.gridSize / 2,
                0,
                segment.x * this.gridSize + this.gridSize / 2,
                segment.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2
            );
            
            // 根据是否为蛇头设置不同的渐变颜色
            if (index === 0) {
                // 蛇头：亮绿色
                gradient.addColorStop(0, '#00ff88');
                gradient.addColorStop(1, '#00cc6a');
            } else {
                // 身体：根据位置计算透明度，尾部更透明
                const alpha = 1 - (index / this.snake.length) * 0.5;
                gradient.addColorStop(0, `rgba(0, 255, 136, ${alpha})`);
                gradient.addColorStop(1, `rgba(0, 204, 106, ${alpha})`);
            }
            
            // 绘制蛇身段（圆角矩形）
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.roundRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2,
                4
            );
            this.ctx.fill();
            
            // 如果是蛇头，绘制眼睛
            if (index === 0) {
                this.drawEyes(segment);
            }
        });
    }
    
    /**
     * 绘制蛇头眼睛
     * @param {Object} head - 蛇头位置对象，包含x和y坐标
     * 功能：在蛇头上绘制眼睛，眼睛方向跟随移动方向
     * 实现细节：
     *   - 眼睛位置根据移动方向调整
     *   - 眼睛由白色眼白和黑色瞳孔组成
     */
    drawEyes(head) {
        const eyeSize = 3;
        const eyeOffset = 5;
        
        // 设置眼白颜色
        this.ctx.fillStyle = '#fff';
        
        // 根据移动方向计算眼睛位置
        let eye1X, eye1Y, eye2X, eye2Y;
        
        if (this.direction.x === 1) {
            // 向右移动：眼睛在右侧
            eye1X = head.x * this.gridSize + this.gridSize - eyeOffset;
            eye1Y = head.y * this.gridSize + eyeOffset;
            eye2X = head.x * this.gridSize + this.gridSize - eyeOffset;
            eye2Y = head.y * this.gridSize + this.gridSize - eyeOffset;
        } else if (this.direction.x === -1) {
            // 向左移动：眼睛在左侧
            eye1X = head.x * this.gridSize + eyeOffset;
            eye1Y = head.y * this.gridSize + eyeOffset;
            eye2X = head.x * this.gridSize + eyeOffset;
            eye2Y = head.y * this.gridSize + this.gridSize - eyeOffset;
        } else if (this.direction.y === 1) {
            // 向下移动：眼睛在下方
            eye1X = head.x * this.gridSize + eyeOffset;
            eye1Y = head.y * this.gridSize + this.gridSize - eyeOffset;
            eye2X = head.x * this.gridSize + this.gridSize - eyeOffset;
            eye2Y = head.y * this.gridSize + this.gridSize - eyeOffset;
        } else {
            // 向上移动：眼睛在上方
            eye1X = head.x * this.gridSize + eyeOffset;
            eye1Y = head.y * this.gridSize + eyeOffset;
            eye2X = head.x * this.gridSize + this.gridSize - eyeOffset;
            eye2Y = head.y * this.gridSize + eyeOffset;
        }
        
        // 绘制左眼眼白
        this.ctx.beginPath();
        this.ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制右眼眼白
        this.ctx.beginPath();
        this.ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 设置瞳孔颜色
        this.ctx.fillStyle = '#000';
        
        // 绘制左眼瞳孔
        this.ctx.beginPath();
        this.ctx.arc(eye1X, eye1Y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制右眼瞳孔
        this.ctx.beginPath();
        this.ctx.arc(eye2X, eye2Y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 绘制食物
     * 功能：在指定位置绘制食物（红色圆形）
     * 实现细节：
     *   - 使用径向渐变实现立体效果
     *   - 添加高光点增加真实感
     */
    drawFood() {
        // 计算食物中心坐标
        const centerX = this.food.x * this.gridSize + this.gridSize / 2;
        const centerY = this.food.y * this.gridSize + this.gridSize / 2;
        
        // 创建径向渐变
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.gridSize / 2);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ee5a5a');
        
        // 绘制食物主体
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.gridSize / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制高光点
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 3, centerY - 3, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 开始游戏
     * 功能：启动新游戏，开始游戏循环
     * 执行步骤：
     *   1. 检查游戏是否已在运行
     *   2. 重置游戏状态
     *   3. 设置游戏运行标志
     *   4. 播放开始音效
     *   5. 隐藏覆盖层
     *   6. 更新按钮状态
     *   7. 启动游戏循环定时器
     * 注意事项：如果游戏已在运行，则不执行任何操作
     */
    startGame() {
        // 如果游戏已在运行，直接返回
        if (this.isGameRunning) return;
        
        // 重置游戏状态
        this.resetGame();
        // 设置游戏运行标志
        this.isGameRunning = true;
        this.isPaused = false;
        // 播放开始音效
        this.playSound('start');
        // 隐藏覆盖层
        this.hideOverlay();
        // 更新按钮状态
        this.updateButtonStates();
        // 启动游戏循环定时器
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
    }
    
    /**
     * 暂停游戏
     * 功能：暂停游戏循环，显示暂停覆盖层
     * 执行步骤：
     *   1. 检查游戏是否在运行且未暂停
     *   2. 设置暂停标志
     *   3. 清除游戏循环定时器
     *   4. 显示暂停覆盖层
     *   5. 更新按钮状态
     * 注意事项：如果游戏未运行或已暂停，则不执行任何操作
     */
    pauseGame() {
        // 检查游戏是否在运行且未暂停
        if (!this.isGameRunning || this.isPaused) return;
        
        // 设置暂停标志
        this.isPaused = true;
        // 清除游戏循环定时器
        clearInterval(this.gameLoop);
        // 显示暂停覆盖层
        this.showOverlay('游戏暂停', '点击继续按钮恢复游戏', '继续');
        // 更新按钮状态
        this.updateButtonStates();
    }
    
    /**
     * 继续游戏
     * 功能：从暂停状态恢复游戏
     * 执行步骤：
     *   1. 检查游戏是否在运行且已暂停
     *   2. 清除暂停标志
     *   3. 隐藏覆盖层
     *   4. 更新按钮状态
     *   5. 重新启动游戏循环定时器
     * 注意事项：如果游戏未运行或未暂停，则不执行任何操作
     */
    resumeGame() {
        // 检查游戏是否在运行且已暂停
        if (!this.isGameRunning || !this.isPaused) return;
        
        // 清除暂停标志
        this.isPaused = false;
        // 隐藏覆盖层
        this.hideOverlay();
        // 更新按钮状态
        this.updateButtonStates();
        // 重新启动游戏循环定时器
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
    }
    
    /**
     * 重新开始游戏
     * 功能：停止当前游戏并开始新游戏
     * 执行步骤：
     *   1. 停止当前游戏
     *   2. 开始新游戏
     */
    restartGame() {
        this.stopGame();
        this.startGame();
    }
    
    /**
     * 停止游戏
     * 功能：停止游戏循环，重置游戏状态标志
     * 执行步骤：
     *   1. 清除游戏运行标志
     *   2. 清除暂停标志
     *   3. 清除游戏循环定时器
     *   4. 更新按钮状态
     */
    stopGame() {
        // 清除游戏运行标志
        this.isGameRunning = false;
        this.isPaused = false;
        // 清除游戏循环定时器
        clearInterval(this.gameLoop);
        // 更新按钮状态
        this.updateButtonStates();
    }
    
    /**
     * 游戏结束
     * 功能：处理游戏结束逻辑
     * 执行步骤：
     *   1. 停止游戏
     *   2. 播放游戏结束音效
     *   3. 检查并更新最高分
     *   4. 显示游戏结束覆盖层
     * 注意事项：如果当前分数超过最高分，则更新本地存储中的最高分
     */
    gameOver() {
        // 停止游戏
        this.stopGame();
        // 播放游戏结束音效
        this.playSound('gameover');
        
        // 检查是否打破最高分记录
        if (this.score > this.highScore) {
            // 更新最高分
            this.highScore = this.score;
            // 保存到本地存储
            localStorage.setItem('snakeHighScore', this.highScore);
            // 更新最高分显示
            this.updateHighScoreDisplay();
        }
        
        // 显示游戏结束覆盖层
        this.showOverlay('游戏结束', `最终得分: ${this.score}`, '重新开始');
    }
    
    /**
     * 显示覆盖层
     * @param {string} title - 覆盖层标题
     * @param {string} message - 覆盖层消息内容
     * @param {string} buttonText - 按钮文本
     * 功能：显示游戏状态覆盖层（准备开始、暂停、游戏结束）
     * 实现方式：更新DOM元素的文本内容并移除隐藏类
     */
    showOverlay(title, message, buttonText) {
        // 获取覆盖层元素
        const overlay = document.getElementById('game-overlay');
        const overlayTitle = document.getElementById('overlay-title');
        const overlayMessage = document.getElementById('overlay-message');
        const overlayButton = document.getElementById('overlay-button');
        
        // 更新覆盖层内容
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        overlayButton.textContent = buttonText;
        
        // 显示覆盖层
        overlay.classList.remove('hidden');
    }
    
    /**
     * 隐藏覆盖层
     * 功能：隐藏游戏状态覆盖层
     * 实现方式：添加隐藏类到覆盖层元素
     */
    hideOverlay() {
        const overlay = document.getElementById('game-overlay');
        overlay.classList.add('hidden');
    }
    
    /**
     * 更新分数显示
     * 功能：更新当前分数的显示，并添加动画效果
     * 实现细节：
     *   - 更新分数文本
     *   - 添加动画类触发CSS动画
     *   - 300ms后移除动画类
     */
    updateScoreDisplay() {
        const scoreElement = document.getElementById('current-score');
        // 更新分数文本
        scoreElement.textContent = this.score;
        // 添加动画类
        scoreElement.classList.add('updated');
        // 300ms后移除动画类
        setTimeout(() => scoreElement.classList.remove('updated'), 300);
    }
    
    /**
     * 更新最高分显示
     * 功能：更新最高分数的显示
     */
    updateHighScoreDisplay() {
        document.getElementById('high-score').textContent = this.highScore;
    }
    
    /**
     * 更新按钮状态
     * 功能：根据游戏状态更新按钮的可用状态和文本
     * 按钮状态规则：
     *   - 开始按钮：游戏运行时禁用
     *   - 暂停按钮：游戏未运行或已暂停时禁用
     *   - 重新开始按钮：游戏未运行时禁用
     *   - 暂停按钮文本：暂停时显示"继续"，否则显示"暂停"
     */
    updateButtonStates() {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        // 更新按钮禁用状态
        startBtn.disabled = this.isGameRunning;
        pauseBtn.disabled = !this.isGameRunning || this.isPaused;
        restartBtn.disabled = !this.isGameRunning;
        
        // 更新暂停按钮文本
        pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
    }
    
    /**
     * 设置游戏难度
     * @param {string} difficulty - 难度级别，可选值：'easy'（简单）、'medium'（中等）、'hard'（困难）
     * 功能：根据难度设置游戏速度
     * 难度对应速度：
     *   - 简单：200ms（慢）
     *   - 中等：150ms（中）
     *   - 困难：100ms（快）
     * 注意事项：如果游戏正在运行且未暂停，则立即应用新的速度
     */
    setDifficulty(difficulty) {
        // 根据难度设置游戏速度
        switch (difficulty) {
            case 'easy':
                this.gameSpeed = 200;
                break;
            case 'medium':
                this.gameSpeed = 150;
                break;
            case 'hard':
                this.gameSpeed = 100;
                break;
        }
        
        // 如果游戏正在运行且未暂停，重新启动定时器以应用新速度
        if (this.isGameRunning && !this.isPaused) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        }
    }
    
    /**
     * 设置音效启用状态
     * @param {boolean} enabled - 音效启用标志，true表示启用，false表示禁用
     * 功能：启用或禁用游戏音效
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
    
    /**
     * 改变蛇的移动方向
     * @param {Object} newDirection - 新的移动方向对象，包含x和y坐标
     * 功能：更新蛇的移动方向
     * 限制条件：
     *   - 不能直接反向移动（例如：向右移动时不能直接向左）
     *   - 使用nextDirection防止快速按键导致的反向移动
     * 实现逻辑：
     *   - 如果新方向的x不为0且当前方向的x不为0，则拒绝（水平方向冲突）
     *   - 如果新方向的y不为0且当前方向的y不为0，则拒绝（垂直方向冲突）
     */
    changeDirection(newDirection) {
        const { x, y } = newDirection;
        
        // 检查是否尝试反向移动
        if (x !== 0 && this.direction.x !== 0) return;
        if (y !== 0 && this.direction.y !== 0) return;
        
        // 更新下一次移动方向
        this.nextDirection = { x, y };
    }
    
    /**
     * 绑定事件监听器
     * 功能：为所有游戏控制元素绑定事件监听器
     * 绑定的事件：
     *   - 键盘事件：方向键、WASD、空格键、Enter键
     *   - 按钮点击事件：开始、暂停、重新开始、覆盖层按钮
     *   - 控件变化事件：难度选择、音效开关
     *   - 移动端按钮点击事件：上下左右方向键
     */
    bindEvents() {
        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            // 如果游戏未运行或已暂停
            if (!this.isGameRunning || this.isPaused) {
                // 空格键或Enter键可以开始或继续游戏
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    if (this.isPaused) {
                        this.resumeGame();
                    } else if (!this.isGameRunning) {
                        this.startGame();
                    }
                }
                return;
            }
            
            // 游戏运行中的键盘控制
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.changeDirection({ x: 0, y: -1 });
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.changeDirection({ x: 0, y: 1 });
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.changeDirection({ x: -1, y: 0 });
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.changeDirection({ x: 1, y: 0 });
                    break;
                case ' ':
                    e.preventDefault();
                    this.pauseGame();
                    break;
            }
        });
        
        // 按钮点击事件
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => {
            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        });
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('overlay-button').addEventListener('click', () => {
            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.restartGame();
            }
        });
        
        // 控件变化事件
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.setDifficulty(e.target.value);
        });
        
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.setSoundEnabled(e.target.checked);
        });
        
        // 移动端按钮点击事件
        document.getElementById('up-btn').addEventListener('click', () => {
            this.changeDirection({ x: 0, y: -1 });
        });
        document.getElementById('down-btn').addEventListener('click', () => {
            this.changeDirection({ x: 0, y: 1 });
        });
        document.getElementById('left-btn').addEventListener('click', () => {
            this.changeDirection({ x: -1, y: 0 });
        });
        document.getElementById('right-btn').addEventListener('click', () => {
            this.changeDirection({ x: 1, y: 0 });
        });
    }
}

// DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
});