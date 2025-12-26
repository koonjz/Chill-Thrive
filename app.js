// ================= FIREBASE INIT =================
const firebaseConfig = {
  apiKey: "AIzaSyA3Ma9RS54N7nnnoSkmrp5kcjv_c-IN1eM",
  authDomain: "chill-thrive.firebaseapp.com",
  projectId: "chill-thrive",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ================= BOOKING PAGE LOGIC =================
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
  // Auto-fill service from URL
  const params = new URLSearchParams(window.location.search);
  const selectedService = params.get("service");
  if (selectedService) {
    const serviceSelect = document.getElementById("service");
    if(serviceSelect) serviceSelect.value = selectedService;
  }

  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Stop page reload

    console.log("Processing booking..."); // Debugging check

    // FIX: select elements explicitly using document.getElementById
    const bookingData = {
      service: document.getElementById("service").value,
      date: document.getElementById("date").value,
      time: document.getElementById("time").value,
      name: document.getElementById("name").value, 
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp() // Better timestamp format
    };

    console.log("Sending data:", bookingData);

    db.collection("bookings").add(bookingData)
      .then(() => {
        alert("Booking confirmed! You will receive confirmation shortly.");
        bookingForm.reset();
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error submitting booking: " + error.message);
      });
  });
}

// ================= CONTACT PAGE LOGIC =================
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    
    // It is safer to use IDs here too, but your array method might work if order never changes
    db.collection("messages").add({
      name: document.getElementById("contact-name") ? document.getElementById("contact-name").value : this[0].value,
      email: document.getElementById("contact-email") ? document.getElementById("contact-email").value : this[1].value,
      message: document.getElementById("contact-msg") ? document.getElementById("contact-msg").value : this[2].value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      alert("Message sent successfully!");
      contactForm.reset();
    }).catch((error) => {
      console.error("Error sending message:", error);
      alert("Error: " + error.message);
    });
  });
}
