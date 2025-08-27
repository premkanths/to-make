class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentView = 'next7days';
        this.selectedTask = null;
        this.init();
    }

    init() {
        this.bindEvents();
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
    }

    loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        return saved ? JSON.parse(saved) : this.getDefaultTasks();
    }

    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
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
                subtasks: []
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
            subtasks: []
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
                return this.tasks.filter(task => task.date === today && !task.completed);
            case 'next7days':
                return this.tasks.filter(task => {
                    const taskDate = new Date(task.date);
                    return taskDate >= todayDate && taskDate <= next7Date && !task.completed;
                });
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'unscheduled':
                return this.tasks.filter(task => !task.time && !task.completed);
            case 'work':
            case 'study':
            case 'travel':
            case 'daily':
            case 'life':
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
            if (task.date === today) {
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
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Bind events
        taskDiv.querySelector('.task-checkbox').addEventListener('change', (e) => {
            this.toggleTask(task.id, e.target.checked);
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

    updateCounts() {
        const today = new Date().toISOString().split('T')[0];
        const todayDate = new Date();
        const next7Date = new Date(todayDate);
        next7Date.setDate(todayDate.getDate() + 7);

        // Today count
        const todayCount = this.tasks.filter(t => t.date === today && !t.completed).length;
        document.getElementById('today-count').textContent = todayCount;

        // Next 7 days count
        const next7Count = this.tasks.filter(t => {
            const taskDate = new Date(t.date);
            return taskDate >= todayDate && taskDate <= next7Date && !t.completed;
        }).length;
        document.getElementById('next7-count').textContent = next7Count;

        // Category counts
        ['work', 'study', 'travel', 'daily', 'life'].forEach(category => {
            const count = this.tasks.filter(t => t.category === category && !t.completed).length;
            document.getElementById(`${category}-count`).textContent = count;
        });

        // Other counts
        document.getElementById('inbox-count').textContent = this.tasks.filter(t => !t.category && !t.completed).length;
        document.getElementById('completed-count').textContent = this.tasks.filter(t => t.completed).length;
        document.getElementById('unscheduled-count').textContent = this.tasks.filter(t => !t.time && !t.completed).length;
        document.getElementById('week-count').textContent = next7Count;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
