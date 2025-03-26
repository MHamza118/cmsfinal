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
  database.ref(path).once('value')
    .then((snapshot) => {
      callback(snapshot.val());
    })
    .catch((error) => {
      console.error(`Error fetching data from ${path}:`, error);
      callback(null);
    });
}

function listenForChanges(path, callback) {
  const ref = database.ref(path);
  ref.on('value', 
    (snapshot) => {
      callback(snapshot.val());
    },
    (error) => {
      console.error(`Error listening to ${path}:`, error);
    }
  );
  return ref; // Return ref for cleanup
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

// Setup initial data listeners and sync
function setupDataListeners() {
  // Get initial data from Firebase and update localStorage
  const dataKeys = [
    'users', 
    'attendanceRecords', 
    'lateCheckIns', 
    'missedCheckIns',
    'holidayRequests', 
    'progressReports', 
    'timeTables',
    'employeeTasks',
    'notifications'
  ];

  // First load all data from Firebase
  dataKeys.forEach(key => {
    getFirebaseData(key, (firebaseData) => {
      if (firebaseData) {
        // Update localStorage with firebase data
        localStorage.setItem(key, JSON.stringify(firebaseData));

        // Update global variables if needed
        if (key === 'users' && typeof window.users !== 'undefined') {
          window.users = Object.assign({}, window.users, firebaseData);
        }
      } else {
        // If no Firebase data, check if we have local data to upload
        const localData = JSON.parse(localStorage.getItem(key));
        if (localData) {
          // Upload local data to Firebase
          saveToFirebase(key, localData);
        }
      }
    });
  });

  // Then set up listeners for real-time updates
  listenForChanges('users', (users) => {
    if (users) {
      localStorage.setItem('users', JSON.stringify(users));
      // Update global variable
      if (typeof window.users !== 'undefined') {
        window.users = Object.assign({}, window.users, users);
      }
    }
  });

  listenForChanges('attendanceRecords', (records) => {
    if (records) localStorage.setItem('attendanceRecords', JSON.stringify(records));
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

// Add listener for late check-ins
listenForChanges('lateCheckIns', (lateCheckIns) => {
    if (lateCheckIns) {
        localStorage.setItem('lateCheckIns', JSON.stringify(lateCheckIns));
        // Refresh the attendance table if it's visible
        if (document.getElementById('attendanceTable')) {
            loadAttendanceTable();
        }
    }
});

// Call this on application start
window.addEventListener('load', setupDataListeners);