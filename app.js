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

// ================= SLOT CAPACITY + REAL-TIME LOGIC =================
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");

if (dateInput && timeSelect) {

  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);

  const defaultSlots = [
    "07:00 – 10:00",
    "10:00 – 13:00",
    "15:00 – 18:00",
    "18:00 – 21:00"
  ];

  const slotTimings = {
    "07:00 – 10:00": 7,
    "10:00 – 13:00": 10,
    "15:00 – 18:00": 15,
    "18:00 – 21:00": 18
  };

  let renderToken = 0;

  dateInput.addEventListener("change", () => {
    const selectedDate = dateInput.value;
    if (!selectedDate) return;
    loadSlots(selectedDate);
  });

  function loadSlots(selectedDate) {
    renderToken++;
    const currentToken = renderToken;

    timeSelect.innerHTML = `<option value="">Select Time</option>`;
    dateInput.setCustomValidity("");

    const now = new Date();
    const isToday = selectedDate === now.toISOString().split("T")[0];

    // ✅ CASE 1: All slots passed today
    if (isToday) {
      const allPassed = defaultSlots.every(slot => now.getHours() >= slotTimings[slot]);

      if (allPassed) {
        timeSelect.innerHTML = `<option value="unavailable" disabled>No slots available</option>`;
        dateInput.setCustomValidity("All time slots for today have already passed.");
        dateInput.reportValidity();
        return;
      }
    }

    let availableCount = 0;
    let processedSlots = 0;

    defaultSlots.forEach(slot => {
      const slotHour = slotTimings[slot];

      if (isToday && now.getHours() >= slotHour) return;

      const docId = `${selectedDate}_${slot}`;

      db.collection("timeSlots").doc(docId).get().then(doc => {

        if (currentToken !== renderToken) return;

        processedSlots++;

        let capacity = 5;
        let booked = 0;

        if (doc.exists) {
          capacity = doc.data().capacity;
          booked = doc.data().booked;
        }

        if (booked < capacity) {
          availableCount++;

          const option = document.createElement("option");
          option.value = slot;
          option.textContent = `${slot} (${capacity - booked} slots left)`;
          timeSelect.appendChild(option);
        }

        // ✅ CASE 2: All slots full (future or today)
        if (processedSlots === defaultSlots.length && availableCount === 0) {
          timeSelect.innerHTML = `<option value="unavailable" disabled>No slots available</option>`;
          dateInput.setCustomValidity("No slots available on this date.");
          dateInput.reportValidity();
        }

        if (availableCount > 0) {
          dateInput.setCustomValidity("");
        }

      });
    });
  }
}

// ================= BOOKING PAGE LOGIC =================
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
  // ===== Auto-select service & duration from URL =====
const params = new URLSearchParams(window.location.search);

const serviceParam = params.get("service");
const durationParam = params.get("duration");

const serviceSelect = document.getElementById("service");
const durationSelect = document.getElementById("duration");

if (serviceSelect && serviceParam) {
  serviceSelect.value = serviceParam;
}

if (durationSelect && durationParam) {
  durationSelect.value = durationParam;
}

// ===== Show duration only for Ice Bath Therapy =====
if (serviceSelect && durationSelect) {

  function toggleDuration() {
  if (serviceSelect.value === "Ice Bath Therapy") {
    durationSelect.parentElement.style.display = "block";
    durationSelect.required = true;
  } else {
    durationSelect.parentElement.style.display = "none";
    durationSelect.required = false;
    durationSelect.value = "";
  }
}

  toggleDuration(); // on page load
  serviceSelect.addEventListener("change", toggleDuration);
}

  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Stop page reload

    console.log("Processing booking..."); // Debugging check

    // FIX: select elements explicitly using document.getElementById
    const bookingData = {
      service: document.getElementById("service").value,
      duration: document.getElementById("duration") ? document.getElementById("duration").value : "",
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

  const selectedDate = document.getElementById("date").value;
  const selectedTime = document.getElementById("time").value;

  const slotId = `${selectedDate}_${selectedTime}`;

  db.collection("timeSlots").doc(slotId).set({
    date: selectedDate,
    time: selectedTime,
    capacity: 5,
    booked: firebase.firestore.FieldValue.increment(1)
  }, { merge: true });

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
      phone: document.getElementById("contact-phone") ? document.getElementById("contact-phone").value : this[1].value,
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

// ================= TESTIMONIALS LOGIC =================
const textContainer = document.getElementById("textTestimonials");
const videoContainer = document.getElementById("videoTestimonials");

if (textContainer || videoContainer) {
  db.collection("testimonials")
    .where("visible", "==", true)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();

        if (data.type === "text" && textContainer) {
          textContainer.innerHTML += `
            <div class="card">
              <p>"${data.feedback}"</p>
              <strong>${data.name}</strong><br>
              ⭐ ${data.rating}/5
            </div>
          `;
        }

        if (data.type === "video" && videoContainer) {
          videoContainer.innerHTML += `
            <div class="card video-card" onclick="this.innerHTML='<iframe width=100% height=200 src=${data.videoUrl} frameborder=0 allowfullscreen></iframe>'">
              <img src="${data.thumbnail}" alt="Video testimonial thumbnail">
              <div class="play-btn">▶</div>
              <strong>${data.name}</strong>
            </div>
          `;
        }

      });
    });
}

// ================= GALLERY & EVENTS LOGIC =================
document.addEventListener("DOMContentLoaded", () => {

  const galleryGrid = document.getElementById("galleryGrid");
  const eventsGrid = document.getElementById("eventsGrid");

  if (!galleryGrid && !eventsGrid) return;

  db.collection("events")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      if (galleryGrid) galleryGrid.innerHTML = "";
      if (eventsGrid) eventsGrid.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();

        // ----- PHOTO GALLERY -----
        if (galleryGrid && ["session","bts"].includes(data.category)) {
          const img = document.createElement("img");
          img.src = data.image;
          img.alt = data.title;
          galleryGrid.appendChild(img);
        }

        // ----- EVENTS SECTION -----
        if (eventsGrid && ["event","workshop"].includes(data.category)) {
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
            <img src="${data.image}" alt="${data.title}">
            <h3>${data.title}</h3>
            <p>${data.description}</p>
            <p><strong>Date:</strong> ${data.date || "Coming Soon"}</p>
          `;
          eventsGrid.appendChild(card);
        }
      });
    });
});

// ================= SERVICES MANAGEMENT =================
const servicesContainer = document.getElementById("servicesContainer");
const comboContainer = document.getElementById("comboContainer");

// ----- Load Services -----
db.collection("services").where("active","==",true).onSnapshot(snapshot => {
  if (!servicesContainer) return;
  servicesContainer.innerHTML = "";

  snapshot.forEach(doc => {
    const s = doc.data();

    const card = document.createElement("div");
    card.className = "card service-card";

    let durationHTML = "";
    s.durations.forEach(d => {
      durationHTML += `
        <a href="booking.html?service=${encodeURIComponent(s.name)}&duration=${d.minutes}"
           class="pricing-tier link-tier">
          <span>${d.minutes} Minutes</span>
          <strong>₹${d.price}</strong>
        </a>
      `;
    });

    card.innerHTML = `
      <img src="${s.media}" class="service-media">
      <h3>${s.name}</h3>
      <p>${s.description}</p>

      <h4>Benefits</h4>
      <ul>${s.benefits.map(b=>`<li>${b}</li>`).join("")}</ul>

      <h4>Duration & Pricing</h4>
      ${durationHTML}

      <a href="booking.html?service=${encodeURIComponent(s.name)}" class="btn">Book Now</a>
    `;

    servicesContainer.appendChild(card);
  });
});

// ----- Load Combos -----
db.collection("combos").where("active","==",true).onSnapshot(async snapshot => {
  if (!comboContainer) return;
  comboContainer.innerHTML = "";

  for (const doc of snapshot.docs) {
    const c = doc.data();

    const discount = await getComboDiscount(c.originalPrice);

    const card = document.createElement("div");
    card.className = "card combo-card";

    card.innerHTML = `
      ${c.badge ? `<span class="badge">${c.badge}</span>` : ""}
      <h3>${c.name}</h3>
      <p>${c.description}</p>
      <p><strong>Time:</strong> ${c.time} minutes</p>

      <p class="price">
        <del>₹${c.originalPrice}</del>
        <strong>₹${discount.discountedPrice}</strong>
        ${discount.discountPercent > 0 ? `<span class="discount-tag">${discount.discountPercent}% OFF</span>` : ""}

      <a href="booking.html?service=${encodeURIComponent(c.name)}" class="btn">Book Now</a>
    `;

    comboContainer.appendChild(card);
  }
});

// ================= DISCOUNT ENGINE (FIXED) =================
async function getComboDiscount(originalPrice, promoCode = null) {

  let appliedDiscount = {
    percent: 0,
    type: null
  };

  const nowHour = new Date().getHours();

  const snapshot = await db.collection("discounts")
    .where("active", "==", true)
    .get();

  snapshot.forEach(doc => {
    const d = doc.data();

    // 🎟 PROMO CODE (highest priority)
    if (
      d.type === "promo" &&
      promoCode &&
      d.code === promoCode
    ) {
      appliedDiscount = {
        percent: d.percent,
        type: "promo"
      };
    }

    // ⏰ TIME-BASED (only if promo not applied)
    if (
      d.type === "time" &&
      appliedDiscount.type !== "promo" &&
      nowHour >= d.startHour &&
      nowHour < d.endHour
    ) {
      appliedDiscount = {
        percent: d.percent,
        type: "time"
      };
    }

    // 🤖 AUTO (only if nothing else applied)
    if (
      d.type === "auto" &&
      appliedDiscount.type === null &&
      d.target === "combo"
    ) {
      appliedDiscount = {
        percent: d.percent,
        type: "auto"
      };
    }
  });

  const discountedPrice = Math.round(
    originalPrice - (originalPrice * appliedDiscount.percent / 100)
  );

  return {
    discountedPrice,
    discountPercent: appliedDiscount.percent,
    discountType: appliedDiscount.type
  };
}
