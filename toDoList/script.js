// 待办事项应用 JavaScript

// DOM 元素获取
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const prioritySelect = document.getElementById('prioritySelect');
const taskList = document.getElementById('taskList');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const clearAllBtn = document.getElementById('clearAllBtn');
const confirmDialog = document.getElementById('confirmDialog');
const confirmMessage = document.getElementById('confirmMessage');

// 当前操作的日期
let currentActionDate = null;

// 任务数据数组
let tasks = [];

// 存储键名
const STORAGE_KEY = 'todo_tasks';

// 初始化应用
function init() {
    // 从 localStorage 加载任务
    loadTasks();
    // 渲染任务列表
    renderTasks();
    // 更新统计信息
    updateStats();
    // 更新清空按钮状态
    updateClearAllBtn();
    // 绑定事件监听器
    bindEvents();
}

// 绑定事件监听器
function bindEvents() {
    // 添加任务按钮点击事件
    addTaskBtn.addEventListener('click', addTask);
    
    // 输入框回车事件
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // 全部清空按钮点击事件
    clearAllBtn.addEventListener('click', clearAllTasks);
}

// 获取当前日期的格式化字符串（YYYY-MM-DD）
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// 添加任务
function addTask() {
    const taskText = taskInput.value.trim();
    const taskPriority = prioritySelect.value;
    
    if (taskText === '') {
        // 可以添加提示，但为了简洁，这里只清空输入框
        taskInput.value = '';
        return;
    }
    
    // 创建新任务对象
    const newTask = {
        id: Date.now().toString(), // 使用时间戳作为唯一ID
        text: taskText,
        completed: false,
        date: getCurrentDate(), // 添加日期字段
        priority: taskPriority || 'medium' // 添加优先级字段，默认中优先级
    };
    
    // 添加到任务数组
    tasks.push(newTask);
    
    // 保存到 localStorage
    saveTasks();
    
    // 渲染任务列表
    renderTasks();
    
    // 更新统计信息
    updateStats();
    
    // 清空输入框并聚焦，重置优先级选择
    taskInput.value = '';
    prioritySelect.value = 'medium';
    taskInput.focus();
}

// 切换任务完成状态
function toggleTaskStatus(taskId) {
    // 找到对应的任务
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // 切换完成状态
        task.completed = !task.completed;
        
        // 保存到 localStorage
        saveTasks();
        
        // 渲染任务列表
        renderTasks();
        
        // 更新统计信息
        updateStats();
    }
}

// 删除任务
function deleteTask(taskId) {
    // 找到任务元素
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    
    if (taskElement) {
        // 添加删除动画类
        taskElement.classList.add('deleting');
        
        // 等待动画完成后删除
        setTimeout(() => {
            // 从任务数组中删除
            tasks = tasks.filter(t => t.id !== taskId);
            
            // 保存到 localStorage
            saveTasks();
            
            // 渲染任务列表
            renderTasks();
            
            // 更新统计信息
            updateStats();
        }, 300); // 匹配CSS动画时长
    }
}

// 切换到编辑模式
function editTask(taskId) {
    // 找到对应的任务
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // 取消其他任务的编辑状态
        tasks.forEach(t => t.isEditing = false);
        
        // 设置当前任务为编辑状态
        task.isEditing = true;
        
        // 渲染任务列表
        renderTasks();
        
        // 聚焦到编辑输入框
        setTimeout(() => {
            const editInput = document.getElementById(`edit-input-${taskId}`);
            if (editInput) {
                editInput.focus();
                editInput.select(); // 选中所有文本
            }
        }, 100);
    }
}

// 保存编辑
function saveEdit(taskId) {
    // 找到对应的任务
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // 获取编辑输入框和优先级选择器
        const editInput = document.getElementById(`edit-input-${taskId}`);
        const priorityEdit = document.getElementById(`priority-edit-${taskId}`);
        
        if (editInput) {
            const newText = editInput.value.trim();
            const newPriority = priorityEdit ? priorityEdit.value : task.priority;
            
            if (newText === '') {
                // 如果文本为空，提示用户
                showNotification('任务内容不能为空', 'error');
                return;
            }
            
            // 更新任务文本和优先级
            task.text = newText;
            task.priority = newPriority || 'medium';
            // 退出编辑状态
            task.isEditing = false;
            
            // 保存到 localStorage
            saveTasks();
            
            // 渲染任务列表
            renderTasks();
            
            // 显示成功通知
            showNotification('任务已成功更新', 'success');
        }
    }
}

// 取消编辑
function cancelEdit(taskId) {
    // 找到对应的任务
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // 退出编辑状态
        task.isEditing = false;
        
        // 渲染任务列表
        renderTasks();
    }
}

// 显示确认弹窗
function showConfirmDialog(date) {
    currentActionDate = date;
    confirmMessage.textContent = `此操作将删除${formatDate(date)}的所有任务，且无法恢复。是否确认执行？`;
    confirmDialog.classList.add('active');
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
}

// 关闭确认弹窗
function closeConfirmDialog() {
    confirmDialog.classList.remove('active');
    currentActionDate = null;
    // 恢复背景滚动
    document.body.style.overflow = 'auto';
}

// 确认操作
function confirmAction() {
    if (currentActionDate) {
        if (currentActionDate === 'all') {
            // 清空所有任务
            // 添加加载状态
            clearAllBtn.disabled = true;
            clearAllBtn.innerHTML = '清空ing...';
            
            // 模拟短暂延迟，提升用户体验
            setTimeout(() => {
                // 清空任务数组
                tasks = [];
                
                // 保存到 localStorage
                saveTasks();
                
                // 渲染任务列表
                renderTasks();
                
                // 更新统计信息
                updateStats();
                
                // 恢复按钮状态
                clearAllBtn.disabled = false;
                clearAllBtn.innerHTML = '🗑️ 全部清空';
                
                // 显示操作结果反馈
                showNotification('所有任务已成功清空', 'success');
            }, 300);
        } else {
            // 清空指定日期的任务
            clearTasksByDate(currentActionDate);
        }
    }
    closeConfirmDialog();
}

// 清空指定日期的任务
function clearTasksByDate(date) {
    // 过滤掉该日期的所有任务
    tasks = tasks.filter(task => task.date !== date);
    
    // 保存到 localStorage
    saveTasks();
    
    // 渲染任务列表
    renderTasks();
    
    // 更新统计信息
    updateStats();
    
    // 显示操作结果反馈
    showNotification(`已成功清空${formatDate(date)}的所有任务`, 'success');
}

// 全部清空任务
function clearAllTasks() {
    // 如果没有任务，直接返回
    if (tasks.length === 0) {
        showNotification('当前没有任务需要清空', 'info');
        return;
    }
    
    // 使用自定义确认弹窗
    currentActionDate = 'all'; // 使用'all'表示清空所有任务
    confirmMessage.textContent = '此操作将删除所有数据，且无法恢复。是否确认执行全部清空操作？';
    confirmDialog.classList.add('active');
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
}

// 切换抽屉展开/折叠状态
function toggleDrawer(date) {
    const drawer = document.querySelector(`[data-date="${date}"]`);
    if (drawer) {
        const content = drawer.querySelector('.task-drawer-content');
        const toggleIcon = drawer.querySelector('.toggle-icon');
        
        if (content) {
            content.classList.toggle('collapsed');
            
            if (content.classList.contains('collapsed')) {
                toggleIcon.textContent = '▶';
            } else {
                toggleIcon.textContent = '▼';
            }
        }
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // 根据类型设置背景色
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            break;
        case 'info':
            notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 3秒后移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// 添加通知动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 按日期分组任务
function groupTasksByDate() {
    const grouped = {};
    
    // 遍历所有任务，按日期分组
    tasks.forEach(task => {
        const date = task.date || getCurrentDate();
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(task);
    });
    
    return grouped;
}

// 格式化日期显示
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 检查是否为今天
    if (date.toDateString() === today.toDateString()) {
        return '今天';
    }
    // 检查是否为昨天
    if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
    }
    // 其他日期格式化为 YYYY年MM月DD日
    return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`;
}

// 更新清空按钮显示状态
function updateClearAllBtn() {
    if (tasks.length === 0) {
        clearAllBtn.classList.add('hidden');
    } else {
        clearAllBtn.classList.remove('hidden');
    }
}

// 渲染任务列表
function renderTasks() {
    // 清空任务列表
    taskList.innerHTML = '';
    
    // 更新清空按钮状态
    updateClearAllBtn();
    
    if (tasks.length === 0) {
        // 显示空状态
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-text">暂无任务，添加一个新任务吧！</div>
        `;
        taskList.appendChild(emptyState);
        return;
    }
    
    // 按日期分组任务
    const groupedTasks = groupTasksByDate();
    
    // 获取所有日期并按降序排序
    const dates = Object.keys(groupedTasks).sort((a, b) => new Date(b) - new Date(a));
    
    // 渲染每个日期分组
    dates.forEach(date => {
        const tasksForDate = groupedTasks[date];
        
        // 创建抽屉容器
        const drawer = document.createElement('div');
        drawer.className = 'task-drawer';
        drawer.dataset.date = date;
        
        // 创建抽屉头部
        const drawerHeader = document.createElement('div');
        drawerHeader.className = 'task-drawer-header';
        drawerHeader.innerHTML = `
            <div class="drawer-title">
                <span class="date-label">${formatDate(date)}</span>
                <span class="task-count">(${tasksForDate.length})</span>
            </div>
            <div class="drawer-actions">
                <button 
                    class="clear-date-btn" 
                    onclick="showConfirmDialog('${date}')" 
                    aria-label="清空当日任务"
                >
                    清空当日
                </button>
                <button class="drawer-toggle" onclick="toggleDrawer('${date}')" aria-label="展开/折叠">
                    <span class="toggle-icon">▼</span>
                </button>
            </div>
        `;
        
        // 创建抽屉内容
        const drawerContent = document.createElement('div');
        drawerContent.className = 'task-drawer-content';
        
        // 将任务分为未完成和已完成两部分
        let pendingTasks = tasksForDate.filter(task => !task.completed || task.isEditing);
        let completedTasks = tasksForDate.filter(task => task.completed && !task.isEditing);
        
        // 优先级排序函数
        const prioritySort = (a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
        };
        
        // 按优先级排序
        pendingTasks.sort(prioritySort);
        completedTasks.sort(prioritySort);
        
        // 创建任务列表容器
        const dateTaskList = document.createElement('ul');
        dateTaskList.className = 'date-task-list';
        
        // 渲染未完成任务
        pendingTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'}`;
            taskItem.setAttribute('data-task-id', task.id);
            
            // 检查任务是否处于编辑状态
            if (task.isEditing) {
                // 编辑模式
                taskItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onchange="toggleTaskStatus('${task.id}')"
                        aria-label="标记任务为${task.completed ? '未完成' : '已完成'}"
                        disabled
                    >
                    <div style="flex: 1;">
                        <input 
                            type="text" 
                            class="task-edit-input" 
                            value="${escapeHtml(task.text)}" 
                            id="edit-input-${task.id}"
                            onkeypress="if(event.key==='Enter') saveEdit('${task.id}')"
                            aria-label="编辑任务"
                        >
                        <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                            <label for="priority-edit-${task.id}" style="font-size: 0.8125rem; color: #64748b;">优先级：</label>
                            <select 
                                id="priority-edit-${task.id}" 
                                class="task-priority-select"
                                aria-label="编辑任务优先级"
                            >
                                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>高</option>
                                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>中</option>
                                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>低</option>
                            </select>
                        </div>
                    </div>
                    <div class="task-edit-actions">
                        <button 
                            class="save-btn" 
                            onclick="saveEdit('${task.id}')"
                            aria-label="保存编辑"
                        >
                            保存
                        </button>
                        <button 
                            class="cancel-btn" 
                            onclick="cancelEdit('${task.id}')"
                            aria-label="取消编辑"
                        >
                            取消
                        </button>
                    </div>
                `;
            } else {
                // 查看模式
            taskItem.innerHTML = `
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="toggleTaskStatus('${task.id}')"
                    aria-label="标记任务为${task.completed ? '未完成' : '已完成'}"
                >
                <span class="task-content">${escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <span class="priority-label priority-${task.priority || 'medium'}">${task.priority || 'medium'}</span>
                    <button 
                        class="edit-btn" 
                        onclick="editTask('${task.id}')"
                        aria-label="编辑任务"
                    >
                        编辑
                    </button>
                    <button 
                        class="delete-btn" 
                        onclick="deleteTask('${task.id}')"
                        aria-label="删除任务"
                    >
                        删除
                    </button>
                </div>
            `;
            }
            
            dateTaskList.appendChild(taskItem);
        });
        
        // 如果有已完成任务，添加分隔线和已完成任务标题
        if (completedTasks.length > 0) {
            // 添加分隔线
            const divider = document.createElement('li');
            divider.className = 'task-divider';
            divider.innerHTML = `
                <div class="divider-content">
                    <span class="divider-text">已完成任务</span>
                </div>
            `;
            dateTaskList.appendChild(divider);
            
            // 渲染已完成任务
            completedTasks.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'}`;
                taskItem.setAttribute('data-task-id', task.id);
                
                taskItem.innerHTML = `
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${task.completed ? 'checked' : ''}
                        onchange="toggleTaskStatus('${task.id}')"
                        aria-label="标记任务为${task.completed ? '未完成' : '已完成'}"
                    >
                    <span class="task-content">${escapeHtml(task.text)}</span>
                    <div class="task-actions">
                        <span class="priority-label priority-${task.priority || 'medium'}">${task.priority || 'medium'}</span>
                        <button 
                            class="edit-btn" 
                            onclick="editTask('${task.id}')"
                            aria-label="编辑任务"
                        >
                            编辑
                        </button>
                        <button 
                            class="delete-btn" 
                            onclick="deleteTask('${task.id}')"
                            aria-label="删除任务"
                        >
                            删除
                        </button>
                    </div>
                `;
                
                dateTaskList.appendChild(taskItem);
            });
        }
        
        // 组装抽屉内容
        drawerContent.appendChild(dateTaskList);
        drawer.appendChild(drawerHeader);
        drawer.appendChild(drawerContent);
        
        // 添加到主任务列表
        taskList.appendChild(drawer);
    });
}

// 更新统计信息
function updateStats() {
    // 计算未完成任务数量
    const pending = tasks.filter(task => !task.completed).length;
    
    // 计算已完成任务数量
    const completed = tasks.filter(task => task.completed).length;
    
    // 更新显示
    pendingCount.textContent = pending;
    completedCount.textContent = completed;
}

// 保存任务到 localStorage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// 从 localStorage 加载任务
function loadTasks() {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// HTML 转义函数，防止 XSS 攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', init);