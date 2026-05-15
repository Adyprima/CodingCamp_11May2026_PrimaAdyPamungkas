/* app.js — Expense & Budget Visualizer */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  /** @type {string} Fixed localStorage key used across all sessions */
  const STORAGE_KEY = 'expense_budget_visualizer_transactions';

  // ---------------------------------------------------------------------------
  // Typedefs
  // ---------------------------------------------------------------------------

  /**
   * @typedef {Object} Transaction
   * @property {string} id        - UUID v4 generated at creation time
   * @property {string} name      - Item name (1–100 characters)
   * @property {number} amount    - Positive number (0.01–999,999,999.99)
   * @property {string} category  - One of: "Food" | "Transport" | "Fun"
   * @property {string} date      - ISO 8601 date string
   */

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Shows the #info-banner element with the given message.
   * @param {string} message
   */
  function showInfoBanner(message) {
    const banner = document.getElementById('info-banner');
    if (!banner) return;
    banner.textContent = message;
    banner.removeAttribute('hidden');
  }

  // ---------------------------------------------------------------------------
  // StorageManager
  // ---------------------------------------------------------------------------

  /**
   * Manages reading and writing the transaction array to localStorage.
   */
  const StorageManager = {
    /**
     * Loads transactions from localStorage.
     *
     * - Returns the parsed array on success.
     * - Returns [] and shows an info banner when the key is absent (null).
     * - Clears the corrupt entry and shows an info banner when the value
     *   cannot be parsed as JSON.
     *
     * @returns {Transaction[]}
     */
    load() {
      let raw;
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        // localStorage.getItem itself threw (e.g. security restriction)
        showInfoBanner('No saved data found. Start adding transactions!');
        return [];
      }

      // Key not present
      if (raw === null) {
        showInfoBanner('No saved data found. Start adding transactions!');
        return [];
      }

      // Attempt to parse
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          throw new Error('Stored value is not an array');
        }
        return parsed;
      } catch (e) {
        // Corrupt / unreadable data — clear it and inform the user
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (_) {
          // Ignore removal errors; we still want to return a clean state
        }
        showInfoBanner('Saved data was unreadable and has been cleared.');
        return [];
      }
    },

    /**
     * Serializes and writes the transaction array to localStorage.
     * Throws if the write fails so the caller can handle the error.
     *
     * @param {Transaction[]} transactions
     * @throws {Error} When localStorage.setItem fails
     */
    save(transactions) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    },
  };

  // ---------------------------------------------------------------------------
  // Validator
  // ---------------------------------------------------------------------------

  /**
   * Validation rules for transaction form fields.
   */
  const VALIDATION_RULES = {
    name:     { required: true, maxLength: 100 },
    amount:   { required: true, min: 0.01, max: 999_999_999.99, numeric: true },
    category: { required: true, oneOf: ['Food', 'Transport', 'Fun'] },
  };

  /**
   * Validates transaction form field values using fail-fast logic.
   * Checks name first, then amount, then category.
   *
   * @param {{ name: string, amount: string, category: string }} fields
   * @returns {{ valid: true } | { valid: false, message: string }}
   */
  const Validator = {
    validate({ name, amount, category }) {
      // --- name ---
      const trimmedName = (name || '').trim();
      if (trimmedName.length === 0) {
        return { valid: false, message: 'Item name is required.' };
      }
      if (trimmedName.length > VALIDATION_RULES.name.maxLength) {
        return { valid: false, message: 'Item name must be 100 characters or fewer.' };
      }

      // --- amount ---
      const trimmedAmount = (amount || '').trim();
      if (trimmedAmount.length === 0) {
        return { valid: false, message: 'Amount is required.' };
      }
      const numericAmount = Number(trimmedAmount);
      if (isNaN(numericAmount)) {
        return { valid: false, message: 'Amount must be a number.' };
      }
      if (numericAmount < VALIDATION_RULES.amount.min || numericAmount > VALIDATION_RULES.amount.max) {
        return { valid: false, message: 'Amount must be between 0.01 and 999,999,999.99.' };
      }

      // --- category ---
      if (!category || !VALIDATION_RULES.category.oneOf.includes(category)) {
        return { valid: false, message: 'Please select a category.' };
      }

      return { valid: true };
    },
  };

  // ---------------------------------------------------------------------------
  // Expose modules for testing (non-production environments only)
  // ---------------------------------------------------------------------------
  // Tests can access internals via window.__app__ without polluting global scope
  // in normal usage.
  if (typeof window !== 'undefined') {
    window.__app__ = window.__app__ || {};
    window.__app__.StorageManager = StorageManager;
    window.__app__.STORAGE_KEY = STORAGE_KEY;
    window.__app__.Validator = Validator;
    window.__app__.VALIDATION_RULES = VALIDATION_RULES;
  }

})();
