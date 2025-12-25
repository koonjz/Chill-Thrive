// Firebase config (replace with your own)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Handle booking
document.getElementById("bookingForm").addEventListener("submit", function(e){
  e.preventDefault();

  const bookingData = {
    service: service.value,
    date: date.value,
    time: time.value,
    name: name.value,
    phone: phone.value,
    email: email.value,
    createdAt: new Date()
  };

  db.collection("bookings").add(bookingData)
    .then(() => {
      alert("Booking Confirmed! Confirmation will be sent via email.");
      document.getElementById("bookingForm").reset();
    })
    .catch(() => {
      alert("Error. Try again.");
    });
});
