# Implementation Plan: Expense and Budget Visualizer

## Overview

Build a fully client-side single-page web app using HTML, CSS, and Vanilla JavaScript. All logic lives in `js/app.js`, all styles in `css/styles.css`, and the entry point is `index.html`. State is persisted to `localStorage` under a single fixed key. Every add/delete action triggers a synchronous in-memory update, a `localStorage.setItem`, and a full re-render of all four components.

---

## Tasks

- [x] 1. Set up project structure and static HTML scaffold
  - Create `index.html` with the four section containers: `#balance-section`, `#input-form`, `#transaction-list-section`, `#pie-chart-section`
  - Add all required DOM elements as specified in the design: `#balance-amount`, `#item-name`, `#item-amount`, `#item-category`, `#form-error`, `#transaction-list`, `#empty-state-msg`, `#pie-chart` (SVG), `#pie-legend`, `#pie-empty-msg`
  - Create empty `css/styles.css` and `js/app.js` files and link them from `index.html`
  - Add the `#info-banner` element (hidden by default) for storage load messages
  - _Requirements: 6.4_

- [x] 2. Implement StorageManager and data model
  - [x] 2.1 Implement `StorageManager` module in `app.js`
    - Implement `StorageManager.load()`: reads from `localStorage` under `STORAGE_KEY`, returns parsed array; returns `[]` and shows info banner on missing key; clears corrupt data and shows info banner on parse error
    - Implement `StorageManager.save(transactions)`: serializes and writes the array; throws on failure so the caller can catch
    - Define the `STORAGE_KEY` constant and the `Transaction` typedef (JSDoc)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_



- [x] 3. Implement Validator module
  - [x] 3.1 Implement `Validator` module in `app.js`
    - Implement `Validator.validate({ name, amount, category })` using `VALIDATION_RULES`
    - Return `{ valid: true }` on success or `{ valid: false, message: string }` with the exact error messages from the design's error-handling table
    - Apply fail-fast logic: return the first failing field's error only
    - _Requirements: 1.3, 1.4_



- [ ] 4. Checkpoint — core data layer complete
  - Ensure `StorageManager` and `Validator` are wired into `app.js` scope; run all unit and property tests written so far; ask the user if any questions arise.

- [ ] 5. Implement StateManager and event wiring for add/delete
  - [ ] 5.1 Implement `StateManager` module in `app.js`
    - Implement `StateManager.init(transactions)`: sets the in-memory array
    - Implement `StateManager.add(transaction)`: prepends a new `Transaction` object (with `crypto.randomUUID()` id and `new Date().toISOString()` date) to the array
    - Implement `StateManager.delete(id)`: removes the transaction with the matching id, preserving order of remaining items
    - Expose `StateManager.getAll()` to return the current array
    - _Requirements: 1.2, 2.4_

  

- [ ] 6. Implement Renderer — Balance_Display
  - [ ] 6.1 Implement `renderBalanceDisplay(transactions)` in `app.js`
    - Compute the sum of all `amount` fields; format as `"$X.XX"` with two decimal places
    - Update `#balance-amount` text content
    - Show `"$0.00"` when the array is empty
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_



- [ ] 7. Implement Renderer — Transaction_List
  - [ ] 7.1 Implement `renderTransactionList(transactions)` in `app.js`
    - Clear and repopulate `#transaction-list` with `<li>` elements matching the design's DOM structure (name, formatted amount, category, date, delete button with `aria-label`)
    - Show `#empty-state-msg` when the array is empty; hide it otherwise
    - Attach a delegated click listener on `#transaction-list` to call `handleDeleteTransaction(id)` on delete button clicks
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

 

- [ ] 8. Implement Renderer — Pie_Chart
  - [ ] 8.1 Implement `computeCategoryTotals(transactions)` in `app.js`
    - Sum amounts per category (Food, Transport, Fun); return a `CategoryTotals` object
    - _Requirements: 4.1_



  - [ ] 8.3 Implement `computePieSlices(totals)` and `makePieSlicePath(...)` in `app.js`
    - Convert `CategoryTotals` to `PieSlice[]` using the trigonometric algorithm from the design
    - When total is zero, produce three equal 120° placeholder slices in muted colors
    - Assign the specified hex colors: Food `#4CAF50`, Transport `#2196F3`, Fun `#FF9800`
    - _Requirements: 4.1, 4.2, 4.5_



  - [ ] 8.5 Implement `renderPieChart(transactions)` in `app.js`
    - Clear and redraw `#pie-chart` SVG with `<path>` elements from `computePieSlices`
    - Populate `#pie-legend` with category name and percentage for each slice
    - Show `#pie-empty-msg` and hide the SVG when the array is empty; hide the message and show the SVG otherwise
    - Update within 1 second of any add/delete action (synchronous re-render satisfies this)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_



- [ ] 9. Checkpoint — all renderers complete
  - Ensure `renderBalanceDisplay`, `renderTransactionList`, and `renderPieChart` all work correctly in isolation; run all tests; ask the user if any questions arise.

- [ ] 10. Implement EventHandlers and wire everything together
  - [ ] 10.1 Implement `handleFormSubmit(event)` in `app.js`
    - Call `getFormValues()`, pass to `Validator.validate`; on failure call `showFormError(message)` and return
    - On success: wrap `StorageManager.save` + `StateManager.add` + `Renderer.renderAll` in a try/catch; on catch call `showFormError("Could not save transaction. Storage may be full or unavailable.")`
    - On success: call `clearFormError()` and `resetForm()`
    - _Requirements: 1.2, 1.4, 1.5, 1.6_

  - [ ] 10.2 Implement `handleDeleteTransaction(id)` in `app.js`
    - Call `StateManager.delete(id)`, then `StorageManager.save`, then `Renderer.renderAll`
    - _Requirements: 2.4, 5.3_

  - [ ] 10.3 Implement `Renderer.renderAll(transactions)` in `app.js`
    - Call `renderBalanceDisplay`, `renderTransactionList`, and `renderPieChart` in sequence
    - _Requirements: 3.2, 3.3, 4.3, 4.4_

  - [ ] 10.4 Implement the `DOMContentLoaded` initialization sequence in `app.js`
    - Call `StorageManager.load()`, handle empty/corrupt cases (show info banner), call `StateManager.init(transactions)`, call `Renderer.renderAll()`
    - _Requirements: 5.2, 5.4, 5.5_

- [ ] 11. Implement CSS styling and responsive layout
  - [ ] 11.1 Write base styles in `css/styles.css`
    - Apply typographic scale: heading font size ≥ 1.25× body; minimum body font size 14px
    - Add visual grouping between sections: ≥16px spacing or visible border or distinct background
    - Ensure text/background color contrast meets WCAG 2.1 AA (minimum 4.5:1 for normal text)
    - Style the transaction list as scrollable with a fixed max-height
    - Style the delete button, form inputs, and category dropdown
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 11.2 Add responsive styles for viewports narrower than 600px
    - Use a media query at `max-width: 599px` to reflow all sections to a single column without horizontal scrolling
    - Ensure all text remains ≥14px
    - Set minimum tap target size of 44×44px for all buttons, inputs, and dropdowns
    - _Requirements: 7.4, 7.5_

- [ ] 12. Final checkpoint — full integration
  - Verify the complete add/delete cycle works end-to-end in the browser: form submission, validation errors, list update, balance update, pie chart update, localStorage persistence, and page-reload data restoration
  - Run all unit and property tests; ensure all pass
  - Ask the user if any questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` loaded via CDN in the test harness — it is NOT included in production `app.js`
- All modules (`StorageManager`, `Validator`, `StateManager`, `Renderer`, `EventHandlers`) are plain JS objects/functions inside an IIFE in `app.js` to avoid global scope pollution
- Checkpoints ensure incremental validation at logical boundaries
- Property tests validate universal correctness invariants; unit tests validate specific examples and edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "7.1", "8.1"] },
    { "id": 5, "tasks": ["7.2", "8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4", "8.5"] },
    { "id": 7, "tasks": ["8.6", "10.1", "10.2", "10.3", "10.4"] },
    { "id": 8, "tasks": ["11.1"] },
    { "id": 9, "tasks": ["11.2"] }
  ]
}
```
