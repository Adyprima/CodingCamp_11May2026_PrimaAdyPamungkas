/**
 * Unit tests for Validator
 *
 * These tests run in the browser test harness (tests/test-runner.html).
 * They access Validator via window.__app__.Validator.
 *
 * Validates: Requirements 1.3, 1.4
 */

(function (runner) {
  'use strict';

  const { Validator } = window.__app__;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Returns a valid transaction payload for use as a baseline */
  function validPayload(overrides) {
    return Object.assign({ name: 'Lunch', amount: '12.50', category: 'Food' }, overrides);
  }

  // ---------------------------------------------------------------------------
  // Name validation
  // ---------------------------------------------------------------------------

  runner.test('Validator rejects empty name', function () {
    const result = Validator.validate(validPayload({ name: '' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(result.message === 'Item name is required.', 'Wrong error message: ' + result.message);
  });

  runner.test('Validator rejects whitespace-only name', function () {
    const result = Validator.validate(validPayload({ name: '   ' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(result.message === 'Item name is required.', 'Wrong error message: ' + result.message);
  });

  runner.test('Validator rejects name longer than 100 characters', function () {
    const longName = 'a'.repeat(101);
    const result = Validator.validate(validPayload({ name: longName }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(
      result.message === 'Item name must be 100 characters or fewer.',
      'Wrong error message: ' + result.message
    );
  });

  runner.test('Validator accepts name exactly 100 characters', function () {
    const exactName = 'a'.repeat(100);
    const result = Validator.validate(validPayload({ name: exactName }));
    runner.assert(result.valid === true, 'Should be valid for 100-char name');
  });

  // ---------------------------------------------------------------------------
  // Amount validation
  // ---------------------------------------------------------------------------

  runner.test('Validator rejects empty amount', function () {
    const result = Validator.validate(validPayload({ amount: '' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(result.message === 'Amount is required.', 'Wrong error message: ' + result.message);
  });

  runner.test('Validator rejects non-numeric amount', function () {
    const result = Validator.validate(validPayload({ amount: 'abc' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(result.message === 'Amount must be a number.', 'Wrong error message: ' + result.message);
  });

  runner.test('Validator rejects amount = 0', function () {
    const result = Validator.validate(validPayload({ amount: '0' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(
      result.message === 'Amount must be between 0.01 and 999,999,999.99.',
      'Wrong error message: ' + result.message
    );
  });

  runner.test('Validator rejects amount below minimum (0.001)', function () {
    const result = Validator.validate(validPayload({ amount: '0.001' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(
      result.message === 'Amount must be between 0.01 and 999,999,999.99.',
      'Wrong error message: ' + result.message
    );
  });

  runner.test('Validator rejects amount = 1,000,000,000', function () {
    const result = Validator.validate(validPayload({ amount: '1000000000' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(
      result.message === 'Amount must be between 0.01 and 999,999,999.99.',
      'Wrong error message: ' + result.message
    );
  });

  runner.test('Validator accepts amount at minimum boundary (0.01)', function () {
    const result = Validator.validate(validPayload({ amount: '0.01' }));
    runner.assert(result.valid === true, 'Should be valid at minimum boundary');
  });

  runner.test('Validator accepts amount at maximum boundary (999999999.99)', function () {
    const result = Validator.validate(validPayload({ amount: '999999999.99' }));
    runner.assert(result.valid === true, 'Should be valid at maximum boundary');
  });

  // ---------------------------------------------------------------------------
  // Category validation
  // ---------------------------------------------------------------------------

  runner.test('Validator rejects missing category (empty string)', function () {
    const result = Validator.validate(validPayload({ category: '' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(result.message === 'Please select a category.', 'Wrong error message: ' + result.message);
  });

  runner.test('Validator rejects invalid category value', function () {
    const result = Validator.validate(validPayload({ category: 'Entertainment' }));
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(result.message === 'Please select a category.', 'Wrong error message: ' + result.message);
  });

  runner.test('Validator accepts category "Food"', function () {
    const result = Validator.validate(validPayload({ category: 'Food' }));
    runner.assert(result.valid === true, 'Should be valid for Food');
  });

  runner.test('Validator accepts category "Transport"', function () {
    const result = Validator.validate(validPayload({ category: 'Transport' }));
    runner.assert(result.valid === true, 'Should be valid for Transport');
  });

  runner.test('Validator accepts category "Fun"', function () {
    const result = Validator.validate(validPayload({ category: 'Fun' }));
    runner.assert(result.valid === true, 'Should be valid for Fun');
  });

  // ---------------------------------------------------------------------------
  // Fail-fast ordering
  // ---------------------------------------------------------------------------

  runner.test('Validator reports name error before amount error (fail-fast)', function () {
    const result = Validator.validate({ name: '', amount: '', category: '' });
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(result.message === 'Item name is required.', 'Should report name error first');
  });

  runner.test('Validator reports amount error before category error (fail-fast)', function () {
    const result = Validator.validate({ name: 'Coffee', amount: '', category: '' });
    runner.assert(result.valid === false, 'Should be invalid');
    runner.assert(result.message === 'Amount is required.', 'Should report amount error before category');
  });

  // ---------------------------------------------------------------------------
  // Valid transaction
  // ---------------------------------------------------------------------------

  runner.test('Validator accepts a fully valid transaction', function () {
    const result = Validator.validate({ name: 'Lunch', amount: '12.50', category: 'Food' });
    runner.assert(result.valid === true, 'Should be valid');
    runner.assert(!('message' in result), 'Should not have a message property on success');
  });

}(window.__testRunner__));
