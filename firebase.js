
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
