# Requirements Document

## Introduction

The Expense and Budget Visualizer is a client-side web application that allows users to track personal expenses by entering transactions with a name, amount, and category. The app displays a running total balance, a scrollable transaction list with delete capability, and a live pie chart showing spending distribution by category. All data is persisted in the browser's Local Storage with no backend required. The application is built with HTML, CSS, and Vanilla JavaScript, and is compatible with modern browsers.

## Glossary

- **App**: The Expense and Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an item name, a monetary amount, and a category.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Input_Form**: The HTML form component used to enter new transaction data.
- **Balance_Display**: The UI component at the top of the page that shows the current total balance.
- **Pie_Chart**: The visual chart component that displays spending distribution by category.
- **Storage**: The browser's Local Storage API used to persist transaction data client-side.
- **Category**: A classification label for a transaction. Valid values are: Food, Transport, Fun.
- **Validator**: The client-side logic responsible for checking that all required form fields are filled before submission.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter expense details through a form, so that I can record my spending transactions.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name (maximum 100 characters), a numeric field for the amount, and a dropdown selector for the category (Food, Transport, Fun).
2. WHEN the user submits the Input_Form with all fields filled, THE App SHALL add the transaction to the Transaction_List and persist it to Storage.
3. WHEN the user submits the Input_Form, THE Validator SHALL verify that the item name field is not empty (and does not exceed 100 characters), the amount field contains a numeric value between 0.01 and 999,999,999.99, and a category is selected.
4. IF the Validator detects that any required field is empty or invalid, THEN THE Input_Form SHALL display an inline error message identifying the missing or invalid field and SHALL NOT add the transaction.
5. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields: the item name field to empty, the amount field to empty, and the category selector to its unselected placeholder state.
6. IF Storage is unavailable or returns an error when the App attempts to persist a transaction, THEN THE App SHALL display an inline error message informing the user that the transaction could not be saved and SHALL NOT add the transaction to the Transaction_List.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my recorded transactions in a list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions, each showing the item name, formatted amount (two decimal places with currency symbol), category, and the date the transaction was added.
2. WHILE transactions exist in Storage, THE Transaction_List SHALL remain scrollable to accommodate any number of entries.
3. THE Transaction_List SHALL display transactions in the order they were added, with the most recent entry appearing at the top.
4. WHEN the user clicks the delete control on a transaction entry, THE App SHALL remove that transaction from the Transaction_List and from Storage, and the remaining transactions SHALL remain unchanged and in their original order.
5. WHEN the Transaction_List contains zero transactions, THE App SHALL display an empty-state message indicating that no transactions have been recorded.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts currently stored in Storage.
2. WHEN a new transaction is added, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
3. WHEN a transaction is deleted, THE Balance_Display SHALL update to reflect the revised total without requiring a page reload.
4. THE Balance_Display SHALL format the total amount as a numeric value with two decimal places preceded by the "$" currency symbol (e.g., "$12.50").
5. WHEN Storage contains no transactions, THE Balance_Display SHALL show "$0.00".

---

### Requirement 4: Spending Distribution Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Pie_Chart SHALL display the proportion of total spending for each category (Food, Transport, Fun) based on the transactions currently in Storage.
2. WHEN total spending is zero, THE Pie_Chart SHALL display all category proportions as 0.0 and show an equal-segment placeholder.
3. WHEN a new transaction is added, THE Pie_Chart SHALL update to reflect the new spending distribution within 1 second and without requiring a page reload.
4. WHEN a transaction is deleted, THE Pie_Chart SHALL update to reflect the revised spending distribution within 1 second and without requiring a page reload.
5. THE Pie_Chart SHALL render each category segment in a unique color (no two segments share the same color) and SHALL display a legend that identifies each category by name and its percentage of total spending.
6. WHEN no transactions exist, THE Pie_Chart SHALL display the message "No spending data to display" in place of the chart.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL serialize the transaction data and write it to Storage under a single, fixed application-defined key that remains the same across all sessions.
2. WHEN the App is loaded or reloaded, THE App SHALL read all transactions from Storage and render them in the Transaction_List, Balance_Display, and Pie_Chart.
3. WHEN a transaction is deleted, THE App SHALL update the Storage entry to remove only the deleted transaction, preserving all remaining transactions.
4. IF Storage is unavailable or contains no stored data on load, THEN THE App SHALL initialize with an empty transaction list and display an informational message that does not prevent the user from interacting with the App.
5. IF Storage contains data that cannot be parsed on load, THEN THE App SHALL discard the corrupted Storage entry, initialize with an empty transaction list, and display an informational message that does not prevent the user from interacting with the App.

---

### Requirement 6: Browser Compatibility and Performance

**User Story:** As a user, I want the app to work reliably across modern browsers with fast, responsive interactions, so that I can use it on any device without friction.

#### Acceptance Criteria

1. THE App SHALL function correctly in the current stable versions of Chrome, Firefox, Edge, and Safari, meaning all four named components (Input_Form, Balance_Display, Transaction_List, Pie_Chart) render, accept input, and respond to user interactions without JavaScript errors.
2. WHEN the App is loaded for the first time on a connection of at least 25 Mbps, THE App SHALL render the Input_Form, Balance_Display, Transaction_List, and Pie_Chart within 2 seconds.
3. WHEN the user adds or deletes a transaction, THE App SHALL update the Balance_Display, Transaction_List, and Pie_Chart within 100 milliseconds.
4. THE App SHALL be structured with a single CSS file in the `css/` directory and a single JavaScript file in the `js/` directory; no additional CSS or JS files shall be loaded from the local file system.
5. WHERE the App is used as a browser extension, THE App SHALL operate using only client-side APIs (as defined in Requirements 1–5) and SHALL NOT make any external network requests for core functionality.

---

### Requirement 7: Visual Design and Usability

**User Story:** As a user, I want a clean, readable interface with clear visual hierarchy, so that I can use the app intuitively without any setup or instructions.

#### Acceptance Criteria

1. THE App SHALL apply a typographic scale in which heading text is at least 1.25× the size of body text, with a minimum body font size of 14px.
2. THE App SHALL use visual grouping — with at least 16px of spacing or a visible border or a distinct background — between each of the Input_Form, Balance_Display, Transaction_List, and Pie_Chart sections.
3. THE App SHALL provide sufficient color contrast between text and background colors to meet WCAG 2.1 AA contrast ratio requirements (minimum 4.5:1 for normal text).
4. WHEN the App is viewed on a viewport narrower than 600px, THE App SHALL reflow its layout so that all sections are displayed without horizontal scrolling and all text remains at or above the minimum body font size of 14px.
5. WHEN the App is viewed on a viewport narrower than 600px, THE App SHALL render all interactive elements (buttons, inputs, and dropdowns) with a minimum tap target size of 44×44px.
