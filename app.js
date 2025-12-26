// ================= FIREBASE INIT =================
const firebaseConfig = {
  apiKey: "AIzaSyA3Ma9RS54N7nnnoSkmrp5kcjv_c-IN1eM",
  authDomain: "chill-thrive.firebaseapp.com",
  projectId: "chill-thrive",
  storageBucket: "chill-thrive.firebasestorage.app",
  messagingSenderId: "883272857594",
  appId: "1:883272857594:web:840ccf707e7f073c735643",
  measurementId: "G-CJP105Q5Z3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= BOOKING PAGE LOGIC =================
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {

  // Auto-fill service from URL (services → booking)
  const params = new URLSearchParams(window.location.search);
  const selectedService = params.get("service");
  if (selectedService) {
    document.getElementById("service").value = selectedService;
  }

  bookingForm.addEventListener("submit", function (e) {
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
        alert("Booking confirmed! You will receive confirmation shortly.");
        bookingForm.reset();
      })
      .catch(() => {
        alert("Error submitting booking.");
      });
  });
}

// ================= CONTACT PAGE LOGIC =================
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    db.collection("messages").add({
      name: this[0].value,
      email: this[1].value,
      message: this[2].value,
      createdAt: new Date()
    }).then(() => {
      alert("Message sent successfully!");
      contactForm.reset();
    });
  });
}
