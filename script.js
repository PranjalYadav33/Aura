// Comprehensive Task Management System
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.dailyTasks = this.loadDailyTasks();
        this.focusSessions = this.loadFocusSessions();
        this.focusGoals = this.loadFocusGoals();
        this.appState = this.loadAppState();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.updateStats();
        this.renderCharts();
        this.setupAnimations();
        this.loadTasksToUI();
        this.loadDailyTasksToUI();
        this.loadFocusToUI();
        this.restoreAppState();
    }

    // Local Storage Methods
    loadTasks() {
        const saved = localStorage.getItem('aura-tasks');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    loadDailyTasks() {
        const saved = localStorage.getItem('aura-daily-tasks');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    loadFocusSessions() {
        const saved = localStorage.getItem('aura-focus-sessions');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    loadFocusGoals() {
        const saved = localStorage.getItem('aura-focus-goals');
        if (saved) {
            return JSON.parse(saved);
        }
        return [];
    }

    loadAppState() {
        const saved = localStorage.getItem('aura-app-state');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            lastPage: 'home',
            timerState: {
                minutes: 25,
                seconds: 0,
                isRunning: false,
                mode: 'focus'
            }
        };
    }

    saveTasks() {
        localStorage.setItem('aura-tasks', JSON.stringify(this.tasks));
        this.updateStats();
        this.renderCharts();
    }

    saveDailyTasks() {
        localStorage.setItem('aura-daily-tasks', JSON.stringify(this.dailyTasks));
        this.updateStats();
        this.renderCharts();
    }

    saveFocusSessions() {
        localStorage.setItem('aura-focus-sessions', JSON.stringify(this.focusSessions));
        this.updateFocusStats();
    }

    saveFocusGoals() {
        localStorage.setItem('aura-focus-goals', JSON.stringify(this.focusGoals));
        this.updateFocusStats();
    }

    saveAppState() {
        localStorage.setItem('aura-app-state', JSON.stringify(this.appState));
    }

    // Navigation Setup
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.getAttribute('data-page');

                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Show target page with animation
                pages.forEach(page => {
                    page.classList.remove('active');
                    if (page.id === `${targetPage}-page`) {
                        setTimeout(() => {
                            page.classList.add('active');
                        }, 150);
                    }
                });

                // Save current page to app state
                this.appState.lastPage = targetPage;
                this.saveAppState();
            });
        });
    }

    // Restore app state (last page, timer state, etc.)
    restoreAppState() {
        const { lastPage, timerState } = this.appState;

        // Restore last page
        if (lastPage && lastPage !== 'home') {
            const navLinks = document.querySelectorAll('.nav-link');
            const pages = document.querySelectorAll('.page');

            // Update navigation
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === lastPage) {
                    link.classList.add('active');
                }
            });

            // Show correct page
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === `${lastPage}-page`) {
                    page.classList.add('active');
                }
            });
        }

        // Restore timer state if on focus page
        if (lastPage === 'focus' && timerState) {
            this.restoreTimerState(timerState);
        }
    }

    // Calculate real stats from tasks
    calculateStats() {
        const allTasks = [...this.tasks, ...this.dailyTasks];
        const completed = allTasks.filter(task => task.completed).length;
        const total = allTasks.length;
        const pending = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Calculate categories
        const categories = {};
        allTasks.forEach(task => {
            const category = task.category || 'Personal';
            if (!categories[category]) {
                categories[category] = { completed: 0, total: 0 };
            }
            categories[category].total++;
            if (task.completed) {
                categories[category].completed++;
            }
        });

        // Calculate monthly data and growth metrics
        const monthlyData = this.calculateMonthlyData();
        const growthMetrics = this.calculateGrowthMetrics();

        return {
            completed,
            pending,
            total,
            percentage,
            categories,
            monthlyData,
            growthMetrics
        };
    }

    calculateMonthlyData() {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = {};

        // Get last 3 months
        for (let i = 2; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = months[date.getMonth()];
            monthlyData[monthName] = 0;
        }

        // Count completed tasks by month
        [...this.tasks, ...this.dailyTasks].forEach(task => {
            if (task.completed && task.completedDate) {
                const taskDate = new Date(task.completedDate);
                const monthName = months[taskDate.getMonth()];
                if (monthlyData.hasOwnProperty(monthName)) {
                    monthlyData[monthName]++;
                }
            }
        });

        return monthlyData;
    }

    // Calculate growth metrics
    calculateGrowthMetrics() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Get current month and last month data
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0);

        let currentMonthCompleted = 0;
        let lastMonthCompleted = 0;

        [...this.tasks, ...this.dailyTasks].forEach(task => {
            if (task.completed && task.completedDate) {
                const taskDate = new Date(task.completedDate);

                if (taskDate >= currentMonthStart) {
                    currentMonthCompleted++;
                } else if (taskDate >= lastMonthStart && taskDate <= lastMonthEnd) {
                    lastMonthCompleted++;
                }
            }
        });

        // Calculate growth percentage
        let growthPercentage = 0;
        if (lastMonthCompleted > 0) {
            growthPercentage = Math.round(((currentMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100);
        } else if (currentMonthCompleted > 0) {
            growthPercentage = 100; // 100% growth if no tasks last month but some this month
        }

        return {
            currentMonthCompleted,
            lastMonthCompleted,
            growthPercentage,
            isPositiveGrowth: growthPercentage >= 0
        };
    }

    // Update Statistics
    updateStats() {
        const stats = this.calculateStats();

        // Update main stat cards
        const completedElement = document.getElementById('completedTasks');
        const pendingElement = document.getElementById('pendingTasks');
        const progressElement = document.getElementById('progressPercentage');

        if (completedElement) {
            this.animateNumber(completedElement, 0, stats.completed, 1200);
        }
        if (pendingElement) {
            this.animateNumber(pendingElement, 0, stats.pending, 1400);
        }
        if (progressElement) {
            this.animateNumber(progressElement, 0, stats.percentage, 1600, '%');
        }

        // Update growth metrics
        this.updateGrowthMetrics(stats);

        // Update chart metrics
        this.updateChartMetrics(stats);
    }

    // Update growth metrics display
    updateGrowthMetrics(stats) {
        const { growthMetrics } = stats;

        // Update completion growth
        const completionGrowthElement = document.getElementById('completionGrowth');
        const completionGrowthPercentElement = document.getElementById('completionGrowthPercent');

        if (completionGrowthElement && completionGrowthPercentElement) {
            if (stats.total === 0) {
                completionGrowthElement.textContent = 'No tasks created yet';
                completionGrowthPercentElement.textContent = '--';
                completionGrowthPercentElement.className = 'metric-change neutral';
            } else if (growthMetrics.currentMonthCompleted === 0 && growthMetrics.lastMonthCompleted === 0) {
                completionGrowthElement.textContent = 'No tasks completed yet';
                completionGrowthPercentElement.textContent = '0%';
                completionGrowthPercentElement.className = 'metric-change neutral';
            } else {
                const growthText = growthMetrics.growthPercentage === 0 ?
                    'No change from last month' :
                    `${Math.abs(growthMetrics.growthPercentage)}% ${growthMetrics.isPositiveGrowth ? 'increase' : 'decrease'} from last month`;

                completionGrowthElement.textContent = growthText;

                const percentText = growthMetrics.growthPercentage === 0 ? '0%' :
                    `${growthMetrics.isPositiveGrowth ? '+' : ''}${growthMetrics.growthPercentage}%`;

                completionGrowthPercentElement.textContent = percentText;
                completionGrowthPercentElement.className = `metric-change ${growthMetrics.isPositiveGrowth ? 'positive' : 'negative'}`;
            }
        }

        // Update stat card changes
        const completedTasksChangeElement = document.getElementById('completedTasksChange');
        const pendingTasksChangeElement = document.getElementById('pendingTasksChange');
        const progressChangeElement = document.getElementById('progressChange');

        if (completedTasksChangeElement) {
            if (stats.total === 0) {
                completedTasksChangeElement.textContent = 'Start creating tasks';
                completedTasksChangeElement.className = 'stat-change neutral';
            } else {
                const changeText = growthMetrics.currentMonthCompleted > 0 ?
                    `${growthMetrics.currentMonthCompleted} this month` : 'No tasks completed this month';
                completedTasksChangeElement.textContent = changeText;
                completedTasksChangeElement.className = 'stat-change neutral';
            }
        }

        if (pendingTasksChangeElement) {
            if (stats.total === 0) {
                pendingTasksChangeElement.textContent = 'No tasks to show';
                pendingTasksChangeElement.className = 'stat-change neutral';
            } else {
                const pendingText = stats.pending > 0 ?
                    `${stats.pending} remaining` : 'All tasks completed!';
                pendingTasksChangeElement.textContent = pendingText;
                pendingTasksChangeElement.className = `stat-change ${stats.pending === 0 && stats.total > 0 ? 'positive' : 'neutral'}`;
            }
        }

        if (progressChangeElement) {
            if (stats.total === 0) {
                progressChangeElement.textContent = 'Create your first task';
                progressChangeElement.className = 'stat-change neutral';
            } else {
                const progressText = `${stats.completed} of ${stats.total} completed`;
                progressChangeElement.textContent = progressText;
                progressChangeElement.className = 'stat-change neutral';
            }
        }
    }

    // Update chart metrics
    updateChartMetrics(stats) {
        const categoryProgressElement = document.getElementById('categoryProgress');
        const overallProgressElement = document.getElementById('overallProgress');

        if (categoryProgressElement && overallProgressElement) {
            if (stats.total === 0) {
                categoryProgressElement.textContent = 'No tasks to categorize yet';
                overallProgressElement.textContent = 'Create tasks to see progress';
                overallProgressElement.className = 'metric-change neutral';
            } else {
                const categoryCount = Object.keys(stats.categories).length;
                const categoryText = categoryCount > 0 ?
                    `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'} tracked` :
                    'No categories yet';

                categoryProgressElement.textContent = categoryText;

                const overallText = `${stats.percentage}% complete`;
                overallProgressElement.textContent = overallText;
                overallProgressElement.className = `metric-change ${stats.percentage >= 50 ? 'positive' : 'neutral'}`;
            }
        }
    }

    // Animate Numbers
    animateNumber(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeOutCubic);
            
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    // Render Charts
    renderCharts() {
        this.renderCompletedChart();
        this.renderCategoryChart();
    }

    renderCompletedChart() {
        const ctx = document.getElementById('completedChart');
        if (!ctx) return;

        const stats = this.calculateStats();
        const data = Object.values(stats.monthlyData);
        const labels = Object.keys(stats.monthlyData);

        // Clear any existing chart
        if (this.completedChart) {
            this.completedChart.destroy();
        }

        // If no data, show empty chart with placeholder
        const hasData = data.some(value => value > 0);
        const chartData = hasData ? data : [0, 0, 0];

        this.completedChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: chartData,
                    backgroundColor: hasData ? '#6B8F71' : '#e5e7eb',
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        display: false,
                        beginAtZero: true
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const stats = this.calculateStats();
        const categories = Object.keys(stats.categories);

        // Clear any existing chart
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        // Handle empty state
        if (categories.length === 0) {
            // Create empty chart with placeholder data
            this.categoryChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Personal', 'Work', 'Other'],
                    datasets: [{
                        data: [0, 0, 0],
                        borderColor: '#e5e7eb',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: '#e5e7eb',
                        pointBorderColor: '#e5e7eb',
                        pointBorderWidth: 0,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            border: {
                                display: false
                            },
                            ticks: {
                                color: '#9ca3af',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        y: {
                            display: false,
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeOutQuart'
                    }
                }
            });
            return;
        }

        const data = categories.map(cat => {
            const category = stats.categories[cat];
            return category.total > 0 ? (category.completed / category.total) * 100 : 0;
        });

        this.categoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: categories,
                datasets: [{
                    data: data,
                    borderColor: '#6B8F71',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#6B8F71',
                    pointBorderColor: '#6B8F71',
                    pointBorderWidth: 0,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        display: false,
                        beginAtZero: true,
                        max: 100
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Setup Animations
    setupAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all cards
        document.querySelectorAll('.stat-card, .chart-card, .quote-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });

        // Add stagger effect
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.1}s`;
        });
    }

    // Load tasks into UI
    loadTasksToUI() {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <h3 class="empty-state-title">No tasks yet</h3>
                    <p class="empty-state-description">Create your first task to get started with organizing your work.</p>
                    <button class="empty-state-btn new-task-btn">Create First Task</button>
                </div>
            `;
            // Add event listener to the empty state button
            const emptyStateBtn = taskList.querySelector('.new-task-btn');
            if (emptyStateBtn) {
                emptyStateBtn.addEventListener('click', () => {
                    showNewTaskModal();
                });
            }
        } else {
            this.tasks.forEach(task => {
                const taskHTML = this.createTaskHTML(task);
                taskList.insertAdjacentHTML('beforeend', taskHTML);
            });
            // Reinitialize task handlers
            this.initializeTaskHandlers();
        }
    }

    // Load daily tasks into UI
    loadDailyTasksToUI() {
        const dailyTaskList = document.getElementById('dailyTaskList');
        if (!dailyTaskList) return;

        dailyTaskList.innerHTML = '';

        if (this.dailyTasks.length === 0) {
            dailyTaskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-calendar-day"></i>
                    </div>
                    <h3 class="empty-state-title">No daily tasks scheduled</h3>
                    <p class="empty-state-description">Add tasks to your daily schedule to stay organized throughout the day.</p>
                    <button class="empty-state-btn add-daily-task-btn">Add First Daily Task</button>
                </div>
            `;
            // Add event listener to the empty state button
            const emptyStateBtn = dailyTaskList.querySelector('.add-daily-task-btn');
            if (emptyStateBtn) {
                emptyStateBtn.addEventListener('click', () => {
                    showAddDailyTaskModal();
                });
            }
        } else {
            this.dailyTasks.forEach(task => {
                const taskHTML = this.createDailyTaskHTML(task);
                dailyTaskList.insertAdjacentHTML('beforeend', taskHTML);
            });
            // Reinitialize daily task handlers
            this.initializeDailyTaskHandlers();
        }
    }

    // Create task HTML
    createTaskHTML(task) {
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox">
                    <input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''}>
                    <label for="${task.id}"></label>
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-category">${task.category}</div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit-btn" onclick="editTask(this)" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete-btn" onclick="deleteTask(this)" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Create daily task HTML
    createDailyTaskHTML(task) {
        return `
            <div class="daily-task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox">
                    <input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''}>
                    <label for="${task.id}"></label>
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-time">${task.time}</div>
                </div>
                <div class="task-priority ${task.priority}">
                    <span class="priority-dot"></span>
                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit-btn" onclick="editDailyTask(this)" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete-btn" onclick="deleteDailyTask(this)" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Add new task
    addTask(title, category) {
        const newTask = {
            id: 'task_' + Date.now(),
            title: title,
            category: category,
            completed: false,
            createdDate: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.loadTasksToUI();
        return newTask;
    }

    // Add new daily task
    addDailyTask(title, time, priority) {
        const newTask = {
            id: 'daily_' + Date.now(),
            title: title,
            time: time,
            priority: priority,
            completed: false,
            createdDate: new Date().toISOString()
        };

        this.dailyTasks.push(newTask);
        this.saveDailyTasks();
        this.loadDailyTasksToUI();
        return newTask;
    }

    // Toggle task completion
    toggleTask(taskId, isDaily = false) {
        const tasks = isDaily ? this.dailyTasks : this.tasks;
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                task.completedDate = new Date().toISOString();
            } else {
                delete task.completedDate;
            }

            if (isDaily) {
                this.saveDailyTasks();
            } else {
                this.saveTasks();
            }
        }
    }

    // Delete task
    deleteTask(taskId, isDaily = false) {
        if (isDaily) {
            this.dailyTasks = this.dailyTasks.filter(t => t.id !== taskId);
            this.saveDailyTasks();
            this.loadDailyTasksToUI();
        } else {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.loadTasksToUI();
        }
    }

    // Initialize task handlers
    initializeTaskHandlers() {
        const taskCheckboxes = document.querySelectorAll('#taskList .task-checkbox input[type="checkbox"]');

        taskCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.id;
                const taskItem = e.target.closest('.task-item');

                this.toggleTask(taskId, false);

                if (e.target.checked) {
                    taskItem.classList.add('completed');
                    setTimeout(() => {
                        const taskList = taskItem.parentElement;
                        taskList.appendChild(taskItem);
                    }, 300);
                } else {
                    taskItem.classList.remove('completed');
                    setTimeout(() => {
                        const taskList = taskItem.parentElement;
                        const firstCompletedTask = taskList.querySelector('.task-item.completed');
                        if (firstCompletedTask) {
                            taskList.insertBefore(taskItem, firstCompletedTask);
                        } else {
                            taskList.insertBefore(taskItem, taskList.firstChild);
                        }
                    }, 300);
                }
            });
        });
    }

    // Initialize daily task handlers
    initializeDailyTaskHandlers() {
        const dailyCheckboxes = document.querySelectorAll('#dailyTaskList .task-checkbox input[type="checkbox"]');

        dailyCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.id;
                const taskItem = e.target.closest('.daily-task-item');

                this.toggleTask(taskId, true);

                if (e.target.checked) {
                    taskItem.classList.add('completed');
                    setTimeout(() => {
                        const taskList = taskItem.parentElement;
                        taskList.appendChild(taskItem);
                    }, 300);
                } else {
                    taskItem.classList.remove('completed');
                    setTimeout(() => {
                        const taskList = taskItem.parentElement;
                        const firstCompletedTask = taskList.querySelector('.daily-task-item.completed');
                        if (firstCompletedTask) {
                            taskList.insertBefore(taskItem, firstCompletedTask);
                        } else {
                            taskList.insertBefore(taskItem, taskList.firstChild);
                        }
                    }, 300);
                }
            });
        });
    }

    // Focus Sessions Methods
    loadFocusToUI() {
        this.updateFocusStats();
        this.loadGoalsToUI();
        this.loadHistoryToUI();
        this.initializeFocusTimer();
    }

    updateFocusStats() {
        const totalTime = this.calculateTotalFocusTime();
        const todayTime = this.calculateTodayFocusTime();
        const streak = this.calculateCurrentStreak();
        const goalProgress = this.calculateGoalProgress();

        const totalElement = document.getElementById('totalFocusTime');
        const todayElement = document.getElementById('todayFocusTime');
        const streakElement = document.getElementById('currentStreak');
        const goalElement = document.getElementById('goalProgress');

        if (totalElement) totalElement.textContent = this.formatTime(totalTime);
        if (todayElement) {
            const activeGoal = this.focusGoals.find(goal => goal.active);
            if (activeGoal) {
                const todaySessionsCompleted = this.getTodayCompletedSessions(activeGoal);
                todayElement.textContent = `${todaySessionsCompleted}/${activeGoal.sessionCount} sessions`;
            } else {
                // Show total focus sessions today if no goal is set
                const todayFocusSessions = this.getTodayFocusSessions();
                todayElement.textContent = `${todayFocusSessions} sessions`;
            }
        }
        if (streakElement) streakElement.textContent = `${streak} days`;
        if (goalElement) goalElement.textContent = `${goalProgress}%`;
    }

    calculateTotalFocusTime() {
        return this.focusSessions
            .filter(session => session.type === 'focus')
            .reduce((total, session) => total + session.duration, 0);
    }

    calculateTodayFocusTime() {
        const today = new Date().toDateString();
        return this.focusSessions
            .filter(session => new Date(session.date).toDateString() === today)
            .reduce((total, session) => total + session.duration, 0);
    }

    calculateCurrentStreak() {
        if (this.focusSessions.length === 0) return 0;

        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);

        while (true) {
            const dateStr = currentDate.toDateString();
            const hasSession = this.focusSessions.some(session =>
                new Date(session.date).toDateString() === dateStr
            );

            if (hasSession) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    calculateGoalProgress() {
        const activeGoal = this.focusGoals.find(goal => goal.active);
        if (!activeGoal) return 0;

        const today = new Date().toDateString();
        const todaySessionsCompleted = this.getTodayCompletedSessions(activeGoal);

        // Calculate progress based on sessions completed vs target sessions
        return Math.min(Math.round((todaySessionsCompleted / activeGoal.sessionCount) * 100), 100);
    }

    getTodayCompletedSessions(goal) {
        const today = new Date().toDateString();
        return this.focusSessions.filter(session =>
            new Date(session.date).toDateString() === today &&
            session.duration >= (goal.sessionDuration - 5) && // Allow 5 min tolerance
            session.type === 'focus'
        ).length;
    }

    getTodayFocusSessions() {
        const today = new Date().toDateString();
        return this.focusSessions.filter(session =>
            new Date(session.date).toDateString() === today &&
            session.type === 'focus'
        ).length;
    }

    formatTime(minutes) {
        if (minutes === 0) return '0m';

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            if (remainingHours > 0) {
                return `${days}d ${remainingHours}h`;
            }
            return `${days}d`;
        } else if (hours > 0) {
            if (mins > 0) {
                return `${hours}h ${mins}m`;
            }
            return `${hours}h`;
        }
        return `${mins}m`;
    }

    // Add focus session
    addFocusSession(duration, type = 'focus') {
        const session = {
            id: 'focus_' + Date.now(),
            duration: duration,
            type: type,
            date: new Date().toISOString(),
            completed: true
        };

        this.focusSessions.push(session);
        this.saveFocusSessions();
        this.loadHistoryToUI();
        return session;
    }

    // Goals management
    addGoal(title, dailyTarget, duration, sessionCount, sessionDuration = 25) {
        // Deactivate other goals
        this.focusGoals.forEach(goal => goal.active = false);

        const goal = {
            id: 'goal_' + Date.now(),
            title: title,
            dailyTarget: dailyTarget, // in minutes
            duration: duration, // in days
            sessionCount: sessionCount, // number of sessions per day
            sessionDuration: sessionDuration, // minutes per session (default 25)
            startDate: new Date().toISOString(),
            active: true,
            created: new Date().toISOString(),
            completedSessions: {} // track daily completed sessions
        };

        this.focusGoals.push(goal);
        this.saveFocusGoals();
        this.loadGoalsToUI();
        this.updateTimerFromActiveGoal();
        return goal;
    }

    loadGoalsToUI() {
        const container = document.getElementById('goalsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.focusGoals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    <h3 class="empty-state-title">No goals set</h3>
                    <p class="empty-state-description">Set a focus goal to track your progress and stay motivated.</p>
                    <button class="empty-state-btn set-goal-btn">Set Your First Goal</button>
                </div>
            `;

            // Add event listener
            const btn = container.querySelector('.set-goal-btn');
            if (btn) {
                btn.addEventListener('click', () => showGoalModal());
            }
        } else {
            this.focusGoals.forEach(goal => {
                const goalHTML = this.createGoalHTML(goal);
                container.insertAdjacentHTML('beforeend', goalHTML);
            });

            // Update timer to match active goal
            this.updateTimerFromActiveGoal();
        }
    }

    createGoalHTML(goal) {
        const progress = this.calculateGoalProgressForGoal(goal);
        const daysLeft = this.calculateDaysLeft(goal);
        const todaySessionsCompleted = this.getTodayCompletedSessions(goal);

        return `
            <div class="goal-item" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <h4 class="goal-title">${goal.title}</h4>
                    <div class="goal-actions">
                        <button class="goal-action-btn edit-btn" onclick="editGoal('${goal.id}')" title="Edit Goal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="goal-action-btn delete-btn" onclick="deleteGoal('${goal.id}')" title="Delete Goal">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="goal-sessions">
                    <div class="session-info">
                        <span class="session-count">${todaySessionsCompleted}/${goal.sessionCount}</span>
                        <span class="session-label">sessions today</span>
                    </div>
                    <div class="session-duration">
                        <span>${goal.sessionDuration}min each</span>
                    </div>
                </div>
                <div class="goal-details">
                    <span>${goal.dailyTarget} min/day target</span>
                    <span>${daysLeft} days left</span>
                </div>
            </div>
        `;
    }

    calculateGoalProgressForGoal(goal) {
        const todaySessionsCompleted = this.getTodayCompletedSessions(goal);
        return Math.min(Math.round((todaySessionsCompleted / goal.sessionCount) * 100), 100);
    }

    calculateDaysLeft(goal) {
        const startDate = new Date(goal.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + goal.duration);

        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return Math.max(0, diffDays);
    }

    loadHistoryToUI() {
        const container = document.getElementById('historyContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.focusSessions.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-clock"></i>
                    <p>No focus sessions yet</p>
                    <small>Start your first focus session to see your history here</small>
                </div>
            `;
        } else {
            // Add history header with stats
            const totalSessions = this.focusSessions.length;
            const totalTime = this.calculateTotalFocusTime();
            const todaySessions = this.getTodayFocusSessions();

            container.innerHTML = `
                <div class="history-header">
                    <div class="history-stats">
                        <div class="history-stat">
                            <span class="stat-number">${totalSessions}</span>
                            <span class="stat-label">Total Sessions</span>
                        </div>
                        <div class="history-stat">
                            <span class="stat-number">${this.formatTime(totalTime)}</span>
                            <span class="stat-label">Total Time</span>
                        </div>
                        <div class="history-stat">
                            <span class="stat-number">${todaySessions}</span>
                            <span class="stat-label">Today</span>
                        </div>
                    </div>
                </div>
                <div class="history-list" id="historyList"></div>
            `;

            // Sort sessions by date (newest first)
            const sortedSessions = [...this.focusSessions].sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            const historyList = document.getElementById('historyList');

            // Group sessions by date
            const groupedSessions = this.groupSessionsByDate(sortedSessions);

            Object.keys(groupedSessions).slice(0, 7).forEach(dateKey => {
                const sessions = groupedSessions[dateKey];
                const dateHTML = this.createDateGroupHTML(dateKey, sessions);
                historyList.insertAdjacentHTML('beforeend', dateHTML);
            });

            // Add "Show More" button if there are more sessions
            if (Object.keys(groupedSessions).length > 7) {
                historyList.insertAdjacentHTML('beforeend', `
                    <div class="show-more-container">
                        <button class="show-more-btn" onclick="taskManager.showMoreHistory()">
                            <i class="fas fa-chevron-down"></i>
                            Show More History
                        </button>
                    </div>
                `);
            }
        }
    }

    groupSessionsByDate(sessions) {
        const grouped = {};
        sessions.forEach(session => {
            const date = new Date(session.date);
            const dateKey = date.toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(session);
        });
        return grouped;
    }

    createDateGroupHTML(dateKey, sessions) {
        const date = new Date(dateKey);
        const isToday = date.toDateString() === new Date().toDateString();
        const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();

        let dateLabel;
        if (isToday) {
            dateLabel = 'Today';
        } else if (isYesterday) {
            dateLabel = 'Yesterday';
        } else {
            dateLabel = date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        }

        const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
        const focusSessions = sessions.filter(s => s.type === 'focus').length;

        return `
            <div class="history-date-group">
                <div class="history-date-header">
                    <div class="history-date-label">${dateLabel}</div>
                    <div class="history-date-stats">
                        <span class="date-sessions">${focusSessions} sessions</span>
                        <span class="date-time">${this.formatTime(totalTime)}</span>
                    </div>
                </div>
                <div class="history-sessions">
                    ${sessions.map(session => this.createHistoryHTML(session)).join('')}
                </div>
            </div>
        `;
    }

    createHistoryHTML(session) {
        const date = new Date(session.date);
        const time = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return `
            <div class="history-item">
                <div class="history-icon ${session.type}">
                    <i class="fas fa-${session.type === 'focus' ? 'brain' : 'coffee'}"></i>
                </div>
                <div class="history-content">
                    <div class="history-duration">${session.duration} min</div>
                    <div class="history-time">${time}</div>
                </div>
                <div class="history-type">
                    ${session.type === 'focus' ? 'Focus' : 'Break'}
                </div>
            </div>
        `;
    }

    showMoreHistory() {
        const container = document.getElementById('historyContainer');
        if (!container) return;

        // Sort sessions by date (newest first)
        const sortedSessions = [...this.focusSessions].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        const historyList = document.getElementById('historyList');

        // Group sessions by date
        const groupedSessions = this.groupSessionsByDate(sortedSessions);

        // Clear current list and show all sessions
        historyList.innerHTML = '';

        Object.keys(groupedSessions).forEach(dateKey => {
            const sessions = groupedSessions[dateKey];
            const dateHTML = this.createDateGroupHTML(dateKey, sessions);
            historyList.insertAdjacentHTML('beforeend', dateHTML);
        });
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `${diffMins} minutes ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hours ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else {
            return `${diffDays} days ago`;
        }
    }

    // Focus Timer
    initializeFocusTimer() {
        // Get active goal's session duration or default to 25
        const activeGoal = this.focusGoals.find(goal => goal.active);
        const defaultDuration = activeGoal ? activeGoal.sessionDuration : 25;

        this.timer = {
            minutes: defaultDuration,
            seconds: 0,
            isRunning: false,
            interval: null,
            totalSeconds: defaultDuration * 60,
            mode: 'focus'
        };

        this.updateTimerDisplay();
        this.setupTimerControls();
        this.setupTimerPresets();
        this.updateTimerPresetFromGoal();
    }

    setupTimerControls() {
        const startPauseBtn = document.getElementById('startPauseBtn');
        const resetBtn = document.getElementById('resetBtn');

        if (startPauseBtn) {
            startPauseBtn.addEventListener('click', () => {
                if (this.timer.isRunning) {
                    this.pauseTimer();
                } else {
                    this.startTimer();
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetTimer();
            });
        }
    }

    setupTimerPresets() {
        const presets = document.querySelectorAll('.timer-preset');
        presets.forEach(preset => {
            preset.addEventListener('click', () => {
                if (!this.timer.isRunning) {
                    const minutes = parseInt(preset.dataset.minutes);
                    this.setTimer(minutes);

                    // Update active preset
                    presets.forEach(p => p.classList.remove('active'));
                    preset.classList.add('active');
                }
            });
        });
    }

    updateTimerPresetFromGoal() {
        const activeGoal = this.focusGoals.find(goal => goal.active);
        if (activeGoal) {
            const presets = document.querySelectorAll('.timer-preset');
            const goalDuration = activeGoal.sessionDuration;

            // Update the focus preset to match goal duration
            presets.forEach(preset => {
                preset.classList.remove('active');
                const presetMinutes = parseInt(preset.dataset.minutes);

                // If we have a 25min preset and goal is 25min, or if it's the closest match
                if (presetMinutes === goalDuration ||
                    (goalDuration === 25 && presetMinutes === 25)) {
                    preset.classList.add('active');
                }
            });

            // If no preset matches exactly, update the first preset to show goal duration
            const focusPreset = document.querySelector('.timer-preset[data-minutes="25"]');
            if (focusPreset && goalDuration !== 25) {
                focusPreset.dataset.minutes = goalDuration;
                focusPreset.querySelector('span').textContent = `${goalDuration}m`;
                focusPreset.classList.add('active');
            }
        }
    }

    updateTimerFromActiveGoal() {
        const activeGoal = this.focusGoals.find(goal => goal.active);
        if (activeGoal && this.timer && !this.timer.isRunning) {
            // Update timer to use goal's session duration
            this.setTimer(activeGoal.sessionDuration);
            this.updateTimerPresetFromGoal();
        }
    }

    setTimer(minutes) {
        this.timer.minutes = minutes;
        this.timer.seconds = 0;
        this.timer.totalSeconds = minutes * 60;
        this.updateTimerDisplay();
        this.updateTimerProgress();
    }

    startTimer() {
        this.timer.isRunning = true;
        this.updateStartPauseButton();

        this.timer.interval = setInterval(() => {
            if (this.timer.seconds > 0) {
                this.timer.seconds--;
            } else if (this.timer.minutes > 0) {
                this.timer.minutes--;
                this.timer.seconds = 59;
            } else {
                this.completeTimer();
                return;
            }

            this.updateTimerDisplay();
            this.updateTimerProgress();
            this.saveTimerState();
        }, 1000);
    }

    pauseTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.interval);
        this.updateStartPauseButton();
        this.saveTimerState();
    }

    resetTimer() {
        this.pauseTimer();

        // Use active goal's session duration or fall back to active preset
        const activeGoal = this.focusGoals.find(goal => goal.active);
        let minutes = 25; // default

        if (activeGoal) {
            minutes = activeGoal.sessionDuration;
        } else {
            const activePreset = document.querySelector('.timer-preset.active');
            minutes = activePreset ? parseInt(activePreset.dataset.minutes) : 25;
        }

        this.setTimer(minutes);
        this.saveTimerState();
    }

    completeTimer() {
        this.pauseTimer();

        // Get the actual timer duration that was completed
        const completedDuration = this.timer.totalSeconds / 60;
        const type = completedDuration >= 20 ? 'focus' : 'break';

        if (type === 'focus') {
            this.addFocusSession(Math.round(completedDuration), type);
        }

        // Show completion notification
        this.showTimerComplete(type);

        // Reset timer to goal duration or default
        const activeGoal = this.focusGoals.find(goal => goal.active);
        const resetDuration = activeGoal ? activeGoal.sessionDuration : 25;
        this.setTimer(resetDuration);
    }

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (display) {
            const mins = this.timer.minutes.toString().padStart(2, '0');
            const secs = this.timer.seconds.toString().padStart(2, '0');
            display.textContent = `${mins}:${secs}`;
        }
    }

    updateTimerProgress() {
        const progressCircle = document.getElementById('timerProgress');
        if (progressCircle) {
            const currentSeconds = this.timer.minutes * 60 + this.timer.seconds;
            const progress = (this.timer.totalSeconds - currentSeconds) / this.timer.totalSeconds;
            const circumference = 2 * Math.PI * 45; // radius = 45
            const offset = circumference * (1 - progress);
            progressCircle.style.strokeDashoffset = offset;
        }
    }

    updateStartPauseButton() {
        const btn = document.getElementById('startPauseBtn');
        if (btn) {
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');

            if (this.timer.isRunning) {
                icon.className = 'fas fa-pause';
                text.textContent = 'Pause';
            } else {
                icon.className = 'fas fa-play';
                text.textContent = 'Start';
            }
        }
    }

    saveTimerState() {
        this.appState.timerState = {
            minutes: this.timer.minutes,
            seconds: this.timer.seconds,
            isRunning: this.timer.isRunning,
            totalSeconds: this.timer.totalSeconds,
            mode: this.timer.mode
        };
        this.saveAppState();
    }

    restoreTimerState(timerState) {
        if (timerState && this.timer) {
            this.timer.minutes = timerState.minutes || 25;
            this.timer.seconds = timerState.seconds || 0;
            this.timer.totalSeconds = timerState.totalSeconds || 25 * 60;
            this.timer.mode = timerState.mode || 'focus';

            this.updateTimerDisplay();
            this.updateTimerProgress();

            // Don't auto-resume running timers for security
            if (timerState.isRunning) {
                this.timer.isRunning = false;
                this.updateStartPauseButton();
            }
        }
    }

    showTimerComplete(type) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'timer-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${type === 'focus' ? 'Focus session' : 'Break'} completed!</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // Play sound if available
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.play().catch(() => {}); // Ignore errors if audio fails
        } catch (e) {
            // Ignore audio errors
        }
    }
}

// Global task manager instance
let taskManager;

// Force close any stuck modals
function forceCloseModals() {
    const modals = document.querySelectorAll('.task-modal-overlay');
    modals.forEach(modal => modal.remove());
    console.log('All modals closed');
}

// Make it globally available
window.forceCloseModals = forceCloseModals;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Clear any stuck modals on page load
    forceCloseModals();
    taskManager = new TaskManager();

    // Add some interactive effects
    addInteractiveEffects();

    // Initialize new task functionality
    initializeNewTaskHandler();

    // Initialize daily tasks functionality
    initializeDailyTasks();

    // Initialize focus sessions functionality
    initializeFocusSessions();
});

// Interactive Effects
function addInteractiveEffects() {
    // Add hover effects to cards
    document.querySelectorAll('.stat-card, .chart-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click ripple effect
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(107, 143, 113, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);



// New Task functionality
function initializeNewTaskHandler() {
    const newTaskBtn = document.querySelector('.new-task-btn');

    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', function() {
            showNewTaskModal();
        });
    }
}

// Show new task modal
function showNewTaskModal() {
    // Create modal HTML
    const modalHTML = `
        <div class="task-modal-overlay" id="taskModal">
            <div class="task-modal">
                <div class="task-modal-header">
                    <h3>Add New Task</h3>
                    <button class="task-modal-close" onclick="closeNewTaskModal()">&times;</button>
                </div>
                <div class="task-modal-body">
                    <form id="newTaskForm">
                        <div class="form-group">
                            <label for="taskTitle">Task Title</label>
                            <input type="text" id="taskTitle" name="taskTitle" placeholder="Enter task title..." required>
                        </div>
                        <div class="form-group">
                            <label for="taskCategory">Category</label>
                            <select id="taskCategory" name="taskCategory">
                                <option value="Personal">Personal</option>
                                <option value="Work">Work</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeNewTaskModal()">Cancel</button>
                            <button type="submit" class="btn-create">Create Task</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listener to form
    const form = document.getElementById('newTaskForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        createNewTask();
    });

    // Focus on title input
    document.getElementById('taskTitle').focus();
}

// Close modal
function closeNewTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.remove();
    }
}

// Create new task
function createNewTask() {
    const titleInput = document.getElementById('taskTitle');
    const categorySelect = document.getElementById('taskCategory');

    const title = titleInput.value.trim();
    const category = categorySelect.value;

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    // Add task using task manager
    taskManager.addTask(title, category);

    // Close modal
    closeNewTaskModal();
}

// Show success message
function showSuccessMessage(message) {
    const successHTML = `
        <div class="success-message" id="successMessage">
            <i class="fas fa-check-circle"></i>
            ${message}
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);

    // Remove after 3 seconds
    setTimeout(() => {
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.remove();
        }
    }, 3000);
}

// Daily Tasks functionality
function initializeDailyTasks() {
    // Set current date
    updateCurrentDate();

    // Initialize add daily task button
    initializeAddDailyTaskHandler();
}

// Update current date display
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const today = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        dateElement.textContent = today.toLocaleDateString('en-US', options);
    }
}



// Initialize add daily task button
function initializeAddDailyTaskHandler() {
    const addDailyTaskBtn = document.querySelector('.add-daily-task-btn');

    if (addDailyTaskBtn) {
        addDailyTaskBtn.addEventListener('click', function() {
            showAddDailyTaskModal();
        });
    }
}

// Show add daily task modal
function showAddDailyTaskModal() {
    const modalHTML = `
        <div class="task-modal-overlay" id="dailyTaskModal">
            <div class="task-modal">
                <div class="task-modal-header">
                    <h3>Add Daily Task</h3>
                    <button class="task-modal-close" onclick="closeDailyTaskModal()">&times;</button>
                </div>
                <div class="task-modal-body">
                    <form id="newDailyTaskForm">
                        <div class="form-group">
                            <label for="dailyTaskTitle">Task Title</label>
                            <input type="text" id="dailyTaskTitle" name="dailyTaskTitle" placeholder="Enter task title..." required>
                        </div>
                        <div class="form-group">
                            <label for="dailyTaskTime">Time</label>
                            <input type="time" id="dailyTaskTime" name="dailyTaskTime" required>
                        </div>
                        <div class="form-group">
                            <label for="dailyTaskPriority">Priority</label>
                            <select id="dailyTaskPriority" name="dailyTaskPriority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeDailyTaskModal()">Cancel</button>
                            <button type="submit" class="btn-create">Add Task</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('newDailyTaskForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        createNewDailyTask();
    });

    document.getElementById('dailyTaskTitle').focus();
}

// Close daily task modal
function closeDailyTaskModal() {
    const modal = document.getElementById('dailyTaskModal');
    if (modal) {
        modal.remove();
    }
}

// Create new daily task
function createNewDailyTask() {
    const titleInput = document.getElementById('dailyTaskTitle');
    const timeInput = document.getElementById('dailyTaskTime');
    const prioritySelect = document.getElementById('dailyTaskPriority');

    const title = titleInput.value.trim();
    const time = timeInput.value;
    const priority = prioritySelect.value;

    if (!title || !time) {
        alert('Please fill in all required fields');
        return;
    }

    // Format time for display
    const timeFormatted = formatTime(time);

    // Add task using task manager
    taskManager.addDailyTask(title, timeFormatted, priority);

    // Close modal
    closeDailyTaskModal();
}

// Format time for display
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}



// Edit and Delete functionality for My Tasks
function editTask(button) {
    const taskItem = button.closest('.task-item');
    const titleElement = taskItem.querySelector('.task-title');
    const categoryElement = taskItem.querySelector('.task-category');

    const currentTitle = titleElement.textContent;
    const currentCategory = categoryElement.textContent;

    // Create edit modal
    const modalHTML = `
        <div class="task-modal-overlay" id="editTaskModal">
            <div class="task-modal">
                <div class="task-modal-header">
                    <h3>Edit Task</h3>
                    <button class="task-modal-close" onclick="closeEditTaskModal()">&times;</button>
                </div>
                <div class="task-modal-body">
                    <form id="editTaskForm">
                        <div class="form-group">
                            <label for="editTaskTitle">Task Title</label>
                            <input type="text" id="editTaskTitle" name="editTaskTitle" value="${currentTitle}" required>
                        </div>
                        <div class="form-group">
                            <label for="editTaskCategory">Category</label>
                            <select id="editTaskCategory" name="editTaskCategory">
                                <option value="Personal" ${currentCategory === 'Personal' ? 'selected' : ''}>Personal</option>
                                <option value="Work" ${currentCategory === 'Work' ? 'selected' : ''}>Work</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeEditTaskModal()">Cancel</button>
                            <button type="submit" class="btn-create">Update Task</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('editTaskForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        updateTask(taskItem);
    });

    document.getElementById('editTaskTitle').focus();
}

function closeEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) {
        modal.remove();
    }
}

function updateTask(taskItem) {
    const titleInput = document.getElementById('editTaskTitle');
    const categorySelect = document.getElementById('editTaskCategory');

    const newTitle = titleInput.value.trim();
    const newCategory = categorySelect.value;

    if (!newTitle) {
        alert('Please enter a task title');
        return;
    }

    // Update task content
    const titleElement = taskItem.querySelector('.task-title');
    const categoryElement = taskItem.querySelector('.task-category');

    titleElement.textContent = newTitle;
    categoryElement.textContent = newCategory;

    closeEditTaskModal();
}

function deleteTask(button) {
    const taskItem = button.closest('.task-item');
    const taskId = taskItem.dataset.taskId;

    taskItem.style.animation = 'fadeOut 0.3s ease-out';

    setTimeout(() => {
        taskManager.deleteTask(taskId, false);
    }, 300);
}

// Edit and Delete functionality for Daily Tasks
function editDailyTask(button) {
    const taskItem = button.closest('.daily-task-item');
    const titleElement = taskItem.querySelector('.task-title');
    const timeElement = taskItem.querySelector('.task-time');
    const priorityElement = taskItem.querySelector('.task-priority');

    const currentTitle = titleElement.textContent;
    const currentTime = convertTo24Hour(timeElement.textContent);
    const currentPriority = priorityElement.classList.contains('high') ? 'high' :
                           priorityElement.classList.contains('medium') ? 'medium' : 'low';

    // Create edit modal
    const modalHTML = `
        <div class="task-modal-overlay" id="editDailyTaskModal">
            <div class="task-modal">
                <div class="task-modal-header">
                    <h3>Edit Daily Task</h3>
                    <button class="task-modal-close" onclick="closeEditDailyTaskModal()">&times;</button>
                </div>
                <div class="task-modal-body">
                    <form id="editDailyTaskForm">
                        <div class="form-group">
                            <label for="editDailyTaskTitle">Task Title</label>
                            <input type="text" id="editDailyTaskTitle" name="editDailyTaskTitle" value="${currentTitle}" required>
                        </div>
                        <div class="form-group">
                            <label for="editDailyTaskTime">Time</label>
                            <input type="time" id="editDailyTaskTime" name="editDailyTaskTime" value="${currentTime}" required>
                        </div>
                        <div class="form-group">
                            <label for="editDailyTaskPriority">Priority</label>
                            <select id="editDailyTaskPriority" name="editDailyTaskPriority">
                                <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${currentPriority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>High</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeEditDailyTaskModal()">Cancel</button>
                            <button type="submit" class="btn-create">Update Task</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('editDailyTaskForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        updateDailyTask(taskItem);
    });

    document.getElementById('editDailyTaskTitle').focus();
}

function closeEditDailyTaskModal() {
    const modal = document.getElementById('editDailyTaskModal');
    if (modal) {
        modal.remove();
    }
}

function updateDailyTask(taskItem) {
    const titleInput = document.getElementById('editDailyTaskTitle');
    const timeInput = document.getElementById('editDailyTaskTime');
    const prioritySelect = document.getElementById('editDailyTaskPriority');

    const newTitle = titleInput.value.trim();
    const newTime = timeInput.value;
    const newPriority = prioritySelect.value;

    if (!newTitle || !newTime) {
        alert('Please fill in all required fields');
        return;
    }

    // Update task content
    const titleElement = taskItem.querySelector('.task-title');
    const timeElement = taskItem.querySelector('.task-time');
    const priorityElement = taskItem.querySelector('.task-priority');

    titleElement.textContent = newTitle;
    timeElement.textContent = formatTime(newTime);

    // Update priority
    priorityElement.className = `task-priority ${newPriority}`;
    priorityElement.innerHTML = `
        <span class="priority-dot"></span>
        ${newPriority.charAt(0).toUpperCase() + newPriority.slice(1)}
    `;

    closeEditDailyTaskModal();
}

function deleteDailyTask(button) {
    const taskItem = button.closest('.daily-task-item');
    const taskId = taskItem.dataset.taskId;

    taskItem.style.animation = 'fadeOut 0.3s ease-out';

    setTimeout(() => {
        taskManager.deleteTask(taskId, true);
    }, 300);
}

// Helper function to convert 12-hour time to 24-hour
function convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Focus Sessions functionality
function initializeFocusSessions() {
    // Initialize focus page buttons
    const setGoalBtn = document.querySelector('.set-goal-btn');
    const startFocusBtn = document.querySelector('.start-focus-btn');

    if (setGoalBtn) {
        setGoalBtn.addEventListener('click', () => {
            showGoalModal();
        });
    }

    if (startFocusBtn) {
        startFocusBtn.addEventListener('click', () => {
            // Switch to focus page and start timer
            const focusPage = document.getElementById('focus-page');
            const navLinks = document.querySelectorAll('.nav-link');
            const pages = document.querySelectorAll('.page');

            // Update navigation
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === 'focus') {
                    link.classList.add('active');
                }
            });

            // Show focus page
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === 'focus-page') {
                    page.classList.add('active');
                }
            });

            // Start timer after a short delay
            setTimeout(() => {
                if (taskManager.timer && !taskManager.timer.isRunning) {
                    taskManager.startTimer();
                }
            }, 500);
        });
    }
}

// Goal Modal
function showGoalModal() {
    const modalHTML = `
        <div class="task-modal-overlay" id="goalModal">
            <div class="task-modal">
                <div class="task-modal-header">
                    <h3>Set Focus Goal</h3>
                    <button class="task-modal-close" onclick="closeGoalModal()">&times;</button>
                </div>
                <div class="task-modal-body">
                    <form id="goalForm">
                        <div class="form-group">
                            <label for="goalTitle">Goal Title</label>
                            <input type="text" id="goalTitle" name="goalTitle" placeholder="e.g., Learn Python Course" required>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="totalSessions">Total Sessions</label>
                                <input type="number" id="totalSessions" name="totalSessions" min="1" value="38" placeholder="e.g., 38" required>
                                <small class="form-help">How many sessions do you need in total?</small>
                            </div>
                            <div class="form-group">
                                <label for="sessionDuration">Minutes per Session</label>
                                <input type="number" id="sessionDuration" name="sessionDuration" min="5" max="120" value="25" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="goalDuration">Complete in (days)</label>
                                <input type="number" id="goalDuration" name="goalDuration" min="1" max="365" value="3" required>
                                <small class="form-help">How many days to finish?</small>
                            </div>
                            <div class="form-group">
                                <label for="dailyTarget">Daily Target (auto-calculated)</label>
                                <input type="number" id="dailyTarget" name="dailyTarget" readonly value="317">
                                <small class="form-help">Minutes per day needed</small>
                            </div>
                        </div>

                        <div class="goal-summary">
                            <h4>Goal Summary</h4>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <span class="summary-label">Sessions per day:</span>
                                    <span class="summary-value" id="sessionsPerDay">13</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Minutes per day:</span>
                                    <span class="summary-value" id="minutesPerDay">325</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Total time:</span>
                                    <span class="summary-value" id="totalTime">950 min</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Total hours:</span>
                                    <span class="summary-value" id="totalHours">15.8 hrs</span>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeGoalModal()">Cancel</button>
                            <button type="submit" class="btn-create">Create Goal</button>
                        </div>

                        <!-- Emergency close button -->
                        <div class="emergency-close">
                            <button type="button" onclick="forceCloseModals()" class="btn-emergency">Force Close</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('goalForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        createGoal();
    });

    // Get form inputs
    const totalSessionsInput = document.getElementById('totalSessions');
    const sessionDurationInput = document.getElementById('sessionDuration');
    const goalDurationInput = document.getElementById('goalDuration');
    const dailyTargetInput = document.getElementById('dailyTarget');

    // Update calculations in real-time
    function updateGoalCalculations() {
        const totalSessions = parseInt(totalSessionsInput.value) || 0;
        const sessionDuration = parseInt(sessionDurationInput.value) || 0;
        const goalDays = parseInt(goalDurationInput.value) || 1;

        const sessionsPerDay = Math.ceil(totalSessions / goalDays);
        const minutesPerDay = sessionsPerDay * sessionDuration;
        const totalMinutes = totalSessions * sessionDuration;
        const totalHours = (totalMinutes / 60).toFixed(1);

        // Update daily target
        dailyTargetInput.value = minutesPerDay;

        // Update summary
        document.getElementById('sessionsPerDay').textContent = sessionsPerDay;
        document.getElementById('minutesPerDay').textContent = minutesPerDay;
        document.getElementById('totalTime').textContent = totalMinutes + ' min';
        document.getElementById('totalHours').textContent = totalHours + ' hrs';
    }

    // Add event listeners for real-time updates
    totalSessionsInput.addEventListener('input', updateGoalCalculations);
    sessionDurationInput.addEventListener('input', updateGoalCalculations);
    goalDurationInput.addEventListener('input', updateGoalCalculations);

    // Initial calculation
    updateGoalCalculations();

    document.getElementById('goalTitle').focus();
}

function closeGoalModal() {
    const modal = document.getElementById('goalModal');
    if (modal) {
        modal.remove();
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('goalModal');
    if (modal && e.target === modal) {
        closeGoalModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('goalModal');
        if (modal) {
            closeGoalModal();
        }
    }
});

function createGoal() {
    const titleInput = document.getElementById('goalTitle');
    const totalSessionsInput = document.getElementById('totalSessions');
    const sessionDurationInput = document.getElementById('sessionDuration');
    const goalDurationInput = document.getElementById('goalDuration');
    const dailyTargetInput = document.getElementById('dailyTarget');

    const title = titleInput.value.trim();
    const totalSessions = parseInt(totalSessionsInput.value);
    const sessionDuration = parseInt(sessionDurationInput.value);
    const duration = parseInt(goalDurationInput.value);
    const dailyTarget = parseInt(dailyTargetInput.value);

    if (!title || !totalSessions || !sessionDuration || !duration) {
        alert('Please fill in all fields');
        return;
    }

    // Calculate sessions per day
    const sessionCount = Math.ceil(totalSessions / duration);

    taskManager.addGoal(title, dailyTarget, duration, sessionCount, sessionDuration);
    closeGoalModal();
}

function editGoal(goalId) {
    const goal = taskManager.focusGoals.find(g => g.id === goalId);
    if (!goal) return;

    const modalHTML = `
        <div class="task-modal-overlay" id="editGoalModal">
            <div class="task-modal">
                <div class="task-modal-header">
                    <h3>Edit Goal</h3>
                    <button class="task-modal-close" onclick="closeEditGoalModal()">&times;</button>
                </div>
                <div class="task-modal-body">
                    <form id="editGoalForm">
                        <div class="form-group">
                            <label for="editGoalTitle">Goal Title</label>
                            <input type="text" id="editGoalTitle" name="editGoalTitle" value="${goal.title}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editSessionCount">Sessions per Day</label>
                                <input type="number" id="editSessionCount" name="editSessionCount" min="1" value="${goal.sessionCount || 4}" required>
                            </div>
                            <div class="form-group">
                                <label for="editSessionDuration">Minutes per Session</label>
                                <input type="number" id="editSessionDuration" name="editSessionDuration" min="5" max="120" value="${goal.sessionDuration || 25}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="editDailyTarget">Daily Target (auto-calculated)</label>
                            <input type="number" id="editDailyTarget" name="editDailyTarget" readonly value="${goal.dailyTarget}">
                            <small class="form-help">This is calculated as: Sessions × Duration</small>
                        </div>
                        <div class="form-group">
                            <label for="editGoalDuration">Goal Duration (days)</label>
                            <input type="number" id="editGoalDuration" name="editGoalDuration" min="1" max="365" value="${goal.duration}" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="closeEditGoalModal()">Cancel</button>
                            <button type="submit" class="btn-create">Update Goal</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('editGoalForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        updateGoal(goalId);
    });

    // Auto-calculate daily target when sessions or duration changes
    const editSessionCountInput = document.getElementById('editSessionCount');
    const editSessionDurationInput = document.getElementById('editSessionDuration');
    const editDailyTargetInput = document.getElementById('editDailyTarget');

    function updateEditDailyTarget() {
        const sessions = parseInt(editSessionCountInput.value) || 0;
        const duration = parseInt(editSessionDurationInput.value) || 0;
        editDailyTargetInput.value = sessions * duration;
    }

    editSessionCountInput.addEventListener('input', updateEditDailyTarget);
    editSessionDurationInput.addEventListener('input', updateEditDailyTarget);

    document.getElementById('editGoalTitle').focus();
}

function closeEditGoalModal() {
    const modal = document.getElementById('editGoalModal');
    if (modal) {
        modal.remove();
    }
}

function updateGoal(goalId) {
    const titleInput = document.getElementById('editGoalTitle');
    const sessionCountInput = document.getElementById('editSessionCount');
    const sessionDurationInput = document.getElementById('editSessionDuration');
    const targetInput = document.getElementById('editDailyTarget');
    const durationInput = document.getElementById('editGoalDuration');

    const title = titleInput.value.trim();
    const sessionCount = parseInt(sessionCountInput.value);
    const sessionDuration = parseInt(sessionDurationInput.value);
    const dailyTarget = parseInt(targetInput.value);
    const duration = parseInt(durationInput.value);

    if (!title || !sessionCount || !sessionDuration || !dailyTarget || !duration) {
        alert('Please fill in all fields');
        return;
    }

    const goal = taskManager.focusGoals.find(g => g.id === goalId);
    if (goal) {
        goal.title = title;
        goal.sessionCount = sessionCount;
        goal.sessionDuration = sessionDuration;
        goal.dailyTarget = dailyTarget;
        goal.duration = duration;

        taskManager.saveFocusGoals();
        taskManager.loadGoalsToUI();
    }

    closeEditGoalModal();
}

function deleteGoal(goalId) {
    taskManager.focusGoals = taskManager.focusGoals.filter(g => g.id !== goalId);
    taskManager.saveFocusGoals();
    taskManager.loadGoalsToUI();
}
