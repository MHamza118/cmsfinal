
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

// Firebase localStorage replacement functions
function firebaseSetItem(key, value) {
  return saveToFirebase(key, value);
}

function firebaseGetItem(key, callback) {
  getFirebaseData(key, callback);
}

// Helper function to synchronize localStorage with Firebase for backward compatibility
function syncToFirebase() {
  // Users
  const savedUsers = localStorage.getItem('users');
  if (savedUsers) {
    saveToFirebase('users', JSON.parse(savedUsers));
  }
  
  // Attendance Records
  const attendanceRecords = localStorage.getItem('attendanceRecords');
  if (attendanceRecords) {
    saveToFirebase('attendanceRecords', JSON.parse(attendanceRecords));
  }
  
  // Late Check-ins
  const lateCheckIns = localStorage.getItem('lateCheckIns');
  if (lateCheckIns) {
    saveToFirebase('lateCheckIns', JSON.parse(lateCheckIns));
  }
  
  // Progress Reports
  const progressReports = localStorage.getItem('progressReports');
  if (progressReports) {
    saveToFirebase('progressReports', JSON.parse(progressReports));
  }
  
  // Holiday Requests
  const holidayRequests = localStorage.getItem('holidayRequests');
  if (holidayRequests) {
    saveToFirebase('holidayRequests', JSON.parse(holidayRequests));
  }
  
  // Time Tables
  const timeTables = localStorage.getItem('timeTables');
  if (timeTables) {
    saveToFirebase('timeTables', JSON.parse(timeTables));
  }
  
  // Missed Check-ins
  const missedCheckIns = localStorage.getItem('missedCheckIns');
  if (missedCheckIns) {
    saveToFirebase('missedCheckIns', JSON.parse(missedCheckIns));
  }
  
  // Notifications
  const notifications = localStorage.getItem('notifications');
  if (notifications) {
    saveToFirebase('notifications', JSON.parse(notifications));
  }
  
  // Employee Tasks
  const employeeTasks = localStorage.getItem('employeeTasks');
  if (employeeTasks) {
    saveToFirebase('employeeTasks', JSON.parse(employeeTasks));
  }
}

// Replace localStorage functions
const fbStorage = {
  setItem: function(key, value) {
    // Store in Firebase
    saveToFirebase(key, typeof value === 'string' ? value : JSON.parse(value));
    // Keep localStorage as backup
    localStorage.setItem(key, value);
  },
  
  getItem: function(key, callback) {
    getFirebaseData(key, (data) => {
      if (callback) {
        callback(data);
      }
      // Keep localStorage updated
      if (data !== null) {
        localStorage.setItem(key, JSON.stringify(data));
      }
      return data;
    });
    // Return from localStorage as fallback
    return localStorage.getItem(key);
  },
  
  removeItem: function(key) {
    database.ref(key).remove();
    localStorage.removeItem(key);
  }
};

// Run sync on page load
window.addEventListener('load', () => {
  syncToFirebase();
});
