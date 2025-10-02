document.addEventListener('DOMContentLoaded', () => {
    // --- 核心功能DOM元素 ---
    const form = document.getElementById('debrief-form');
    const eventInput = document.getElementById('event-input');
    const winInput = document.getElementById('win-input');
    const nextInput = document.getElementById('next-input');
    const logList = document.getElementById('log-list');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // --- 模板功能DOM元素 ---
    const manageTemplatesBtn = document.getElementById('manage-templates-btn');
    const useTemplateBtn = document.getElementById('use-template-btn');
    const templateModal = document.getElementById('template-modal');
    const closeModalBtn = document.querySelector('.modal-close-btn');
    const addTemplateForm = document.getElementById('add-template-form');
    const newTemplateNameInput = document.getElementById('new-template-name');
    const newTemplateContentInput = document.getElementById('new-template-content');
    const templateList = document.getElementById('template-list');

    // --- 数据键 ---
    const LOGS_KEY = 'debriefLogs';
    const TEMPLATES_KEY = 'debriefTemplates';

    // ====================================================================
    // 模板管理功能 (Template Management)
    // ====================================================================

    // 从localStorage获取模板
    const getTemplates = () => JSON.parse(localStorage.getItem(TEMPLATES_KEY)) || [];

    // 保存模板到localStorage
    const saveTemplates = (templates) => localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));

    // 渲染模板列表
    const renderTemplates = () => {
        const templates = getTemplates();
        templateList.innerHTML = '';
        if (templates.length === 0) {
            templateList.innerHTML = '<li>保存されているテンプレートがありません。</li>';
            return;
        }
        templates.forEach((template, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${template.name}</span>
                <button class="delete-template-btn" data-index="${index}">&times;</button>
            `;
            templateList.appendChild(li);
        });
    };

    // 打开/关闭模态框
    manageTemplatesBtn.addEventListener('click', () => {
        templateModal.style.display = 'flex';
        renderTemplates();
    });

    closeModalBtn.addEventListener('click', () => templateModal.style.display = 'none');
    templateModal.addEventListener('click', (e) => {
        if (e.target === templateModal) {
            templateModal.style.display = 'none';
        }
    });

    // 保存新模板
    addTemplateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = newTemplateNameInput.value.trim();
        const content = newTemplateContentInput.value.trim();
        if (!name || !content) return;

        const templates = getTemplates();
        templates.push({ name, content });
        saveTemplates(templates);

        newTemplateNameInput.value = '';
        newTemplateContentInput.value = '';
        renderTemplates();
    });

    // 删除模板 (通过事件委托)
    templateList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-template-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            if (window.confirm('このテンプレートを削除しますか？')) {
                const templates = getTemplates();
                templates.splice(index, 1);
                saveTemplates(templates);
                renderTemplates();
            }
        }
    });
    
    // 使用模板
    useTemplateBtn.addEventListener('click', (e) => {
        // 移除任何已存在的下拉菜单
        const existingDropdown = document.querySelector('.template-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
            return; // 如果已存在，则点击行为仅为关闭
        }

        const templates = getTemplates();
        if (templates.length === 0) {
            alert('利用可能なテンプレートがありません。');
            return;
        }

        const rect = useTemplateBtn.getBoundingClientRect();
        const dropdown = document.createElement('div');
        dropdown.className = 'template-dropdown';
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.left = `${rect.left}px`;

        templates.forEach(template => {
            const item = document.createElement('a');
            item.textContent = template.name;
            item.onclick = () => {
                eventInput.value = template.content;
                dropdown.remove();
            };
            dropdown.appendChild(item);
        });

        document.body.appendChild(dropdown);

        // 点击其他地方关闭下拉菜单
        setTimeout(() => { // 延迟以避免立即触发
            document.addEventListener('click', function closeDropdown(event) {
                if (!dropdown.contains(event.target) && event.target !== useTemplateBtn) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }, 0);
    });

    // ====================================================================
    // 核心日志功能 (Core Logging)
    // ====================================================================

    const renderLogs = () => {
        logList.innerHTML = '';
        const logs = JSON.parse(localStorage.getItem(LOGS_KEY)) || [];

        if (logs.length === 0) {
            logList.innerHTML = '<li class="empty-log-message">まだ記録がありません。</li>';
            if(clearAllBtn) clearAllBtn.style.display = 'none';
        } else {
            if(clearAllBtn) clearAllBtn.style.display = 'inline-block';
            logs.forEach(log => {
                const li = document.createElement('li');
                li.classList.add('log-entry');
                const date = new Date(log.timestamp);
                const formattedDate = date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

                li.innerHTML = `
                    <div class="log-header">
                        <span class="log-event-title">${log.event}</span>
                        <time datetime="${log.timestamp}">${formattedDate}</time>
                    </div>
                    <div class="log-details">
                        <p><strong>出来事 (Event):</strong><br>${log.event.replace(/\n/g, '<br>')}</p>
                        <p><strong>学び (Win):</strong><br>${log.win.replace(/\n/g, '<br>')}</p>
                        <p><strong>次にやること (Next):</strong><br>${log.next.replace(/\n/g, '<br>')}</p>
                    </div>
                `;

                li.querySelector('.log-header').addEventListener('click', () => li.classList.toggle('expanded'));
                logList.appendChild(li);
            });
        }
    };

    if(clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (window.confirm('すべてのログを削除しますか？この操作は取り消せません。')) {
                localStorage.removeItem(LOGS_KEY);
                renderLogs();
            }
        });
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!eventInput.value.trim() || !winInput.value.trim() || !nextInput.value.trim()) {
            alert('すべての項目を入力してください。');
            return;
        }

        const logs = JSON.parse(localStorage.getItem(LOGS_KEY)) || [];
        const newLog = {
            event: eventInput.value.trim(),
            win: winInput.value.trim(),
            next: nextInput.value.trim(),
            timestamp: new Date().toISOString()
        };
        logs.unshift(newLog);
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));

        eventInput.value = '';
        winInput.value = '';
        nextInput.value = '';
        renderLogs();
    });

    renderLogs();
});

