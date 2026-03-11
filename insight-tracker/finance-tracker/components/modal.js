/**
 * components/modal.js — Reusable modal component.
 *
 * Handles open/close, keyboard trapping, focus management,
 * and optional form reset on close.
 *
 * Usage:
 *   const m = new Modal('modal-id');
 *   m.open();
 *   m.close();
 *   m.onOpen = () => { ... };
 *   m.onClose = () => { ... };
 */

export class Modal {
  /**
   * @param {string} id - The `id` attribute of the .modal-overlay element
   */
  constructor(id) {
    this.id      = id;
    this.overlay = document.getElementById(id);

    if (!this.overlay) {
      console.warn(`[Modal] No element found with id="${id}"`);
      return;
    }

    this.box     = this.overlay.querySelector('.modal-box');
    this._bound  = {
      keydown:        this._handleKeydown.bind(this),
      overlayClick:   this._handleOverlayClick.bind(this),
    };

    /** @type {Function|null} Called just before modal opens */
    this.onOpen = null;

    /** @type {Function|null} Called just after modal closes */
    this.onClose = null;

    /** @type {HTMLElement|null} Element to restore focus to after close */
    this._triggerElement = null;

    this._attachCloseButtons();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Open the modal.
   * @param {HTMLElement} [trigger] - the element that triggered the open,
   *   used to restore focus on close.
   */
  open(trigger = null) {
    if (!this.overlay) return;

    if (this.onOpen) this.onOpen();

    this._triggerElement = trigger ?? document.activeElement;
    this.overlay.hidden  = false;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Attach event listeners
    document.addEventListener('keydown', this._bound.keydown);
    this.overlay.addEventListener('mousedown', this._bound.overlayClick);

    // Focus first focusable element
    requestAnimationFrame(() => this._focusFirst());
  }

  /**
   * Close the modal.
   * @param {boolean} [resetForm=true] - whether to reset any form inside
   */
  close(resetForm = true) {
    if (!this.overlay || this.overlay.hidden) return;

    this.overlay.hidden = true;
    document.body.style.overflow = '';

    document.removeEventListener('keydown', this._bound.keydown);
    this.overlay.removeEventListener('mousedown', this._bound.overlayClick);

    if (resetForm) {
      const form = this.overlay.querySelector('form');
      if (form) {
        form.reset();
        this._clearErrors();
      }
    }

    // Restore focus
    if (this._triggerElement && typeof this._triggerElement.focus === 'function') {
      this._triggerElement.focus();
    }
    this._triggerElement = null;

    if (this.onClose) this.onClose();
  }

  /**
   * Toggle the modal open/closed.
   */
  toggle() {
    if (this.overlay.hidden) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
   * Return whether the modal is currently open.
   * @returns {boolean}
   */
  get isOpen() {
    return this.overlay ? !this.overlay.hidden : false;
  }

  /**
   * Set the modal title text.
   * @param {string} title
   */
  setTitle(title) {
    const el = this.overlay.querySelector('.modal-header h3');
    if (el) el.textContent = title;
  }

  /**
   * Display validation errors in the modal's error container.
   * @param {string[]} errors
   * @param {string} [containerId='form-errors']
   */
  showErrors(errors, containerId = 'form-errors') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!errors || errors.length === 0) {
      container.hidden = true;
      container.innerHTML = '';
      return;
    }

    const items = errors.map((e) => `<li>${e}</li>`).join('');
    container.innerHTML = `<ul>${items}</ul>`;
    container.hidden = false;
  }

  /**
   * Clear validation errors.
   * @param {string} [containerId='form-errors']
   */
  clearErrors(containerId = 'form-errors') {
    const container = document.getElementById(containerId);
    if (container) {
      container.hidden = true;
      container.innerHTML = '';
    }
  }

  // ── Private methods ─────────────────────────────────────────────────────────

  /**
   * Attach click listeners to all [data-modal="id"] close buttons inside this modal.
   */
  _attachCloseButtons() {
    if (!this.overlay) return;
    const buttons = this.overlay.querySelectorAll(`[data-modal="${this.id}"]`);
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });
  }

  /**
   * Handle keyboard events while modal is open (Escape + Tab trap).
   * @param {KeyboardEvent} e
   */
  _handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === 'Tab') {
      this._trapFocus(e);
    }
  }

  /**
   * Close when clicking on the overlay backdrop (not the modal box).
   * @param {MouseEvent} e
   */
  _handleOverlayClick(e) {
    if (e.target === this.overlay) {
      this.close();
    }
  }

  /**
   * Keep Tab focus inside the modal box.
   * @param {KeyboardEvent} e
   */
  _trapFocus(e) {
    if (!this.box) return;

    const focusable = Array.from(
      this.box.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.closest('[hidden]'));

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /**
   * Focus the first focusable element in the modal box.
   */
  _focusFirst() {
    if (!this.box) return;
    const first = this.box.querySelector(
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
    );
    if (first) first.focus();
  }

  /**
   * Clear any error containers in the modal (called on close/reset).
   */
  _clearErrors() {
    const errorContainers = this.overlay.querySelectorAll('.form-errors');
    errorContainers.forEach((el) => {
      el.hidden = true;
      el.innerHTML = '';
    });
    // Remove error styling from inputs
    this.overlay.querySelectorAll('.form-control.error').forEach((el) => {
      el.classList.remove('error');
    });
  }

  // ── Static factory ──────────────────────────────────────────────────────────

  /**
   * Create and return a Modal instance, wiring up any data-modal-open buttons.
   * @param {string} id
   * @returns {Modal}
   */
  static create(id) {
    const modal = new Modal(id);

    // Wire any elements with data-modal-open="id" to open this modal
    document.querySelectorAll(`[data-modal-open="${id}"]`).forEach((btn) => {
      btn.addEventListener('click', () => modal.open(btn));
    });

    return modal;
  }
}

/**
 * Initialize all modals on the page (elements with class .modal-overlay).
 * Returns a map of { id -> Modal }.
 * @returns {Record<string, Modal>}
 */
export function initModals() {
  const modals = {};
  document.querySelectorAll('.modal-overlay').forEach((el) => {
    if (el.id) {
      modals[el.id] = new Modal(el.id);
    }
  });
  return modals;
}
