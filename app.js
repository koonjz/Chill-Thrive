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

// ================= RESCHEDULE SLOT CAPACITY + REAL-TIME LOGIC =================
function setupRescheduleSlotLogic() {

  const newDateInput = document.getElementById("newDate");
  const newTimeSelect = document.getElementById("newTime");

  if (!newDateInput || !newTimeSelect) return;

  const today = new Date().toISOString().split("T")[0];
  newDateInput.min = today;

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

  let token = 0;

  newDateInput.onchange = () => {
    loadRescheduleSlots(newDateInput.value);
  };

  function loadRescheduleSlots(selectedDate) {
    if (!selectedDate) return;

    token++;
    const current = token;

    newTimeSelect.innerHTML = `<option value="">Select Time</option>`;
    newDateInput.setCustomValidity("");

    const now = new Date();
    const isToday = selectedDate === today;

    if (isToday) {
      const allPassed = defaultSlots.every(
        s => now.getHours() >= slotTimings[s]
      );

      if (allPassed) {
        newTimeSelect.innerHTML =
          `<option disabled>No slots available</option>`;
        newDateInput.setCustomValidity(
          "All time slots for today have already passed."
        );
        newDateInput.reportValidity();
        return;
      }
    }

    let available = 0;
    let processed = 0;

    defaultSlots.forEach(slot => {

      if (isToday && now.getHours() >= slotTimings[slot]) return;

      db.collection("timeSlots")
        .doc(`${selectedDate}_${slot}`)
        .get()
        .then(doc => {

          if (current !== token) return;
          processed++;

          let capacity = 5;
          let booked = 0;

          if (doc.exists) {
            capacity = doc.data().capacity;
            booked = doc.data().booked;
          }

          if (booked < capacity) {
            available++;
            const opt = document.createElement("option");
            opt.value = slot;
            opt.textContent = `${slot} (${capacity - booked} slots left)`;
            newTimeSelect.appendChild(opt);
          }

          if (processed === defaultSlots.length && available === 0) {
            newTimeSelect.innerHTML =
              `<option disabled>No slots available</option>`;
            newDateInput.setCustomValidity(
              "No slots available on this date."
            );
            newDateInput.reportValidity();
          }
        });
    });
  }
}

// ================= BOOKING PAGE LOGIC (USER) =================
const bookingForm = document.getElementById("bookingForm");
const manageForm = document.getElementById("manageForm");

if (manageForm) {
  manageForm.addEventListener("submit", e => {
    e.preventDefault(); // ⛔ stop page refresh
  });
}

if (bookingForm) {

  const params = new URLSearchParams(window.location.search);
  const serviceSelect = document.getElementById("service");
  const durationSelect = document.getElementById("duration");

  if (params.get("service")) serviceSelect.value = params.get("service");
  if (params.get("duration")) durationSelect.value = params.get("duration");

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

  toggleDuration();
  serviceSelect.addEventListener("change", toggleDuration);

  bookingForm.addEventListener("submit", async e => {
  e.preventDefault();

  const bookingData = {
    service: serviceSelect.value,
    duration: durationSelect?.value || "",
    date: dateInput.value,
    time: timeSelect.value,

    customer: {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value
    },

    status: "confirmed",
    paymentStatus: "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!bookingData.date || !bookingData.time) {
    alert("Please select date and time");
    return;
  }

  const slotId = `${bookingData.date}_${bookingData.time}`;

  await db.collection("bookings").add(bookingData);

  await db.collection("timeSlots").doc(slotId).set({
    booked: firebase.firestore.FieldValue.increment(1),
    capacity: 5
  }, { merge: true });

  alert("Booking confirmed!");
  bookingForm.reset();
});
}

// ================= ADMIN BOOKING MANAGEMENT =================
const adminBookingsContainer = document.getElementById("adminBookings");

if (adminBookingsContainer) {
  db.collection("bookings")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      adminBookingsContainer.innerHTML = "";

      snapshot.forEach(doc => {
        const b = doc.data();

        adminBookingsContainer.innerHTML += `
          <div class="card">
            <p><strong>${b.service}</strong></p>
            <p>${b.date} | ${b.time}</p>
            <p>${b.customer.name} (${b.customer.phone})</p>
            <p>Status: ${b.status}</p>

            <button onclick="cancelBooking('${doc.id}','${b.date}','${b.time}')">
              Cancel
            </button>
          </div>
        `;
      });
    });
}

function cancelBooking(bookingId, date, time) {

  db.collection("bookings").doc(bookingId).update({
    status: "cancelled",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  const slotId = `${date}_${time}`;

  db.collection("timeSlots").doc(slotId).update({
    booked: firebase.firestore.FieldValue.increment(-1)
  });

  alert("Booking cancelled");
}

function rescheduleBooking(bookingId, oldDate, oldTime, newDate, newTime) {

  db.collection("timeSlots").doc(`${oldDate}_${oldTime}`).update({
    booked: firebase.firestore.FieldValue.increment(-1)
  });

  db.collection("timeSlots").doc(`${newDate}_${newTime}`).set({
    date: newDate,
    time: newTime,
    capacity: 5,
    booked: firebase.firestore.FieldValue.increment(1)
  }, { merge: true });

  db.collection("bookings").doc(bookingId).update({
    date: newDate,
    time: newTime,
    status: "rescheduled",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("Booking rescheduled");
}

// ================= CONTACT PAGE LOGIC (FIXED) =================
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      await db.collection("messages").add({
        name: document.getElementById("contact-name").value,
        phone: document.getElementById("contact-phone").value,
        message: document.getElementById("contact-msg").value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Message sent successfully!");
      contactForm.reset();

    } catch (err) {
      console.error("Firestore error:", err);
      alert("Failed to send message");
    }
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
db.collection("services")
  .where("active","==",true)
  .orderBy("order")
  .onSnapshot(snapshot => {

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

async function renderCombos() {
  if (!comboContainer) return;

  comboContainer.innerHTML = "";

  const snapshot = await db.collection("combos")
  .where("active","==",true)
  .orderBy("order")
  .get();

  for (const doc of snapshot.docs) {
    const c = doc.data();
    let finalPrice = c.originalPrice;
let discountPercent = 0;

if (c.discountType === "fixed" && c.fixedDiscount) {
  finalPrice = c.originalPrice - c.fixedDiscount;
}

if (c.discountType === "percent") {
  const d = await getComboDiscount(c.originalPrice, activePromoCode);
  finalPrice = d.discountedPrice;
  discountPercent = d.discountPercent;
}

    const card = document.createElement("div");
    card.className = "card combo-card";

    card.innerHTML = `
      ${c.badge ? `<span class="badge">${c.badge}</span>` : ""}
      <h3>${c.name}</h3>
      <p>${c.description}</p>
      <p><strong>Time:</strong> ${c.time} minutes</p>

      <p class="price">
  <del>₹${c.originalPrice}</del>
  <strong>₹${finalPrice}</strong>

  ${discountPercent
    ? `<span class="discount-tag">${discountPercent}% OFF</span>`
    : ""}

  ${c.discountType === "fixed"
    ? `<span class="discount-tag">₹${c.fixedDiscount} OFF</span>`
    : ""}
</p>

      <a href="booking.html?service=${encodeURIComponent(c.name)}" class="btn">Book Now</a>
    `;

    comboContainer.appendChild(card);
  }
}

// Initial load
renderCombos();

// ================= DISCOUNT ENGINE (FIXED) =================
async function getComboDiscount(originalPrice, promoCode = null) {

  let applied = { percent: 0, type: null };
  const hour = new Date().getHours();

  const snap = await db.collection("discounts")
    .where("active","==",true)
    .get();

  snap.forEach(doc => {
    const d = doc.data();

    if (d.type === "promo" && promoCode && d.code === promoCode) {
      applied = { percent: d.percent, type: "promo" };
    }

    else if (
      d.type === "time" &&
      applied.type !== "promo" &&
      hour >= d.startHour &&
      hour < d.endHour
    ) {
      applied = { percent: d.percent, type: "time" };
    }

    else if (
      d.type === "auto" &&
      applied.type === null &&
      d.target === "combo"
    ) {
      applied = { percent: d.percent, type: "auto" };
    }
  });

  return {
    discountedPrice: Math.round(originalPrice * (1 - applied.percent / 100)),
    discountPercent: applied.percent
  };
}

// ================= PROMO UI LOGIC =================
const promoInput = document.getElementById("promoInput");
const applyPromoBtn = document.getElementById("applyPromo");
const promoMsg = document.getElementById("promoMsg");

let activePromoCode = null;

if (applyPromoBtn) {
  applyPromoBtn.addEventListener("click", async () => {
    const code = promoInput.value.trim().toUpperCase();
    if (!code) return;

    const snap = await db.collection("discounts")
      .where("type","==","promo")
      .where("active","==",true)
      .where("code","==",code)
      .get();

    if (snap.empty) {
      promoMsg.textContent = "Invalid promo code";
      promoMsg.style.color = "red";
      activePromoCode = null;
      renderCombos(); // reset prices
      return;
    }

    activePromoCode = code;
    promoMsg.textContent = "Promo applied successfully!";
    promoMsg.style.color = "green";
    renderCombos();
  });
}

// ================= USER BOOKING MANAGEMENT =================
const lookupBtn = document.getElementById("lookupBooking");
const userBookings = document.getElementById("userBookings");

if (lookupBtn) {
  lookupBtn.addEventListener("click", async () => {

    const phone = document.getElementById("lookupPhone").value;
    const email = document.getElementById("lookupEmail").value;

    userBookings.innerHTML = "";

    const snap = await db.collection("bookings")
      .where("customer.phone", "==", phone)
      .where("customer.email", "==", email)
      .get();

    if (snap.empty) {
      userBookings.innerHTML = "<p>No bookings found.</p>";
      return;
    }

    snap.forEach(doc => {
      const b = doc.data();

      userBookings.innerHTML += `
        <div class="card">
          <p><strong>${b.service}</strong></p>
          <p>${b.date} | ${b.time}</p>
          <p>Status: ${b.status}</p>

          ${b.status === "confirmed" ? `
            <button onclick="userCancel('${doc.id}','${b.date}','${b.time}')">Cancel</button>
            <button onclick="promptReschedule('${doc.id}','${b.date}','${b.time}')">Reschedule</button>
          ` : ""}
        </div>
      `;
    });
  });
}

async function userCancel(id, date, time) {
  try {
    await db.collection("bookings").doc(id).update({
      status: "cancelled",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await db.collection("timeSlots").doc(`${date}_${time}`).update({
      booked: firebase.firestore.FieldValue.increment(-1)
    });

    alert("Booking cancelled.");
    document.getElementById("manageForm").reset(); // ✅ reset ONLY manage form

  } catch (err) {
    console.error(err);
    alert("Failed to cancel booking");
  }
}

let rescheduleData = {};

function promptReschedule(id, oldDate, oldTime) {
  rescheduleData = { id, oldDate, oldTime };

  const modal = document.getElementById("rescheduleModal");
  modal.style.display = "flex";

  setupRescheduleSlotLogic(); // 🔑 attach logic AFTER modal opens
}

function closeReschedule() {
  document.getElementById("rescheduleModal").style.display = "none";
}

async function confirmReschedule() {

  const newDate = document.getElementById("newDate").value;
  const newTime = document.getElementById("newTime").value;

  if (!newDate || !newTime) {
    alert("Select date and time");
    return;
  }

  const { id, oldDate, oldTime } = rescheduleData;

  await db.collection("timeSlots").doc(`${oldDate}_${oldTime}`).update({
    booked: firebase.firestore.FieldValue.increment(-1)
  });

  await db.collection("timeSlots").doc(`${newDate}_${newTime}`).set({
    capacity: 5,
    booked: firebase.firestore.FieldValue.increment(1)
  }, { merge: true });

  await db.collection("bookings").doc(id).update({
    date: newDate,
    time: newTime,
    status: "rescheduled",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("Booking rescheduled.");

  // ✅ RESET UI
  closeReschedule();
  if (manageForm) manageForm.reset();
  document.getElementById("userBookings").innerHTML = "";
}

// ================= AWARENESS PAGE CONTENT =================
const awarenessContainer = document.getElementById("awarenessContainer");

if (awarenessContainer) {
  db.collection("awarenessContent")
    .where("visible", "==", true)
    .orderBy("order")
    .get()
    .then(snapshot => {

      awarenessContainer.innerHTML = "";

      snapshot.forEach(doc => {
        const d = doc.data();

        let bodyHTML = d.body
          ? d.body.map(p => `<p>${p}</p>`).join("")
          : "";

        let bulletsHTML = d.bullets?.length
          ? `<ul>${d.bullets.map(b => `<li>${b}</li>`).join("")}</ul>`
          : "";

        awarenessContainer.innerHTML += `
          <article>
            <h2 class="section-title">${d.title}</h2>
            ${bodyHTML}
            ${bulletsHTML}
          </article>
        `;
      });

      if (snapshot.empty) {
        awarenessContainer.innerHTML = "<p>No content found.</p>";
      }

    })
    .catch(err => {
      console.error("Awareness load error:", err);
      awarenessContainer.innerHTML = "<p>Error loading content.</p>";
    });
}

// ================= FOUNDER PAGE RENDER =================
const founderPhoto = document.getElementById("founderPhoto");

if (founderPhoto) {
  db.collection("founderContent").doc("profile").get()
    .then(doc => {
      if (!doc.exists) return;

      const d = doc.data();

      founderPhoto.src = d.photo;
      document.getElementById("founderMission").textContent = d.mission;
      document.getElementById("founderQuote").textContent = d.quote;

      // Story
      const storyDiv = document.getElementById("founderStory");
      storyDiv.innerHTML = "";
      d.story.forEach(p => {
        const para = document.createElement("p");
        para.textContent = p;
        storyDiv.appendChild(para);
      });

      // Values
      const valuesUl = document.getElementById("founderValues");
      valuesUl.innerHTML = "";
      d.values.forEach(v => {
        const li = document.createElement("li");
        li.textContent = v;
        valuesUl.appendChild(li);
      });
    })
    .catch(err => console.error("Founder load error:", err));
}

window.exportBookings = async function () {

  const snapshot = await db.collection("bookings")
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) {
    alert("No bookings found");
    return;
  }

  const rows = [
    [
      "Service",
      "Duration",
      "Date",
      "Time",
      "Name",
      "Phone",
      "Email",
      "Status",
      "Payment Status",
      "Created At"
    ]
  ];

  snapshot.forEach(doc => {
    const b = doc.data();
    rows.push([
      b.service,
      b.duration || "",
      b.date,
      b.time,
      b.customer?.name || "",
      b.customer?.phone || "",
      b.customer?.email || "",
      b.status,
      b.paymentStatus,
      b.createdAt?.toDate().toLocaleString() || ""
    ]);
  });

  downloadCSV(rows, "bookings.csv");
};

function downloadCSV(rows, filename) {
  const csv = rows
    .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.shiftKey && e.key === "E") {
    exportBookings();
  }
});
