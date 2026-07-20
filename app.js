// --- Theme Configurations ---
const BALLOON_COLORS = ['#ffb5a7', '#fec5bb', '#fcd5ce', '#d8f3dc', '#d8e2dc', '#ece4db', '#ffe5ec', '#b5e2fa', '#c5f0a4', '#e6e6fa'];

// --- Audio Synthesizer (Web Audio API) ---
let audioCtx = null;
let isMusicPlaying = false;
let melodyTimeoutId = null;
let currentNoteIndex = 0;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Synthesize a cute music-box chime/bell
function playChime(frequency, startTime, duration, detune = 0) {
  if (!audioCtx || audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator(); // Add slight overtone for music box feel
  const gainNode = audioCtx.createGain();

  // Lowpass filter to make it sound soft, warm and like a music box tine
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, startTime);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.detune.setValueAtTime(detune, startTime);

  // Music boxes have a prominent high overtone
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 2, startTime);
  
  // Gain envelope: fast attack, exponential release
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  // Setup delay line for sweet echo/space
  const delay = audioCtx.createDelay(1.0);
  const delayGain = audioCtx.createGain();
  delay.delayTime.setValueAtTime(0.25, startTime);
  delayGain.gain.setValueAtTime(0.05, startTime);

  osc.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(filter);
  filter.connect(audioCtx.destination);

  // Echo routing
  filter.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(audioCtx.destination);

  osc.start(startTime);
  osc2.start(startTime);
  osc.stop(startTime + duration + 0.2);
  osc2.stop(startTime + duration + 0.2);
}

// Synthesize a quick "pop" sound for balloons
function playPopSound() {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'triangle';
  // Rapid pitch slide down for popping sound
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
  
  gainNode.gain.setValueAtTime(0.15, now);
  gainNode.gain.linearRampToValueAtTime(0.01, now + 0.1);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start(now);
  osc.stop(now + 0.12);
}

// Cute high-pitched music box "Happy Birthday" sheet music
const happyBirthdayMelody = [
  { freq: 523.25, dur: 0.2, wait: 350 },  // Hap- (C5)
  { freq: 523.25, dur: 0.2, wait: 350 },  // py (C5)
  { freq: 587.33, dur: 0.4, wait: 700 },  // Birth- (D5)
  { freq: 523.25, dur: 0.4, wait: 700 },  // day (C5)
  { freq: 698.46, dur: 0.4, wait: 700 },  // to (F5)
  { freq: 659.25, dur: 0.8, wait: 1400 }, // you (E5)
  
  { freq: 0, dur: 0.1, wait: 400 },       // Rest
  
  { freq: 523.25, dur: 0.2, wait: 350 },  // Hap- (C5)
  { freq: 523.25, dur: 0.2, wait: 350 },  // py (C5)
  { freq: 587.33, dur: 0.4, wait: 700 },  // Birth- (D5)
  { freq: 523.25, dur: 0.4, wait: 700 },  // day (C5)
  { freq: 783.99, dur: 0.4, wait: 700 },  // to (G5)
  { freq: 698.46, dur: 0.8, wait: 1400 }, // you (F5)
  
  { freq: 0, dur: 0.1, wait: 400 },       // Rest
  
  { freq: 523.25, dur: 0.2, wait: 350 },  // Hap- (C5)
  { freq: 523.25, dur: 0.2, wait: 350 },  // py (C5)
  { freq: 1046.50, dur: 0.4, wait: 700 }, // Birth- (C6)
  { freq: 880.00, dur: 0.4, wait: 700 },  // day (A5)
  { freq: 698.46, dur: 0.4, wait: 700 },  // dear (F5)
  { freq: 659.25, dur: 0.4, wait: 700 },  // Shi- (E5)
  { freq: 587.33, dur: 0.8, wait: 1400 }, // vin (D5)
  
  { freq: 0, dur: 0.1, wait: 400 },       // Rest
  
  { freq: 932.33, dur: 0.2, wait: 350 },  // Hap- (Bb5)
  { freq: 932.33, dur: 0.2, wait: 350 },  // py (Bb5)
  { freq: 880.00, dur: 0.4, wait: 700 },  // Birth- (A5)
  { freq: 698.46, dur: 0.4, wait: 700 },  // day (F5)
  { freq: 783.99, dur: 0.4, wait: 700 },  // to (G5)
  { freq: 698.46, dur: 1.0, wait: 2000 }  // you! (F5)
];

function playNextMelodyNote() {
  if (!isMusicPlaying) return;

  const note = happyBirthdayMelody[currentNoteIndex];
  
  if (note.freq > 0) {
    const now = audioCtx.currentTime;
    playChime(note.freq, now, note.dur);
  }

  currentNoteIndex = (currentNoteIndex + 1) % happyBirthdayMelody.length;
  
  // Schedule next note
  melodyTimeoutId = setTimeout(playNextMelodyNote, note.wait);
}

function startMusicLoop() {
  initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  isMusicPlaying = true;
  document.getElementById('music-toggle').classList.add('playing');
  playNextMelodyNote();
}

function stopMusicLoop() {
  isMusicPlaying = false;
  document.getElementById('music-toggle').classList.remove('playing');
  if (melodyTimeoutId) {
    clearTimeout(melodyTimeoutId);
    melodyTimeoutId = null;
  }
}

function toggleMusic() {
  if (isMusicPlaying) {
    stopMusicLoop();
  } else {
    startMusicLoop();
  }
}

// --- Live Floating Balloon Spawner ---
let balloonIntervalId = null;
const activeBalloons = new Set();

function spawnBalloon() {
  if (activeBalloons.size > 22) return; // Keep performance clean

  const balloon = document.createElement('div');
  
  // Decide whether this floats in background or foreground
  const isBack = Math.random() > 0.45; // 55% float behind the cards
  
  balloon.className = `balloon ${isBack ? 'back-balloon' : 'fore-balloon'}`;

  const string = document.createElement('div');
  string.className = 'balloon-string';
  balloon.appendChild(string);

  // Set properties
  const randomColor = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
  const randomLeft = Math.random() * 85 + 5; // Stay away from extreme edges
  const randomDuration = isBack 
    ? Math.random() * 6 + 14   // Slower in background: 14 to 20s
    : Math.random() * 5 + 9;    // Faster in foreground: 9 to 14s
  
  const randomScale = isBack 
    ? Math.random() * 0.35 + 0.55   // Smaller background scale: 0.55 to 0.9
    : Math.random() * 0.35 + 0.95;  // Larger foreground scale: 0.95 to 1.3
  
  balloon.style.left = `${randomLeft}vw`;
  balloon.style.backgroundColor = randomColor;
  balloon.style.animation = `floatUp ${randomDuration}s linear forwards`;
  balloon.style.transform = `scale(${randomScale})`;


  // Pop event
  balloon.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    popBalloon(balloon);
  });
  
  balloon.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    popBalloon(balloon);
  });

  // Self destruction on animation end
  balloon.addEventListener('animationend', () => {
    removeBalloon(balloon);
  });

  document.body.appendChild(balloon);
  activeBalloons.add(balloon);
}

function popBalloon(balloon) {
  if (balloon.classList.contains('pop')) return;
  balloon.classList.add('pop');
  
  // Play chime pop
  playPopSound();
  
  // Explode sprinkles at balloon position
  const rect = balloon.getBoundingClientRect();
  triggerSprinkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

  setTimeout(() => {
    removeBalloon(balloon);
  }, 250);
}

function removeBalloon(balloon) {
  if (balloon.parentNode) {
    balloon.parentNode.removeChild(balloon);
  }
  activeBalloons.delete(balloon);
}

function startBalloonSpawning() {
  if (balloonIntervalId) return;
  
  // Spawn a couple immediately
  for (let i = 0; i < 4; i++) {
    setTimeout(spawnBalloon, i * 400);
  }
  
  // Spawn continuous
  balloonIntervalId = setInterval(spawnBalloon, 1500);
}

// --- // --- Canvas Sprinkle Confetti & Background Particle Engine ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let sprinkles = [];
let ambientParticles = [];
let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

window.addEventListener('resize', () => {
  width = (canvas.width = window.innerWidth);
  height = (canvas.height = window.innerHeight);
});

// Ambient cartoon background particles (stars, circles, Take-copters, Anywhere Doors)
class AmbientParticle {
  constructor() {
    this.reset();
    this.y = Math.random() * height; // Start at random height initially
  }
  
  reset() {
    this.x = Math.random() * width;
    this.y = height + 25;
    this.speedY = Math.random() * 0.35 + 0.15; // Slow drifting speed
    this.speedX = Math.random() * 0.3 - 0.15;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 1.2 - 0.6;
    this.color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    this.opacity = Math.random() * 0.25 + 0.18; // Subtle background layer
    this.propellerAngle = Math.random() * Math.PI * 2;
    this.spinSpeed = Math.random() * 0.15 + 0.15;

    const rand = Math.random();
    if (rand < 0.3) {
      this.type = 'star';
      this.size = Math.random() * 8 + 6;
    } else if (rand < 0.5) {
      this.type = 'circle';
      this.size = Math.random() * 6 + 4;
    } else if (rand < 0.78) {
      this.type = 'copter';
      this.size = Math.random() * 8 + 12; // Propeller details
    } else {
      this.type = 'door';
      this.size = Math.random() * 8 + 12; // Anywhere Door details
    }
  }

  update() {
    this.y -= this.speedY;
    this.x += this.speedX;
    this.rotation += this.rotationSpeed;
    this.propellerAngle += this.spinSpeed;
    if (this.y < -30) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 1;

    if (this.type === 'star') {
      // Draw cute 4-pointed cartoon star
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size * 0.3, -this.size * 0.3);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(this.size * 0.3, this.size * 0.3);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size * 0.3, this.size * 0.3);
      ctx.lineTo(-this.size, 0);
      ctx.lineTo(-this.size * 0.3, -this.size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'copter') {
      // Draw Take-copter shaft
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -this.size * 0.7);
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Yellow cap
      ctx.fillStyle = '#ffde43';
      ctx.beginPath();
      ctx.arc(0, -this.size * 0.7, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spinning blade
      ctx.save();
      ctx.translate(0, -this.size * 0.7);
      ctx.rotate(this.propellerAngle);
      ctx.fillStyle = '#ece4db';
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-this.size * 0.7, -1, this.size * 1.4, 2, 1);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this.type === 'door') {
      // Draw a pink Anywhere Door
      ctx.fillStyle = '#ff758f';
      ctx.strokeStyle = '#2b2b2b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-this.size * 0.4, -this.size * 0.7, this.size * 0.8, this.size * 1.4, 3);
      ctx.fill();
      ctx.stroke();

      // Door panel line
      ctx.beginPath();
      ctx.rect(-this.size * 0.3, -this.size * 0.6, this.size * 0.6, this.size * 1.2);
      ctx.stroke();

      // Doorknob
      ctx.fillStyle = '#ffde43';
      ctx.beginPath();
      ctx.arc(this.size * 0.18, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Draw cute circle
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Cartoon sprinkles / pills shape particle
class SprinkleParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = Math.random() * 4 + 4;
    this.height = Math.random() * 12 + 8;
    this.color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    
    const angle = Math.random() * Math.PI - Math.PI / 2; // Arcing up
    const speed = Math.random() * 10 + 5;
    
    this.vx = Math.sin(angle) * speed;
    this.vy = -Math.cos(angle) * speed - 2;
    this.gravity = 0.22;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 6 - 3;
    this.opacity = 1.0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.rotation += this.rotationSpeed;
    
    if (this.y > height + 20) {
      this.opacity = 0;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 1.5;
    
    // Draw rounded capsule/sprinkle
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, this.width / 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }
}

function initAmbientParticles() {
  ambientParticles = [];
  const count = Math.min(25, Math.floor(width / 40));
  for (let i = 0; i < count; i++) {
    ambientParticles.push(new AmbientParticle());
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, width, height);

  // Update & Draw Ambient particles (stars/circles) in background
  ambientParticles.forEach((ap) => {
    ap.update();
    ap.draw();
  });

  for (let i = sprinkles.length - 1; i >= 0; i--) {
    const s = sprinkles[i];
    s.update();
    if (s.opacity <= 0) {
      sprinkles.splice(i, 1);
    } else {
      s.draw();
    }
  }

  requestAnimationFrame(animateParticles);
}

function triggerSprinkleBurst(x, y) {
  const count = 45;
  for (let i = 0; i < count; i++) {
    sprinkles.push(new SprinkleParticle(x, y));
  }
}

// --- Countdown Timer ---
const targetDate = new Date('July 26, 2026 18:00:00').getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const diff = targetDate - now;

  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minsEl = document.getElementById('minutes');
  const secsEl = document.getElementById('seconds');

  if (diff <= 0) {
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minsEl.textContent = '00';
    secsEl.textContent = '00';
    document.querySelector('#section-countdown h2').textContent = "LET'S PARTY!";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  daysEl.textContent = days.toString().padStart(2, '0');
  hoursEl.textContent = hours.toString().padStart(2, '0');
  minsEl.textContent = minutes.toString().padStart(2, '0');
  secsEl.textContent = seconds.toString().padStart(2, '0');
}

// --- Firebase Database Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCfIAYFFWcZQfbQ4qIdAv0CHagSavZXxSs",
  authDomain: "shivin-s-birthday-party.firebaseapp.com",
  databaseURL: "https://shivin-s-birthday-party-default-rtdb.firebaseio.com", // Singapore regional databases might end with -default-rtdb.asia-southeast1.firebasedatabase.app. We'll adjust if needed.
  projectId: "shivin-s-birthday-party",
  storageBucket: "shivin-s-birthday-party.firebasestorage.app",
  messagingSenderId: "36685298020",
  appId: "1:36685298020:web:e79069e2322af2a218a271",
  measurementId: "G-K2392WWFJ5"
};

let database = null;
let useFirebase = false;

if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    useFirebase = true;
    console.log("Firebase initialized successfully!");
  } catch (err) {
    console.error("Firebase failed to initialize:", err);
  }
}

// --- Local Storage & Wishes Board ---
const defaultWishes = [];
let wishesListenerInitialized = false;

function getWishes() {
  const wishes = localStorage.getItem('shivin_birthday_wishes_v2');
  if (!wishes) {
    localStorage.setItem('shivin_birthday_wishes_v2', JSON.stringify(defaultWishes));
    return defaultWishes;
  }
  return JSON.parse(wishes);
}

function saveWish(name, wish) {
  if (useFirebase && database) {
    database.ref('wishes').push({
      name: name,
      wish: wish,
      timestamp: Date.now()
    });
  } else {
    const wishes = getWishes();
    wishes.unshift({ name, wish });
    localStorage.setItem('shivin_birthday_wishes_v2', JSON.stringify(wishes));
  }
}

function displayWishes(wishesList) {
  const wishesBoard = document.getElementById('wishes-board');
  wishesBoard.innerHTML = '';

  // Filter out any wishes from Brijesh or Nikita
  const filteredWishes = wishesList.filter(w => {
    const nameLower = (w.name || '').toLowerCase();
    return !nameLower.includes('brijesh') && !nameLower.includes('nikita');
  });

  if (filteredWishes.length === 0) {
    wishesBoard.innerHTML = '<div class="no-wishes">No wishes posted yet. Be the first to wish!</div>';
    return;
  }

  filteredWishes.forEach((w) => {
    const card = document.createElement('div');
    card.className = 'wish-card';
    
    const wishText = document.createElement('p');
    wishText.className = 'wish-text';
    wishText.textContent = `"${w.wish}"`;

    const author = document.createElement('div');
    author.className = 'wish-author';
    author.textContent = `- ${w.name}`;

    card.appendChild(wishText);
    card.appendChild(author);
    wishesBoard.appendChild(card);
  });
}

function renderLocalWishes() {
  const wishesList = getWishes();
  displayWishes(wishesList);
}

function renderWishes() {
  if (useFirebase && database) {
    // Automatically migrate any existing local storage wishes to Firebase so they aren't lost
    const localWishes = getWishes();
    const migrated = localStorage.getItem('shivin_wishes_migrated_v2');
    if (localWishes.length > 0 && !migrated) {
      try {
        localWishes.forEach((w) => {
          database.ref('wishes').push({
            name: w.name,
            wish: w.wish,
            timestamp: Date.now()
          });
        });
        localStorage.setItem('shivin_wishes_migrated_v2', 'true');
        console.log("Local wishes successfully migrated to Firebase!");
      } catch (err) {
        console.error("Failed to migrate local wishes:", err);
      }
    }

    if (!wishesListenerInitialized) {
      wishesListenerInitialized = true;
      database.ref('wishes').on('value', (snapshot) => {
        const wishesList = [];
        const data = snapshot.val();
        if (data) {
          Object.keys(data).forEach((key) => {
            wishesList.push(data[key]);
          });
          // Sort by timestamp descending (newest first)
          wishesList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        displayWishes(wishesList);
      }, (error) => {
        console.error("Firebase read error, falling back to local wishes:", error);
        renderLocalWishes();
      });
    }
  } else {
    renderLocalWishes();
  }
}

// --- Envelope Opening Handler ---
const envelopeWrapper = document.getElementById('envelope-wrapper');
const envelopeContainer = document.getElementById('envelope-container');
const mainContent = document.getElementById('main-content');

envelopeWrapper.addEventListener('click', (e) => {
  e.stopPropagation();
  
  envelopeWrapper.classList.add('open');

  // Trigger audio
  initAudio();
  if (audioCtx) {
    audioCtx.resume();
    // Play upbeat bell notes
    const now = audioCtx.currentTime;
    playChime(523.25, now, 0.4);       // C5
    playChime(659.25, now + 0.15, 0.4);  // E5
    playChime(783.99, now + 0.3, 0.4);   // G5
    playChime(1046.50, now + 0.45, 0.8); // C6
  }

  // Trigger sprinkle explosion in canvas
  const rect = envelopeWrapper.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  triggerSprinkleBurst(centerX, centerY);

  // Transition to main screen
  setTimeout(() => {
    envelopeContainer.classList.add('hidden');
    mainContent.classList.add('visible');
    
    // Automatically trigger ambient music box melody & balloons spawning
    startMusicLoop();
    startBalloonSpawning();
  }, 900);
});

// Music Toggle Button
document.getElementById('music-toggle').addEventListener('click', () => {
  toggleMusic();
});

// RSVP Form Submit Handler
const rsvpForm = document.getElementById('rsvp-form');
const rsvpStatus = document.getElementById('rsvp-status');

rsvpForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const attendance = document.querySelector('input[name="attendance"]:checked').value;
  const name = document.getElementById('guest-name').value.trim();
  const phone = document.getElementById('guest-phone').value.trim();
  const wish = document.getElementById('guest-wish').value.trim();

  if (!name || !phone) return;

  // Web3Forms API call to send email notification
  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      access_key: "8ec50292-bac8-408c-9fd6-2a5b3895a49b",
      subject: `New RSVP from ${name}`,
      from_name: "Birthday RSVP",
      name: name,
      phone: phone,
      attendance: attendance === 'yes' ? 'Attending' : 'Not Attending',
      wish: wish || "No wish left"
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log("Web3Forms RSVP response sent:", data);
  })
  .catch(err => {
    console.error("Web3Forms RSVP response error:", err);
  });

  // Visual success feedback
  rsvpStatus.style.color = '#ff4d6d';
  
  if (attendance === 'yes') {
    rsvpStatus.textContent = `Yay, ${name}! We can't wait to see you! 🎈🍰`;
    
    // Trigger sprinkle burst from submit button
    const submitBtn = e.submitter || rsvpForm.querySelector('button[type="submit"]');
    const btnRect = submitBtn ? submitBtn.getBoundingClientRect() : { left: width / 2, top: height / 2, width: 0 };
    triggerSprinkleBurst(btnRect.left + (btnRect.width || 0) / 2, btnRect.top || (height / 2));
    
    // Launch a bunch of immediate balloons
    for (let i = 0; i < 6; i++) {
      setTimeout(spawnBalloon, i * 200);
    }
  } else {
    rsvpStatus.textContent = `Aww, thanks for letting us know, ${name}! You'll be missed! 💕`;
  }

  // Save wish to local board if provided
  if (wish) {
    saveWish(name, wish);
    renderWishes();
  }

  // Clear form
  rsvpForm.reset();
  document.getElementById('rsvp-yes').checked = true;

  // Smooth scroll down to wishes board
  if (wish) {
    setTimeout(() => {
      document.getElementById('section-wishes').scrollIntoView({ behavior: 'smooth' });
    }, 1500);
  }
});

// --- Polaroid Photo Slideshow Carousel ---
let currentPhotoIndex = 0;
let autoRotateIntervalId = null;

function showPhoto(index) {
  const slides = document.querySelectorAll('.photo-slide');
  if (slides.length === 0) return;

  // Handle bounds wrapping
  if (index >= slides.length) {
    currentPhotoIndex = 0;
  } else if (index < 0) {
    currentPhotoIndex = slides.length - 1;
  } else {
    currentPhotoIndex = index;
  }

  // Deactivate current slide
  slides.forEach(slide => slide.classList.remove('active'));
  // Activate target slide
  slides[currentPhotoIndex].classList.add('active');
}

function nextPhoto() {
  showPhoto(currentPhotoIndex + 1);
}

function prevPhoto() {
  showPhoto(currentPhotoIndex - 1);
}

function initPhotoCarousel() {
  const prevBtn = document.getElementById('prev-photo');
  const nextBtn = document.getElementById('next-photo');

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      prevPhoto();
      resetAutoRotate(); // Reset timer on user action
    });

    nextBtn.addEventListener('click', () => {
      nextPhoto();
      resetAutoRotate(); // Reset timer on user action
    });

    // Start auto rotating
    startAutoRotate();
  }
}

function startAutoRotate() {
  autoRotateIntervalId = setInterval(nextPhoto, 4500); // Rotate every 4.5s
}

function resetAutoRotate() {
  if (autoRotateIntervalId) {
    clearInterval(autoRotateIntervalId);
    // Restart after 6 seconds of inactivity
    autoRotateIntervalId = setInterval(nextPhoto, 6000);
  }
}

// --- Initialize Page ---
document.addEventListener('DOMContentLoaded', () => {
  initAmbientParticles();
  animateParticles();
  initPhotoCarousel();
  
  // Start countdown interval
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Load and render existing wishes
  renderWishes();
});
