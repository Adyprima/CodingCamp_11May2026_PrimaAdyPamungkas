/**
 * Unit tests for StorageManager
 *
 * These tests run in the browser test harness (tests/test-runner.html).
 * They access StorageManager via window.__app__.StorageManager.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

(function (runner) {
  'use strict';

  const { StorageManager, STORAGE_KEY } = window.__app__;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Clears the storage key and the info banner before each test */
  function setup() {
    localStorage.removeItem(STORAGE_KEY);
    const banner = document.getElementById('info-banner');
    if (banner) {
      banner.setAttribute('hidden', '');
      banner.textContent = '';
    }
  }

  // ---------------------------------------------------------------------------
  // Tests
  // ---------------------------------------------------------------------------

  runner.test('StorageManager.load returns [] when key is absent', function () {
    setup();
    const result = StorageManager.load();
    runner.assert(Array.isArray(result), 'Result should be an array');
    runner.assert(result.length === 0, 'Result should be empty');
  });

  runner.test('StorageManager.load shows info banner when key is absent', function () {
    setup();
    StorageManager.load();
    const banner = document.getElementById('info-banner');
    runner.assert(!banner.hasAttribute('hidden'), 'Banner should be visible');
    runner.assert(
      banner.textContent === 'No saved data found. Start adding transactions!',
      'Banner should show missing-data message'
    );
  });

  runner.test('StorageManager.load returns parsed array when data is valid', function () {
    setup();
    const transactions = [
      { id: 'abc-1', name: 'Lunch', amount: 12.5, category: 'Food', date: '2025-05-11T08:30:00.000Z' },
      { id: 'abc-2', name: 'Bus', amount: 3.0, category: 'Transport', date: '2025-05-11T09:00:00.000Z' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    const result = StorageManager.load();
    runner.assert(Array.isArray(result), 'Result should be an array');
    runner.assert(result.length === 2, 'Result should have 2 items');
    runner.assert(result[0].id === 'abc-1', 'First item id should match');
    runner.assert(result[1].name === 'Bus', 'Second item name should match');
  });

  runner.test('StorageManager.load clears corrupt data and returns []', function () {
    setup();
    localStorage.setItem(STORAGE_KEY, 'this is not valid JSON!!!');
    const result = StorageManager.load();
    runner.assert(Array.isArray(result), 'Result should be an array');
    runner.assert(result.length === 0, 'Result should be empty after corrupt data');
    runner.assert(
      localStorage.getItem(STORAGE_KEY) === null,
      'Corrupt entry should be removed from localStorage'
    );
  });

  runner.test('StorageManager.load shows info banner on corrupt data', function () {
    setup();
    localStorage.setItem(STORAGE_KEY, '{bad json}');
    StorageManager.load();
    const banner = document.getElementById('info-banner');
    runner.assert(!banner.hasAttribute('hidden'), 'Banner should be visible');
    runner.assert(
      banner.textContent === 'Saved data was unreadable and has been cleared.',
      'Banner should show corrupt-data message'
    );
  });

  runner.test('StorageManager.load clears and returns [] when stored value is not an array', function () {
    setup();
    // Valid JSON but not an array
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 'x', name: 'oops' }));
    const result = StorageManager.load();
    runner.assert(Array.isArray(result), 'Result should be an array');
    runner.assert(result.length === 0, 'Result should be empty');
    runner.assert(
      localStorage.getItem(STORAGE_KEY) === null,
      'Non-array entry should be removed from localStorage'
    );
  });

  runner.test('StorageManager.save writes serialized transactions to localStorage', function () {
    setup();
    const transactions = [
      { id: 'xyz-1', name: 'Coffee', amount: 4.5, category: 'Food', date: '2025-05-11T07:00:00.000Z' },
    ];
    StorageManager.save(transactions);
    const raw = localStorage.getItem(STORAGE_KEY);
    runner.assert(raw !== null, 'localStorage should contain data after save');
    const parsed = JSON.parse(raw);
    runner.assert(Array.isArray(parsed), 'Stored value should be an array');
    runner.assert(parsed.length === 1, 'Stored array should have 1 item');
    runner.assert(parsed[0].id === 'xyz-1', 'Stored item id should match');
    runner.assert(parsed[0].name === 'Coffee', 'Stored item name should match');
    runner.assert(parsed[0].amount === 4.5, 'Stored item amount should match');
  });

  runner.test('StorageManager.save followed by load produces deeply equal array (round-trip)', function () {
    setup();
    const transactions = [
      { id: 'rt-1', name: 'Dinner', amount: 25.0, category: 'Food', date: '2025-05-11T19:00:00.000Z' },
      { id: 'rt-2', name: 'Taxi', amount: 15.75, category: 'Transport', date: '2025-05-11T20:00:00.000Z' },
    ];
    StorageManager.save(transactions);
    // Reset banner so load doesn't show missing-key banner
    const banner = document.getElementById('info-banner');
    if (banner) { banner.setAttribute('hidden', ''); banner.textContent = ''; }
    const loaded = StorageManager.load();
    runner.assert(loaded.length === transactions.length, 'Round-trip length should match');
    for (let i = 0; i < transactions.length; i++) {
      runner.assert(loaded[i].id === transactions[i].id, 'id should survive round-trip');
      runner.assert(loaded[i].name === transactions[i].name, 'name should survive round-trip');
      runner.assert(loaded[i].amount === transactions[i].amount, 'amount should survive round-trip');
      runner.assert(loaded[i].category === transactions[i].category, 'category should survive round-trip');
      runner.assert(loaded[i].date === transactions[i].date, 'date should survive round-trip');
    }
  });

  runner.test('StorageManager.save overwrites previous data', function () {
    setup();
    StorageManager.save([{ id: 'old-1', name: 'Old', amount: 1, category: 'Fun', date: '2025-01-01T00:00:00.000Z' }]);
    StorageManager.save([{ id: 'new-1', name: 'New', amount: 2, category: 'Food', date: '2025-01-02T00:00:00.000Z' }]);
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    runner.assert(parsed.length === 1, 'Should only have 1 item after overwrite');
    runner.assert(parsed[0].id === 'new-1', 'Should have the new item');
  });

  runner.test('StorageManager.save can persist an empty array', function () {
    setup();
    StorageManager.save([]);
    const raw = localStorage.getItem(STORAGE_KEY);
    runner.assert(raw !== null, 'localStorage should contain data');
    const parsed = JSON.parse(raw);
    runner.assert(Array.isArray(parsed) && parsed.length === 0, 'Should store empty array');
  });

}(window.__testRunner__));
