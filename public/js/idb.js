// Database global variable
let db;

// Open IndexedDB connection called 'budget-tracker'
const request = indexedDB.open('budget-tracker', 1);

// If database version changes, update
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore('transaction', {autoIncrement: true});
};

// If database connects successfully upload saved data
request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadBudget();
  }
};

// If database connection fails, console log error
request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// Save budget transactions to indexedDB
function saveRecord(record) {
  const transaction = db.transaction(['transaction'], 'readwrite');

  const transactionObjectStore = transaction.objectStore('transaction');

  transactionObjectStore.add(record);
}

// Send data saved in IndexedDB to server
function uploadBudget() {
  const transaction = db.transaction(['transaction'], 'readwrite');

  const transactionObjectStore = transaction.objectStore('transaction');

  const getAll = transactionObjectStore.getAll();

  // Send transaction fetch request
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['transaction'], 'readwrite');

          const transactionObjectStore = transaction.objectStore('transaction');

          transactionObjectStore.clear();

          console.log('Saved transactions have been submitted.');
        })
        .catch(err => console.log(err));
    }
  };
}

// Online connection listener
window.addEventListener('online', uploadBudget);
