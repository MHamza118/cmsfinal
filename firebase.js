
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmVkS1JM0-fu1cXGRCqrxZ0J1gOiK5SkY",
  authDomain: "fspro-c4de5.firebaseapp.com",
  databaseURL: "https://fspro-c4de5-default-rtdb.firebaseio.com",
  projectId: "fspro-c4de5",
  storageBucket: "fspro-c4de5.firebasestorage.app",
  messagingSenderId: "64912892208",
  appId: "1:64912892208:web:238c0401f701d2118128f5",
  measurementId: "G-72DC4PW8YF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Firebase data handlers
function saveToFirebase(path, data) {
  return database.ref(path).set(data);
}

function updateFirebaseData(path, data) {
  return database.ref(path).update(data);
}

function getFirebaseData(path, callback) {
  database.ref(path).once('value', (snapshot) => {
    callback(snapshot.val());
  });
}

function listenForChanges(path, callback) {
  database.ref(path).on('value', (snapshot) => {
    callback(snapshot.val());
  });
}

// Data helpers that replace localStorage functionality
function saveData(key, data) {
  // Save to Firebase
  saveToFirebase(key, data);
  
  // Still save to localStorage as backup
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

function getData(key, callback) {
  // Try to get from Firebase first
  getFirebaseData(key, (firebaseData) => {
    if (firebaseData) {
      callback(firebaseData);
      
      // Update localStorage with the latest data
      try {
        localStorage.setItem(key, JSON.stringify(firebaseData));
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
    } else {
      // Fallback to localStorage if Firebase data not available
      try {
        const localData = JSON.parse(localStorage.getItem(key)) || null;
        callback(localData);
        
        // If we have local data but not Firebase data, update Firebase
        if (localData) {
          saveToFirebase(key, localData);
        }
      } catch (e) {
        console.error('Error fetching from localStorage:', e);
        callback(null);
      }
    }
  });
}

// Setup initial data listeners
function setupDataListeners() {
  // Listen for changes to important data
  listenForChanges('users', (users) => {
    if (users) localStorage.setItem('users', JSON.stringify(users));
  });
  
  listenForChanges('attendanceRecords', (records) => {
    if (records) localStorage.setItem('attendanceRecords', JSON.stringify(records));
  });
  
  listenForChanges('lateCheckIns', (records) => {
    if (records) localStorage.setItem('lateCheckIns', JSON.stringify(records));
  });
  
  listenForChanges('missedCheckIns', (records) => {
    if (records) localStorage.setItem('missedCheckIns', JSON.stringify(records));
  });
  
  listenForChanges('holidayRequests', (requests) => {
    if (requests) localStorage.setItem('holidayRequests', JSON.stringify(requests));
  });
  
  listenForChanges('progressReports', (reports) => {
    if (reports) localStorage.setItem('progressReports', JSON.stringify(reports));
  });
  
  listenForChanges('timeTables', (tables) => {
    if (tables) localStorage.setItem('timeTables', JSON.stringify(tables));
  });
  
  listenForChanges('employeeTasks', (tasks) => {
    if (tasks) localStorage.setItem('employeeTasks', JSON.stringify(tasks));
  });
  
  listenForChanges('notifications', (notifications) => {
    if (notifications) localStorage.setItem('notifications', JSON.stringify(notifications));
  });
}

// Call this on application start
window.addEventListener('load', setupDataListeners);
