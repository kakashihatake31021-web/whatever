/**
 * TriGuide AI - Code Inspector & Diff Engine
 * Renders side-by-side buggy code vs clean fixed code,
 * computes visual diffs, and manages the Code Doctor workspace.
 */

import { MOCK_DATA } from './mockData.js';
import { geminiService } from './gemini.js';
import { DOMAINS } from './domains.js';

class DiffEngine {
  constructor() {
    this.buggyInput = document.getElementById('diff-buggy-code');
    this.diffOutput = document.getElementById('diff-view-output');
    this.diagnosisCard = document.getElementById('diff-diagnosis-card');
    this.diagnosisText = document.getElementById('diff-diagnosis-text');
    this.langSelect = document.getElementById('diff-lang-select');
    this.sampleSelect = document.getElementById('diff-sample-select');
    this.btnRunDiff = document.getElementById('btn-run-diff');
    this.btnCopyFixed = document.getElementById('btn-copy-fixed');

    this.currentFixedCode = '';
    this.init();
  }

  init() {
    if (this.sampleSelect) {
      this.sampleSelect.addEventListener('change', (e) => this.loadSample(e.target.value));
    }
    if (this.btnRunDiff) {
      this.btnRunDiff.addEventListener('click', () => this.analyzeAndFix());
    }
    if (this.btnCopyFixed) {
      this.btnCopyFixed.addEventListener('click', () => this.copyFixedCode());
    }

    // Load initial sample
    this.loadSample('typeerror');
  }

  loadSample(sampleKey) {
    const sample = MOCK_DATA.debug[sampleKey];
    if (sample && this.buggyInput) {
      this.buggyInput.value = sample.buggyCode;
      if (sampleKey === 'typeerror') {
        this.langSelect.value = 'javascript';
      } else if (sampleKey === 'indexerror') {
        this.langSelect.value = 'python';
      } else if (sampleKey === 'memory_leak') {
        this.langSelect.value = 'cpp';
      }
      this.renderDiff(sample.buggyCode, sample.fixedCode, sample.diagnosis);
    }
  }

  async analyzeAndFix() {
    const code = this.buggyInput.value.trim();
    if (!code) {
      alert('Please paste some code first!');
      return;
    }

    this.btnRunDiff.disabled = true;
    this.btnRunDiff.innerHTML = `<span>Analyzing...</span>`;

    const lang = this.langSelect.value;
    const prompt = `Inspect this ${lang} code for bugs, logic errors, or memory issues:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\nProvide root cause analysis and fixed code.`;

    try {
      const response = await geminiService.generateResponse({
        prompt,
        domain: 'debug',
        language: lang,
        systemPrompt: DOMAINS.debug.systemPrompt('intermediate', lang)
      });

      // Extract code block if returned by Gemini
      const match = response.text.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/);
      let fixedCode = match ? match[1].trim() : code;

      // Extract diagnosis
      let diagnosis = response.text.split('```')[0].trim();
      if (!diagnosis) {
        diagnosis = "Analyzed code and applied bug fixes and modern safety patterns.";
      }

      this.renderDiff(code, fixedCode, diagnosis);

    } catch (err) {
      console.error(err);
      alert('Error analyzing code: ' + err.message);
    } finally {
      this.btnRunDiff.disabled = false;
      this.btnRunDiff.innerHTML = `<span>Diagnose & Fix ⚡</span>`;
    }
  }

  /**
   * Computes a line-by-line visual difference
   */
  renderDiff(oldCode, newCode, diagnosis) {
    this.currentFixedCode = newCode;
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');

    let html = '';
    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined) {
        // Line added
        html += `<div class="diff-line added">
          <span class="diff-line-number">+${i + 1}</span>
          <span>${this.escapeHtml(newLine)}</span>
        </div>`;
      } else if (newLine === undefined) {
        // Line removed
        html += `<div class="diff-line removed">
          <span class="diff-line-number">-${i + 1}</span>
          <span>${this.escapeHtml(oldLine)}</span>
        </div>`;
      } else if (oldLine !== newLine) {
        // Line changed (Show removed then added)
        html += `<div class="diff-line removed">
          <span class="diff-line-number">-${i + 1}</span>
          <span>${this.escapeHtml(oldLine)}</span>
        </div>`;
        html += `<div class="diff-line added">
          <span class="diff-line-number">+${i + 1}</span>
          <span>${this.escapeHtml(newLine)}</span>
        </div>`;
      } else {
        // Unchanged
        html += `<div class="diff-line unchanged">
          <span class="diff-line-number">${i + 1}</span>
          <span>${this.escapeHtml(oldLine)}</span>
        </div>`;
      }
    }

    if (this.diffOutput) {
      this.diffOutput.innerHTML = html;
    }

    if (this.diagnosisText) {
      // Safe markdown conversion isolating inline code
      const codes = [];
      let dHtml = diagnosis.replace(/`([^`]+)`/g, (m, c) => {
        codes.push(`<code>${this.escapeHtml(c)}</code>`);
        return `%%%DIAG_CODE_${codes.length - 1}%%%`;
      });

      dHtml = dHtml
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

      codes.forEach((cHtml, idx) => {
        dHtml = dHtml.replace(`%%%DIAG_CODE_${idx}%%%`, cHtml);
      });

      this.diagnosisText.innerHTML = dHtml;
    }
  }

  copyFixedCode() {
    if (!this.currentFixedCode) return;
    navigator.clipboard.writeText(this.currentFixedCode).then(() => {
      const originalText = this.btnCopyFixed.innerHTML;
      this.btnCopyFixed.innerHTML = `✓ Copied!`;
      setTimeout(() => {
        this.btnCopyFixed.innerHTML = originalText;
      }, 2000);
    });
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
}

export let diffEngineInstance = null;
export function initDiffEngine() {
  diffEngineInstance = new DiffEngine();
  return diffEngineInstance;
}
