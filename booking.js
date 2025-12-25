// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA3Ma9RS54N7nnnoSkmrp5kcjv_c-IN1eM",
  authDomain: "chill-thrive.firebaseapp.com",
  projectId: "chill-thrive",
  storageBucket: "chill-thrive.firebasestorage.app",
  messagingSenderId: "883272857594",
  appId: "1:883272857594:web:840ccf707e7f073c735643",
  measurementId: "G-CJP105Q5Z3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Form submit
document.getElementById("bookingForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const bookingData = {
    service: document.getElementById("service").value,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("bookings").add(bookingData)
    .then(() => {
      alert("Booking Confirmed!");
      document.getElementById("bookingForm").reset();
    })
    .catch((error) => {
      console.error(error);
      alert("Error. Try again.");
    });
});
