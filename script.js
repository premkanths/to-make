class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentView = 'today';
        this.selectedTask = null;
        this.currentDate = new Date();
        this.selectedCalendarDate = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTheme();
        this.renderTasks();
        this.updateCounts();
    }

    bindEvents() {
        // Navigation events
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if (view) this.switchView(view);
            });
        });

        // Add task event
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask(e.target.value);
                e.target.value = '';
            }
        });

        // Close panel event
        document.getElementById('close-panel').addEventListener('click', () => {
            this.closeDetailsPanel();
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Calendar events
        document.getElementById('calendar-toggle').addEventListener('click', () => {
            this.openCalendar();
        });

        document.getElementById('close-calendar').addEventListener('click', () => {
            this.closeCalendar();
        });

        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Day tasks modal events
        document.getElementById('close-day-tasks').addEventListener('click', () => {
            this.closeDayTasks();
        });

        document.getElementById('add-day-task').addEventListener('click', () => {
            this.addDayTask();
        });

        document.getElementById('day-task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addDayTask();
            }
        });

        // Close modals when clicking outside
        document.getElementById('calendar-modal').addEventListener('click', (e) => {
            if (e.target.id === 'calendar-modal') {
                this.closeCalendar();
            }
        });

        document.getElementById('day-tasks-modal').addEventListener('click', (e) => {
            if (e.target.id === 'day-tasks-modal') {
                this.closeDayTasks();
            }
        });
    }

    loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        return saved ? JSON.parse(saved) : this.getDefaultTasks();
    }

    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    getDefaultTasks() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return [
            {
                id: 1,
                text: 'Morning Run',
                completed: false,
                category: 'daily',
                time: '07:00',
                date: today.toISOString().split('T')[0],
                subtasks: [],
                recurring: 'daily'
            },
            {
                id: 2,
                text: 'Interview Mr. Li',
                completed: false,
                category: 'work',
                time: '09:00',
                date: today.toISOString().split('T')[0],
                subtasks: []
            },
            {
                id: 3,
                text: 'Prepare Work Report',
                completed: false,
                category: 'work',
                time: '13:00',
                date: today.toISOString().split('T')[0],
                subtasks: [
                    { id: 31, text: 'Organize Documents', completed: false },
                    { id: 32, text: 'Prepare Presentation', completed: false }
                ]
            },
            {
                id: 4,
                text: 'Evening Reading',
                completed: false,
                category: 'life',
                time: '22:00',
                date: today.toISOString().split('T')[0],
                subtasks: []
            },
            {
                id: 5,
                text: 'Check Work Emails',
                completed: false,
                category: 'work',
                time: '',
                date: tomorrow.toISOString().split('T')[0],
                subtasks: []
            }
        ];
    }

    addTask(text) {
        if (!text.trim()) return;

        const newTask = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            category: this.getCategoryFromView(),
            time: '',
            date: this.getDateFromView(),
            subtasks: [],
            recurring: this.currentView === 'daily' ? 'daily' : null
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        this.updateCounts();
    }

    getCategoryFromView() {
        const categoryViews = ['work', 'study', 'travel', 'daily', 'life'];
        return categoryViews.includes(this.currentView) ? this.currentView : 'daily';
    }

    getDateFromView() {
        const today = new Date();
        if (this.currentView === 'today') {
            return today.toISOString().split('T')[0];
        }
        return today.toISOString().split('T')[0];
    }

    switchView(view) {
        this.currentView = view;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Update main title
        const titles = {
            today: 'Today',
            next7days: 'Next 7 Days',
            inbox: 'Inbox',
            work: 'Work Tasks',
            study: 'Study Goals',
            travel: 'Travel Plans',
            daily: 'Daily To-Dos',
            life: 'Life Errands',
            thisweek: 'This Week',
            unscheduled: 'Unscheduled',
            completed: 'Completed'
        };
        document.getElementById('main-title').textContent = titles[view] || view;

        this.renderTasks();
    }

    getTasksForDate(dateStr) {
        const normalTasks = this.tasks.filter(task => task.date === dateStr);
        const dailyTasks = this.tasks.filter(task => task.recurring === 'daily');
        
        // Create instances of daily tasks for this date
        const dailyInstances = dailyTasks.map(task => ({
            ...task,
            id: `${task.id}-${dateStr}`,
            date: dateStr,
            completed: this.isDailyTaskCompletedForDate(task.id, dateStr)
        }));

        return [...normalTasks, ...dailyInstances];
    }

    isDailyTaskCompletedForDate(taskId, dateStr) {
        const completedDaily = JSON.parse(localStorage.getItem('completedDailyTasks') || '{}');
        return completedDaily[`${taskId}-${dateStr}`] || false;
    }

    setDailyTaskCompletedForDate(taskId, dateStr, completed) {
        const completedDaily = JSON.parse(localStorage.getItem('completedDailyTasks') || '{}');
        completedDaily[`${taskId}-${dateStr}`] = completed;
        localStorage.setItem('completedDailyTasks', JSON.stringify(completedDaily));
    }

    renderTasks() {
        const container = document.getElementById('task-groups');
        const filteredTasks = this.getFilteredTasks();
        const groupedTasks = this.groupTasks(filteredTasks);

        container.innerHTML = '';

        Object.keys(groupedTasks).forEach(groupKey => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'task-group';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'group-header';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'group-title';
            titleSpan.textContent = groupKey;
            
            headerDiv.appendChild(titleSpan);
            groupDiv.appendChild(headerDiv);

            groupedTasks[groupKey].forEach(task => {
                const taskElement = this.createTaskElement(task);
                groupDiv.appendChild(taskElement);
            });

            container.appendChild(groupDiv);
        });
    }

    getFilteredTasks() {
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date();
        const next7Date = new Date(todayDate);
        next7Date.setDate(todayDate.getDate() + 7);

        switch (this.currentView) {
            case 'today':
                return this.getTasksForDate(today).filter(task => !task.completed);
            case 'next7days':
                const next7Tasks = [];
                for (let i = 0; i <= 7; i++) {
                    const date = new Date(todayDate);
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayTasks = this.getTasksForDate(dateStr).filter(task => !task.completed);
                    next7Tasks.push(...dayTasks);
                }
                return next7Tasks;
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'unscheduled':
                return this.tasks.filter(task => !task.time && !task.completed);
            case 'work':
            case 'study':
            case 'travel':
            case 'daily':
            case 'life':
                if (this.currentView === 'daily') {
                    // Show all daily recurring tasks
                    return this.tasks.filter(task => task.recurring === 'daily');
                }
                return this.tasks.filter(task => task.category === this.currentView && !task.completed);
            default:
                return this.tasks.filter(task => !task.completed);
        }
    }

    groupTasks(tasks) {
        const groups = {};
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        tasks.forEach(task => {
            let groupKey;
            if (this.currentView === 'daily') {
                groupKey = 'Daily Recurring Tasks';
            } else if (task.date === today) {
                groupKey = 'Today';
            } else if (task.date === tomorrowStr) {
                groupKey = 'Tomorrow';
            } else if (this.currentView === 'completed') {
                groupKey = 'Completed Tasks';
            } else {
                groupKey = 'Next 7 Days';
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(task);
        });

        return groups;
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskDiv.dataset.taskId = task.id;

        taskDiv.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    ${task.time ? `<span class="task-time">${task.time}</span>` : ''}
                    <span class="task-category">${task.category}</span>
                    ${task.recurring ? '<span class="task-category" style="background: #96ceb4;">Daily</span>' : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Bind events
        taskDiv.querySelector('.task-checkbox').addEventListener('change', (e) => {
            if (task.recurring === 'daily' && typeof task.id === 'string' && task.id.includes('-')) {
                // This is a daily task instance
                const [originalId, dateStr] = task.id.split('-');
                this.setDailyTaskCompletedForDate(parseInt(originalId), dateStr, e.target.checked);
                this.renderTasks();
            } else {
                this.toggleTask(task.id, e.target.checked);
            }
        });

        taskDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        taskDiv.addEventListener('click', () => {
            this.showTaskDetails(task);
        });

        return taskDiv;
    }

    toggleTask(taskId, completed) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = completed;
            this.saveTasks();
            this.renderTasks();
            this.updateCounts();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateCounts();
        if (this.selectedTask && this.selectedTask.id === taskId) {
            this.closeDetailsPanel();
        }
    }

    showTaskDetails(task) {
        this.selectedTask = task;
        const panel = document.getElementById('details-panel');
        const title = document.getElementById('detail-title');
        const content = document.getElementById('panel-content');

        title.textContent = task.text;
        
        content.innerHTML = `
            <div class="task-detail">
                <h4>Task Name</h4>
                <input type="text" class="detail-input" value="${task.text}" id="detail-name">
            </div>
            <div class="task-detail">
                <h4>Time</h4>
                <input type="time" class="detail-input" value="${task.time || ''}" id="detail-time">
            </div>
            <div class="task-detail">
                <h4>Category</h4>
                <select class="detail-input" id="detail-category">
                    <option value="work" ${task.category === 'work' ? 'selected' : ''}>Work</option>
                    <option value="study" ${task.category === 'study' ? 'selected' : ''}>Study</option>
                    <option value="travel" ${task.category === 'travel' ? 'selected' : ''}>Travel</option>
                    <option value="daily" ${task.category === 'daily' ? 'selected' : ''}>Daily</option>
                    <option value="life" ${task.category === 'life' ? 'selected' : ''}>Life</option>
                </select>
            </div>
            <div class="task-detail">
                <h4>Recurring</h4>
                <select class="detail-input" id="detail-recurring">
                    <option value="">None</option>
                    <option value="daily" ${task.recurring === 'daily' ? 'selected' : ''}>Daily</option>
                </select>
            </div>
            <div class="subtasks">
                <h4>Subtasks</h4>
                <div id="subtasks-list">
                    ${task.subtasks.map(subtask => `
                        <div class="subtask-item">
                            <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} data-subtask-id="${subtask.id}">
                            <span class="subtask-text">${subtask.text}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="add-subtask" id="add-subtask">+ Add subtask</div>
            </div>
        `;

        // Bind detail events
        this.bindDetailEvents();
    }

    bindDetailEvents() {
        document.getElementById('detail-name').addEventListener('change', (e) => {
            if (this.selectedTask) {
                this.selectedTask.text = e.target.value;
                this.saveTasks();
                this.renderTasks();
            }
        });

        document.getElementById('detail-time').addEventListener('change', (e) => {
            if (this.selectedTask) {
                this.selectedTask.time = e.target.value;
                this.saveTasks();
                this.renderTasks();
            }
        });

        document.getElementById('detail-category').addEventListener('change', (e) => {
            if (this.selectedTask) {
                this.selectedTask.category = e.target.value;
                this.saveTasks();
                this.renderTasks();
                this.updateCounts();
            }
        });

        document.getElementById('detail-recurring').addEventListener('change', (e) => {
            if (this.selectedTask) {
                this.selectedTask.recurring = e.target.value || null;
                this.saveTasks();
                this.renderTasks();
                this.updateCounts();
            }
        });

        document.getElementById('add-subtask').addEventListener('click', () => {
            const text = prompt('Enter subtask:');
            if (text && this.selectedTask) {
                this.selectedTask.subtasks.push({
                    id: Date.now(),
                    text: text,
                    completed: false
                });
                this.saveTasks();
                this.showTaskDetails(this.selectedTask);
            }
        });

        document.querySelectorAll('.subtask-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const subtaskId = parseInt(e.target.dataset.subtaskId);
                const subtask = this.selectedTask.subtasks.find(s => s.id === subtaskId);
                if (subtask) {
                    subtask.completed = e.target.checked;
                    this.saveTasks();
                }
            });
        });
    }

    closeDetailsPanel() {
        this.selectedTask = null;
        document.getElementById('detail-title').textContent = 'Select a task';
        document.getElementById('panel-content').innerHTML = '<p>Select a task to view details</p>';
    }

    // Calendar Methods
    openCalendar() {
        document.getElementById('calendar-modal').classList.add('open');
        this.renderCalendar();
    }

    closeCalendar() {
        document.getElementById('calendar-modal').classList.remove('open');
    }

    renderCalendar() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        document.getElementById('calendar-month-year').textContent = 
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        const today = new Date().toDateString();

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (date.getMonth() !== this.currentDate.getMonth()) {
                dayElement.classList.add('other-month');
            }
            
            if (date.toDateString() === today) {
                dayElement.classList.add('today');
            }

            const dayTasks = this.getTasksForDate(dateStr).filter(task => !task.completed);
            
            dayElement.innerHTML = `
                <div class="day-number">${date.getDate()}</div>
                <div class="day-tasks">
                    ${dayTasks.slice(0, 3).map(task => 
                        `<div class="day-task ${task.category}">${task.text}</div>`
                    ).join('')}
                    ${dayTasks.length > 3 ? `<div class="day-task">+${dayTasks.length - 3} more</div>` : ''}
                </div>
            `;

            dayElement.addEventListener('click', () => {
                this.openDayTasks(dateStr);
            });

            grid.appendChild(dayElement);
        }
    }

    openDayTasks(dateStr) {
        this.selectedCalendarDate = dateStr;
        const date = new Date(dateStr);
        document.getElementById('day-tasks-title').textContent = 
            `Tasks for ${date.toLocaleDateString()}`;
        
        this.renderDayTasks();
        document.getElementById('day-tasks-modal').classList.add('open');
    }

    closeDayTasks() {
        document.getElementById('day-tasks-modal').classList.remove('open');
        this.selectedCalendarDate = null;
    }

    renderDayTasks() {
        if (!this.selectedCalendarDate) return;

        const dayTasks = this.getTasksForDate(this.selectedCalendarDate);
        const list = document.getElementById('day-tasks-list');
        
        list.innerHTML = dayTasks.map(task => `
            <div class="day-task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="app.toggleDayTask('${task.id}', this.checked)">
                <span>${task.text} ${task.time ? `(${task.time})` : ''}</span>
            </div>
        `).join('');
    }

    toggleDayTask(taskId, completed) {
        if (typeof taskId === 'string' && taskId.includes('-')) {
            // Daily task instance
            const [originalId, dateStr] = taskId.split('-');
            this.setDailyTaskCompletedForDate(parseInt(originalId), dateStr, completed);
        } else {
            // Regular task
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = completed;
                this.saveTasks();
            }
        }
        this.renderDayTasks();
        this.renderCalendar();
        this.renderTasks();
        this.updateCounts();
    }

    addDayTask() {
        const input = document.getElementById('day-task-input');
        const text = input.value.trim();
        
        if (!text || !this.selectedCalendarDate) return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            category: 'daily',
            time: '',
            date: this.selectedCalendarDate,
            subtasks: []
        };

        this.tasks.push(newTask);
        this.saveTasks();
        input.value = '';
        
        this.renderDayTasks();
        this.renderCalendar();
        this.updateCounts();
    }

    updateCounts() {
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date();
        const next7Date = new Date(todayDate);
        next7Date.setDate(todayDate.getDate() + 7);

        // Today count
        const todayTasks = this.getTasksForDate(today);
        const todayCount = todayTasks.filter(t => !t.completed).length;
        document.getElementById('today-count').textContent = todayCount;

        // Next 7 days count
        let next7Count = 0;
        for (let i = 0; i <= 7; i++) {
            const date = new Date(todayDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayTasks = this.getTasksForDate(dateStr);
            next7Count += dayTasks.filter(t => !t.completed).length;
        }
        document.getElementById('next7-count').textContent = next7Count;

        // Category counts
        ['work', 'study', 'travel', 'life'].forEach(category => {
            const count = this.tasks.filter(t => t.category === category && !t.completed).length;
            document.getElementById(`${category}-count`).textContent = count;
        });

        // Daily count (recurring tasks)
        const dailyCount = this.tasks.filter(t => t.recurring === 'daily').length;
        document.getElementById('daily-count').textContent = dailyCount;

        // Other counts
        document.getElementById('inbox-count').textContent = this.tasks.filter(t => !t.category && !t.completed).length;
        document.getElementById('completed-count').textContent = this.tasks.filter(t => t.completed).length;
        document.getElementById('unscheduled-count').textContent = this.tasks.filter(t => !t.time && !t.completed).length;
        document.getElementById('week-count').textContent = next7Count;
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
});
