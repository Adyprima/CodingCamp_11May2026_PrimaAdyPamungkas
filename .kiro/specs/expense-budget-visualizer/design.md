# Design Document: Expense and Budget Visualizer

## Overview

The Expense and Budget Visualizer is a fully client-side single-page web application built with HTML, CSS, and Vanilla JavaScript. There is no backend, no build step, and no external runtime dependencies. All state is held in memory during a session and persisted to the browser's `localStorage` under a single fixed key.

The application presents four visual sections on one page:

- **Input_Form** — a form to enter a new expense transaction
- **Balance_Display** — a running total of all recorded spending
- **Transaction_List** — a scrollable, reverse-chronological list of transactions with per-row delete
- **Pie_Chart** — a live SVG pie chart showing spending distribution across the three categories (Food, Transport, Fun)

Every user action (add or delete) triggers a synchronous in-memory state update followed by a full re-render of all four components and a single `localStorage.setItem` call. This keeps the data flow simple and predictable.

---

## Architecture

### High-Level Structure

```
index.html
├── css/
│   └── styles.css          (single stylesheet)
└── js/
    └── app.js              (single JavaScript file)
```

No additional local CSS or JS files are loaded. No external network requests are made for core functionality.

### Data Flow

```
User Action (add / delete)
        │
        ▼
  Validator (validate input)
        │
        ▼
  State Manager (update in-memory array)
        │
        ├──► Storage (localStorage.setItem)
        │
        └──► Renderer (re-render all 4 components)
                ├── renderBalanceDisplay()
                ├── renderTransactionList()
                └── renderPieChart()
```

### Module Responsibilities (within `app.js`)

| Module | Responsibility |
|---|---|
| `StorageManager` | Read/write/parse transactions from `localStorage` |
| `Validator` | Validate form field values before submission |
| `StateManager` | Hold the in-memory transaction array; expose add/delete operations |
| `Renderer` | Pure render functions for each UI component |
| `EventHandlers` | Wire DOM events to state operations and re-renders |

All modules are plain JavaScript objects/functions defined in `app.js` — no ES modules, no classes required (though IIFE or object-literal namespacing is used to avoid polluting the global scope).

### Initialization Sequence

```
DOMContentLoaded
    │
    ├── StorageManager.load()
    │       ├── success → StateManager.init(transactions)
    │       ├── empty   → StateManager.init([]) + show info banner
    │       └── corrupt → StorageManager.clear() + StateManager.init([]) + show info banner
    │
    └── Renderer.renderAll()
```

---

## Components and Interfaces

### Input_Form

**DOM structure:**
```html
<form id="input-form">
  <input type="text"   id="item-name"   maxlength="100" />
  <input type="number" id="item-amount" min="0.01" max="999999999.99" step="0.01" />
  <select id="item-category">
    <option value="">-- Select Category --</option>
    <option value="Food">Food</option>
    <option value="Transport">Transport</option>
    <option value="Fun">Fun</option>
  </select>
  <button type="submit">Add Transaction</button>
  <div id="form-error" role="alert" aria-live="polite"></div>
</form>
```

**JavaScript interface:**
```js
// Called on form submit event
function handleFormSubmit(event) { ... }

// Reads and returns raw form values
function getFormValues() → { name: string, amount: string, category: string }

// Resets all fields to initial state
function resetForm() { ... }

// Displays an inline error message
function showFormError(message: string) { ... }

// Clears any displayed error
function clearFormError() { ... }
```

### Transaction_List

**DOM structure:**
```html
<section id="transaction-list-section">
  <h2>Transactions</h2>
  <ul id="transaction-list">
    <!-- populated by renderTransactionList() -->
  </ul>
  <p id="empty-state-msg" hidden>No transactions have been recorded yet.</p>
</section>
```

**JavaScript interface:**
```js
// Renders the full list from the current state array
function renderTransactionList(transactions: Transaction[]) { ... }

// Called on delete button click (event delegation on the <ul>)
function handleDeleteTransaction(id: string) { ... }
```

Each list item is rendered as:
```html
<li data-id="{id}">
  <span class="tx-name">{name}</span>
  <span class="tx-amount">${amount}</span>
  <span class="tx-category">{category}</span>
  <span class="tx-date">{date}</span>
  <button class="delete-btn" aria-label="Delete {name}">✕</button>
</li>
```

### Balance_Display

**DOM structure:**
```html
<section id="balance-section">
  <h1>Total Balance</h1>
  <p id="balance-amount">$0.00</p>
</section>
```

**JavaScript interface:**
```js
// Computes sum and updates the DOM element
function renderBalanceDisplay(transactions: Transaction[]) { ... }
```

### Pie_Chart

**DOM structure:**
```html
<section id="pie-chart-section">
  <h2>Spending by Category</h2>
  <svg id="pie-chart" viewBox="0 0 200 200" role="img" aria-label="Spending pie chart"></svg>
  <ul id="pie-legend"></ul>
  <p id="pie-empty-msg" hidden>No spending data to display.</p>
</section>
```

**JavaScript interface:**
```js
// Computes category totals and redraws the SVG + legend
function renderPieChart(transactions: Transaction[]) { ... }

// Computes per-category totals from transaction array
function computeCategoryTotals(transactions: Transaction[]) → CategoryTotals

// Converts category totals to SVG path data for pie slices
function computePieSlices(totals: CategoryTotals) → PieSlice[]

// Generates an SVG <path> element for a single pie slice
function makePieSlicePath(cx, cy, r, startAngle, endAngle, color) → SVGPathElement
```

**Pie chart rendering algorithm:**

The pie chart is rendered natively using SVG `<path>` elements with arc commands — no external chart library is required. Each slice is computed using trigonometry:

```
For each category with proportion p (0..1):
  startAngle = previous endAngle
  endAngle   = startAngle + p * 2π
  x1 = cx + r * cos(startAngle)
  y1 = cy + r * sin(startAngle)
  x2 = cx + r * cos(endAngle)
  y2 = cy + r * sin(endAngle)
  largeArcFlag = (endAngle - startAngle > π) ? 1 : 0
  path d = "M cx cy L x1 y1 A r r 0 largeArcFlag 1 x2 y2 Z"
```

When total spending is zero, three equal placeholder segments (120° each) are rendered in muted colors.

**Category colors:**

| Category  | Color   | Hex       |
|-----------|---------|-----------|
| Food      | Green   | `#4CAF50` |
| Transport | Blue    | `#2196F3` |
| Fun       | Orange  | `#FF9800` |

---

## Data Models

### Transaction

```js
/**
 * @typedef {Object} Transaction
 * @property {string} id        - UUID v4 generated at creation time (crypto.randomUUID or fallback)
 * @property {string} name      - Item name (1–100 characters)
 * @property {number} amount    - Positive number (0.01–999,999,999.99)
 * @property {string} category  - One of: "Food" | "Transport" | "Fun"
 * @property {string} date      - ISO 8601 date string (new Date().toISOString())
 */
```

### Storage Schema

```js
// Key
const STORAGE_KEY = "expense_budget_visualizer_transactions";

// Value: JSON-serialized array of Transaction objects
// Example:
[
  {
    "id": "a1b2c3d4-...",
    "name": "Lunch",
    "amount": 12.50,
    "category": "Food",
    "date": "2025-05-11T08:30:00.000Z"
  }
]
```

### CategoryTotals

```js
/**
 * @typedef {Object} CategoryTotals
 * @property {number} Food
 * @property {number} Transport
 * @property {number} Fun
 */
```

### PieSlice

```js
/**
 * @typedef {Object} PieSlice
 * @property {string} category    - Category name
 * @property {number} proportion  - Value in [0, 1]
 * @property {number} startAngle  - Radians
 * @property {number} endAngle    - Radians
 * @property {string} color       - Hex color string
 */
```

### Validation Rules

```js
const VALIDATION_RULES = {
  name:     { required: true, maxLength: 100 },
  amount:   { required: true, min: 0.01, max: 999_999_999.99, numeric: true },
  category: { required: true, oneOf: ["Food", "Transport", "Fun"] }
};
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction addition grows the list

*For any* transaction list and any valid transaction (non-empty name ≤ 100 chars, amount in [0.01, 999,999,999.99], valid category), adding that transaction to the list SHALL result in the list length increasing by exactly one, and the new transaction SHALL appear as the first element.

**Validates: Requirements 1.2, 2.3**

---

### Property 2: Whitespace-only and invalid inputs are rejected

*For any* form submission where the item name is empty or composed entirely of whitespace characters, OR the amount is outside [0.01, 999,999,999.99] or non-numeric, OR no category is selected, the transaction list SHALL remain unchanged (same length and same contents).

**Validates: Requirements 1.3, 1.4**

---

### Property 3: Delete removes exactly the targeted transaction

*For any* transaction list with at least one transaction, deleting a transaction by its `id` SHALL result in a list that contains every other transaction in its original relative order, and does not contain the deleted transaction.

**Validates: Requirements 2.4**

---

### Property 4: Balance equals sum of all transaction amounts

*For any* transaction list, the value displayed by Balance_Display SHALL equal the arithmetic sum of all `amount` fields in the list, formatted to two decimal places with a "$" prefix.

**Validates: Requirements 3.1, 3.4**

---

### Property 5: Storage round-trip preserves all transaction data

*For any* array of valid transactions, serializing it to `localStorage` and then deserializing it SHALL produce an array that is deeply equal to the original (same length, same field values for every transaction).

**Validates: Requirements 5.1, 5.2**

---

### Property 6: Category totals sum to total spending

*For any* transaction list, the sum of `CategoryTotals.Food + CategoryTotals.Transport + CategoryTotals.Fun` SHALL equal the sum of all transaction amounts (within floating-point rounding tolerance of ±0.001).

**Validates: Requirements 4.1**

---

### Property 7: Pie slice proportions sum to 1 (or are all 0)

*For any* non-empty transaction list, the sum of all `PieSlice.proportion` values SHALL equal 1.0 (within ±0.001 tolerance). For an empty transaction list, all proportions SHALL be 0.

**Validates: Requirements 4.1, 4.2**

---

### Property 8: Corrupt storage is discarded and app initializes cleanly

*For any* string stored under the storage key that is not valid JSON or does not parse to an array of valid Transaction objects, loading the app SHALL result in an empty transaction list, a balance of $0.00, and no JavaScript errors.

**Validates: Requirements 5.5**

---

## Error Handling

### Storage Unavailable on Write

When `localStorage.setItem` throws (e.g., storage quota exceeded, private browsing restrictions), the app SHALL:
1. NOT add the transaction to the in-memory state
2. NOT update the UI components
3. Display an inline error message in `#form-error`: *"Could not save transaction. Storage may be full or unavailable."*

```js
try {
  StorageManager.save(state.transactions);
  StateManager.add(transaction);
  Renderer.renderAll(state.transactions);
} catch (e) {
  showFormError("Could not save transaction. Storage may be full or unavailable.");
}
```

### Storage Unavailable on Load

When `localStorage.getItem` throws or returns `null`:
- Return an empty array
- Display a dismissible info banner: *"No saved data found. Start adding transactions!"*

### Corrupt Storage on Load

When the stored value cannot be parsed as JSON or does not conform to the Transaction schema:
- Call `localStorage.removeItem(STORAGE_KEY)` to clear the corrupt entry
- Initialize with an empty array
- Display a dismissible info banner: *"Saved data was unreadable and has been cleared."*

### Validation Errors

Each field has a specific error message:

| Condition | Message |
|---|---|
| Name empty | "Item name is required." |
| Name > 100 chars | "Item name must be 100 characters or fewer." |
| Amount empty | "Amount is required." |
| Amount not numeric | "Amount must be a number." |
| Amount out of range | "Amount must be between 0.01 and 999,999,999.99." |
| No category selected | "Please select a category." |

Only the first failing field's error is shown at a time (fail-fast validation).

---

## Testing Strategy

### Dual Testing Approach

Testing uses two complementary layers:

1. **Unit / example-based tests** — verify specific behaviors, edge cases, and error conditions with concrete inputs
2. **Property-based tests** — verify universal invariants across hundreds of randomly generated inputs

The property-based testing library for this project is **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript), which can be loaded via a CDN script tag in the test HTML harness or bundled for the test environment. It does not need to be included in the production `app.js`.

### Unit Tests

| Test | What it verifies |
|---|---|
| `Validator` rejects empty name | Req 1.3 |
| `Validator` rejects whitespace-only name | Req 1.3 |
| `Validator` rejects amount = 0 | Req 1.3 |
| `Validator` rejects amount = 1,000,000,000 | Req 1.3 |
| `Validator` rejects missing category | Req 1.3 |
| `Validator` accepts valid transaction | Req 1.3 |
| `renderBalanceDisplay` shows "$0.00" for empty list | Req 3.5 |
| `renderBalanceDisplay` formats "$12.50" correctly | Req 3.4 |
| `renderTransactionList` shows empty-state message | Req 2.5 |
| `renderPieChart` shows "No spending data" message | Req 4.6 |
| `renderPieChart` renders equal segments when total = 0 | Req 4.2 |
| `StorageManager.load` returns `[]` when key absent | Req 5.4 |
| `StorageManager.load` clears and returns `[]` on corrupt data | Req 5.5 |
| Delete removes correct transaction by id | Req 2.4 |

### Property-Based Tests

Each property test runs a minimum of **100 iterations**. Each test is tagged with a comment referencing the design property it validates.

**Tag format:** `// Feature: expense-budget-visualizer, Property {N}: {property_text}`

| Property | Test Description |
|---|---|
| Property 1 | Generate random valid transactions; add each; assert list grows by 1 and new item is first |
| Property 2 | Generate invalid inputs (whitespace names, out-of-range amounts, missing category); assert list unchanged |
| Property 3 | Generate list with ≥1 transaction; pick random id to delete; assert all others preserved in order |
| Property 4 | Generate random transaction lists; assert `computeBalance()` equals `amounts.reduce((s,t) => s+t.amount, 0)` formatted correctly |
| Property 5 | Generate random transaction arrays; serialize then deserialize; assert deep equality |
| Property 6 | Generate random transaction lists; assert `sum(categoryTotals) ≈ sum(amounts)` |
| Property 7 | Generate random non-empty transaction lists; assert `sum(proportions) ≈ 1.0` |
| Property 8 | Generate arbitrary strings as storage values; assert app initializes to empty state without throwing |

### Integration / Smoke Tests

| Test | What it verifies |
|---|---|
| App loads in Chrome, Firefox, Edge, Safari without JS errors | Req 6.1 |
| All four components render on initial load | Req 6.2 |
| Add + delete cycle completes within 100ms (measured via `performance.now`) | Req 6.3 |
| Layout reflows correctly at 599px viewport width | Req 7.4 |
| Tap targets ≥ 44×44px at 599px viewport | Req 7.5 |

### Test File Structure

```
tests/
├── unit/
│   ├── validator.test.js
│   ├── storage.test.js
│   ├── balance.test.js
│   ├── transaction-list.test.js
│   └── pie-chart.test.js
└── property/
    ├── transaction-add.property.js
    ├── transaction-delete.property.js
    ├── balance.property.js
    ├── storage-roundtrip.property.js
    ├── category-totals.property.js
    └── pie-proportions.property.js
```
