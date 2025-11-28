/**
 * Storage utilities for extension state management
 */
(function() {
  'use strict';

  // Default storage state
  const DEFAULT_STATE = {
    // Toggle states
    modes: {
      hsDebug: false,
      cacheBuster: false,
      developerMode: false
    },

    // Settings
    settings: {
      autoApplyToLinks: true,
      showBadge: true,
      persistAcrossSessions: true
    },

    // Allowed domains for auto-apply
    domains: {
      allowedDomains: []
    }
  };

  /**
   * Get current state from storage
   * @returns {Promise<Object>} - Current state
   */
  async function getState() {
    const api = typeof browser !== 'undefined' && browser.storage ? browser : chrome;

    return new Promise((resolve) => {
      api.storage.sync.get('state', (result) => {
        resolve(result.state || DEFAULT_STATE);
      });
    });
  }

  /**
   * Save state to storage
   * @param {Object} state - State to save
   * @returns {Promise<void>}
   */
  async function saveState(state) {
    const api = typeof browser !== 'undefined' && browser.storage ? browser : chrome;

    return new Promise((resolve) => {
      api.storage.sync.set({ state }, resolve);
    });
  }

  /**
   * Update specific part of state
   * @param {string} key - State key to update (e.g., 'modes', 'settings')
   * @param {Object} value - New value for the key
   * @returns {Promise<Object>} - Updated full state
   */
  async function updateState(key, value) {
    const currentState = await getState();
    const newState = {
      ...currentState,
      [key]: {
        ...currentState[key],
        ...value
      }
    };
    await saveState(newState);
    return newState;
  }

  /**
   * Reset state to defaults
   * @returns {Promise<Object>} - Default state
   */
  async function resetState() {
    await saveState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }

  // Export to window
  window.DEFAULT_STATE = DEFAULT_STATE;
  window.getState = getState;
  window.saveState = saveState;
  window.updateState = updateState;
  window.resetState = resetState;
})();
