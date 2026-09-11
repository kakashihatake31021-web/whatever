/**
 * TriGuide AI - Main Application Coordinator
 * Handles UI interactions, domain routing, chat feed, voice input & settings
 */

import { DOMAINS, SUPPORTED_LANGUAGES } from './domains.js';
import { geminiService } from './gemini.js';
import { initDiffEngine } from './editor.js';

class TriGuideApp {
  constructor() {
    // Current State
    this.currentDomain = 'learn';
    this.currentLevel = 'beginner';
    this.currentLanguage = 'Python';
    this.currentView = 'chat'; // 'chat' or 'diff-lab'
    this.isGenerating = false;

    // DOM References
    this.chatContainer = document.getElementById('chat-scroll-container');
    this.messagesList = document.getElementById('messages-list');
    this.chatTextarea = document.getElementById('chat-textarea');
    this.btnSend = document.getElementById('btn-send');
    this.quickPromptsList = document.getElementById('quick-prompts-list');
    this.domainBannerTitle = document.getElementById('domain-banner-title');
    this.domainBannerSubtitle = document.getElementById('domain-banner-subtitle');
    this.domainBannerIcon = document.getElementById('domain-banner-icon');
    this.activeModeSmall = document.getElementById('active-mode-small');
    this.langSelect = document.getElementById('global-lang-select');
    this.modeStatusBadge = document.getElementById('mode-status-badge');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnExport = document.getElementById('btn-export');
    this.btnVoice = document.getElementById('btn-voice');
    this.btnClearChat = document.getElementById('btn-clear-chat');

    // Modals & Settings
    this.settingsModal = document.getElementById('settings-modal');
    this.btnModalClose = document.getElementById('modal-close');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.inputApiKey = document.getElementById('setting-api-key');
    this.selectModel = document.getElementById('setting-model');
    this.rangeTemp = document.getElementById('setting-temp');
    this.valTemp = document.getElementById('val-temp');
    this.chkDemoMode = document.getElementById('setting-demo-mode');

    // Workspaces
    this.chatWorkspace = document.getElementById('chat-workspace');
    this.diffWorkspace = document.getElementById('diff-workspace');
    this.viewChatBtn = document.getElementById('view-chat-btn');
    this.viewDiffBtn = document.getElementById('view-diff-btn');

    this.init();
  }

  async init() {
    // Attempt to load gitignored local config (config.local.js)
    await geminiService.loadLocalConfig();

    // Initialize Diff Engine
    initDiffEngine();

    // Populate Languages in Sidebar
    this.populateLanguageOptions();

    // Setup Event Listeners
    this.bindEvents();

    // Initialize Domain UI
    this.switchDomain('learn');

    // Update Status Badge
    this.updateStatusBadge();

    // Load Settings into modal
    this.loadSettings();

    // Auto-focus input
    if (this.chatTextarea) {
      this.chatTextarea.focus();
    }
  }

  populateLanguageOptions() {
    if (!this.langSelect) return;
    this.langSelect.innerHTML = SUPPORTED_LANGUAGES.map(lang => 
      `<option value="${lang.name}">${lang.icon} ${lang.name}</option>`
    ).join('');
    this.langSelect.value = 'Python';
  }

  bindEvents() {
    // Domain Pills in Header & Sidebar
    document.querySelectorAll('[data-domain]').forEach(el => {
      el.addEventListener('click', (e) => {
        const domain = e.currentTarget.getAttribute('data-domain');
        this.switchDomain(domain);
      });
    });

    // Experience Level Buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentLevel = e.currentTarget.getAttribute('data-level');
        this.showToast(`Switched level to: ${this.currentLevel.toUpperCase()}`);
      });
    });

    // Language Select
    if (this.langSelect) {
      this.langSelect.addEventListener('change', (e) => {
        this.currentLanguage = e.target.value;
        this.showToast(`Language set to ${this.currentLanguage}`);
      });
    }

    // View Mode Toggle (Chat vs Code Doctor)
    if (this.viewChatBtn && this.viewDiffBtn) {
      this.viewChatBtn.addEventListener('click', () => this.switchView('chat'));
      this.viewDiffBtn.addEventListener('click', () => this.switchView('diff-lab'));
    }

    // Chat Input events
    if (this.chatTextarea) {
      this.chatTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      // Auto expand textarea
      this.chatTextarea.addEventListener('input', () => {
        this.chatTextarea.style.height = 'auto';
        this.chatTextarea.style.height = Math.min(this.chatTextarea.scrollHeight, 160) + 'px';
      });
    }

    if (this.btnSend) {
      this.btnSend.addEventListener('click', () => this.sendMessage());
    }

    // Welcome Screen Feature Cards
    document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const domain = e.currentTarget.getAttribute('data-domain-target');
        const defaultPrompt = e.currentTarget.getAttribute('data-prompt');
        this.switchDomain(domain);
        if (defaultPrompt) {
          this.chatTextarea.value = defaultPrompt;
          this.sendMessage();
        }
      });
    });

    // Settings Modal
    if (this.btnSettings) {
      this.btnSettings.addEventListener('click', () => this.openSettings());
    }
    if (this.btnModalClose) {
      this.btnModalClose.addEventListener('click', () => this.closeSettings());
    }
    if (this.btnSaveSettings) {
      this.btnSaveSettings.addEventListener('click', () => this.saveSettings());
    }
    if (this.rangeTemp && this.valTemp) {
      this.rangeTemp.addEventListener('input', (e) => {
        this.valTemp.textContent = e.target.value;
      });
    }

    // Clear Chat
    if (this.btnClearChat) {
      this.btnClearChat.addEventListener('click', () => {
        if (confirm('Clear entire conversation history?')) {
          this.messagesList.innerHTML = '';
          geminiService.clearHistory();
          this.showToast('Chat history cleared.');
        }
      });
    }

    // Export Chat
    if (this.btnExport) {
      this.btnExport.addEventListener('click', () => this.exportConversation());
    }

    // Voice Input via Web Speech API
    if (this.btnVoice) {
      this.btnVoice.addEventListener('click', () => this.handleVoiceInput());
    }
  }

  switchDomain(domainKey) {
    if (!DOMAINS[domainKey]) return;
    this.currentDomain = domainKey;
    const config = DOMAINS[domainKey];

    // Set body attribute for dynamic CSS colors
    document.body.setAttribute('data-active-domain', domainKey);

    // Update active pills
    document.querySelectorAll('.domain-pill').forEach(pill => {
      if (pill.getAttribute('data-domain') === domainKey) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Update sidebar domain cards
    document.querySelectorAll('.domain-card').forEach(card => {
      if (card.getAttribute('data-domain') === domainKey) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update Workspace Banner
    if (this.domainBannerTitle) this.domainBannerTitle.textContent = config.title;
    if (this.domainBannerSubtitle) this.domainBannerSubtitle.textContent = config.tagline;
    if (this.domainBannerIcon) this.domainBannerIcon.textContent = config.icon;
    if (this.activeModeSmall) {
      this.activeModeSmall.innerHTML = `<span>${config.icon}</span> <span>${config.shortTitle} Mode</span>`;
    }

    // Update Quick Prompts List
    this.renderQuickPrompts(config.quickPrompts);

    // Switch view automatically if domain is debug
    if (domainKey === 'debug' && this.currentView !== 'diff-lab') {
      // Optional: don't force, but make Diff Lab readily accessible
    }
  }

  renderQuickPrompts(prompts) {
    if (!this.quickPromptsList || !prompts) return;
    this.quickPromptsList.innerHTML = prompts.map(p => `
      <div class="prompt-chip" data-query="${p.query}">
        <span>${p.text}</span>
        <span class="prompt-chip-icon">➔</span>
      </div>
    `).join('');

    // Attach click handlers
    this.quickPromptsList.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const query = e.currentTarget.getAttribute('data-query');
        this.chatTextarea.value = query;
        this.sendMessage();
      });
    });
  }

  switchView(viewMode) {
    this.currentView = viewMode;
    if (viewMode === 'diff-lab') {
      this.chatWorkspace.style.display = 'none';
      this.diffWorkspace.style.display = 'flex';
      this.viewChatBtn.classList.remove('active');
      this.viewDiffBtn.classList.add('active');
    } else {
      this.chatWorkspace.style.display = 'flex';
      this.diffWorkspace.style.display = 'none';
      this.viewChatBtn.classList.add('active');
      this.viewDiffBtn.classList.remove('active');
    }
  }

  async sendMessage() {
    const text = this.chatTextarea.value.trim();
    if (!text || this.isGenerating) return;

    // Remove welcome hero if present
    const hero = document.getElementById('welcome-hero');
    if (hero) hero.remove();

    // Ensure we are in chat view
    if (this.currentView !== 'chat') {
      this.switchView('chat');
    }

    // Clear textarea & reset height
    this.chatTextarea.value = '';
    this.chatTextarea.style.height = 'auto';

    // Append User Message
    this.appendMessage({
      role: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Scroll to bottom
    this.scrollToBottom();

    // Prepare Assistant Placeholder
    this.isGenerating = true;
    this.btnSend.disabled = true;

    const botMessageElem = this.appendLoadingMessage();
    this.scrollToBottom();

    try {
      const config = DOMAINS[this.currentDomain];
      const systemPrompt = config.systemPrompt(this.currentLevel, this.currentLanguage);

      const response = await geminiService.generateResponse({
        prompt: text,
        domain: this.currentDomain,
        level: this.currentLevel,
        language: this.currentLanguage,
        systemPrompt: systemPrompt
      });

      // Render response content with markdown
      this.updateBotMessage(botMessageElem, response.text, response.model);

    } catch (err) {
      console.error(err);
      this.updateBotMessage(botMessageElem, `❌ **Error**: ${err.message}\n\nPlease check your settings or switch to Smart Demo Mode.`);
    } finally {
      this.isGenerating = false;
      this.btnSend.disabled = false;
      this.scrollToBottom();
      this.chatTextarea.focus();
    }
  }

  appendMessage({ role, text, time }) {
    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const avatar = role === 'user' ? '👤' : (DOMAINS[this.currentDomain]?.icon || '✨');
    const senderName = role === 'user' ? 'You' : `TriGuide AI (${DOMAINS[this.currentDomain]?.shortTitle})`;

    row.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="sender-name">${senderName}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-bubble">${this.renderMarkdown(text)}</div>
      </div>
    `;

    this.messagesList.appendChild(row);
    this.attachCopyListeners(row);
    return row;
  }

  appendLoadingMessage() {
    const row = document.createElement('div');
    row.className = 'message-row assistant';
    const avatar = DOMAINS[this.currentDomain]?.icon || '✨';
    const senderName = `TriGuide AI (${DOMAINS[this.currentDomain]?.shortTitle})`;

    row.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="sender-name">${senderName}</span>
          <span class="message-time">Generating...</span>
        </div>
        <div class="message-bubble">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    `;

    this.messagesList.appendChild(row);
    return row;
  }

  updateBotMessage(rowElem, markdownText, modelName) {
    const bubble = rowElem.querySelector('.message-bubble');
    const timeMeta = rowElem.querySelector('.message-time');
    if (bubble) {
      bubble.innerHTML = this.renderMarkdown(markdownText);
      this.attachCopyListeners(rowElem);
    }
    if (timeMeta) {
      timeMeta.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (modelName ? ` • ${modelName}` : '');
    }
  }

  renderMarkdown(text) {
    if (!text) return '';

    const codeBlocks = [];
    // 1. Isolate triple-backtick code blocks with safe placeholders
    let html = text.replace(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = (lang || 'code').toLowerCase();
      const escapedCode = this.escapeHtml(code.trim());
      const blockHtml = `
        <div class="code-block-container">
          <div class="code-block-header">
            <span class="lang-tag">${language}</span>
            <button class="copy-btn" data-code="${this.escapeAttr(code.trim())}">
              📋 Copy
            </button>
          </div>
          <pre><code class="language-${language}">${escapedCode}</code></pre>
        </div>
      `;
      codeBlocks.push(blockHtml);
      return `%%%TRIGUIDE_CODE_BLOCK_${codeBlocks.length - 1}%%%`;
    });

    // 2. Isolate inline code `...`
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      inlineCodes.push(`<code>${this.escapeHtml(code)}</code>`);
      return `%%%TRIGUIDE_INLINE_CODE_${inlineCodes.length - 1}%%%`;
    });

    // 3. Inline & Block Markdown formatting
    html = html
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--active-domain-color, #6366f1); padding-left: 10px; margin: 8px 0; color: #cbd5e1;">$1</blockquote>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    // 4. Restore inline code snippets
    inlineCodes.forEach((inlineHtml, idx) => {
      html = html.replace(`%%%TRIGUIDE_INLINE_CODE_${idx}%%%`, inlineHtml);
    });

    // 5. Restore full code blocks cleanly without any <br> or <em> tags
    codeBlocks.forEach((blockHtml, idx) => {
      html = html.replace(`%%%TRIGUIDE_CODE_BLOCK_${idx}%%%`, blockHtml);
    });

    return html;
  }

  attachCopyListeners(scope) {
    scope.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = e.currentTarget.getAttribute('data-code');
        if (code) {
          navigator.clipboard.writeText(code).then(() => {
            const original = e.currentTarget.innerHTML;
            e.currentTarget.innerHTML = '✓ Copied!';
            setTimeout(() => {
              e.currentTarget.innerHTML = original;
            }, 2000);
          });
        }
      });
    });
  }

  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  }

  // Voice Input using Web Speech API
  handleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    this.btnVoice.style.color = '#ef4444';
    this.showToast('🎙️ Listening... Speak your coding question!');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.chatTextarea.value = transcript;
      this.chatTextarea.focus();
      this.showToast(`Heard: "${transcript}"`);
    };

    recognition.onerror = (event) => {
      console.warn('Speech error:', event.error);
      this.showToast(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      this.btnVoice.style.color = '';
    };

    recognition.start();
  }

  // Settings Modal Handlers
  openSettings() {
    this.inputApiKey.value = geminiService.apiKey;
    this.selectModel.value = geminiService.model;
    this.rangeTemp.value = geminiService.temperature;
    this.valTemp.textContent = geminiService.temperature;
    this.chkDemoMode.checked = geminiService.isDemoMode;
    this.settingsModal.classList.add('open');
  }

  closeSettings() {
    this.settingsModal.classList.remove('open');
  }

  saveSettings() {
    const key = this.inputApiKey.value.trim();
    const model = this.selectModel.value;
    const temp = parseFloat(this.rangeTemp.value);
    const demo = this.chkDemoMode.checked;

    geminiService.setApiKey(key);
    geminiService.setModel(model);
    geminiService.setTemperature(temp);
    geminiService.setDemoMode(demo);

    this.updateStatusBadge();
    this.closeSettings();
    this.showToast('Settings saved successfully!');
  }

  loadSettings() {
    this.updateStatusBadge();
  }

  updateStatusBadge() {
    if (!this.modeStatusBadge) return;
    if (geminiService.apiKey && !geminiService.isDemoMode) {
      this.modeStatusBadge.className = 'badge-mode live';
      this.modeStatusBadge.innerHTML = `<span class="status-indicator"></span> <span>Live: ${geminiService.model}</span>`;
    } else {
      this.modeStatusBadge.className = 'badge-mode';
      this.modeStatusBadge.innerHTML = `<span class="status-indicator"></span> <span>Demo Simulator Mode</span>`;
    }
  }

  exportConversation() {
    const rows = this.messagesList.querySelectorAll('.message-row');
    if (rows.length === 0) {
      alert('No messages to export yet.');
      return;
    }

    let markdown = `# TriGuide AI - Chat Export\n`;
    markdown += `**Date**: ${new Date().toLocaleString()}\n`;
    markdown += `**Domain**: ${DOMAINS[this.currentDomain]?.title}\n`;
    markdown += `**Language**: ${this.currentLanguage}\n\n---\n\n`;

    rows.forEach(row => {
      const isUser = row.classList.contains('user');
      const sender = isUser ? 'User' : 'TriGuide AI';
      const text = row.querySelector('.message-bubble')?.innerText || '';
      markdown += `### 👤 ${sender}:\n${text}\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triguide-ai-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Conversation exported as Markdown file!');
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  escapeAttr(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;');
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.triGuideApp = new TriGuideApp();
});
