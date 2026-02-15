const ADMIN_KEY = 'jee-admin-2026';

const presets = {
  projectile: {
    mission:
      'Break projectile motion into vector components and map each equation to the trajectory you see in the simulation.',
    challenge: [
      'At 30° and 40 m/s, what are horizontal and vertical velocity components?',
      'How does doubling speed affect maximum range when angle stays constant?',
      'Which angle gives maximum range when launch/landing heights are equal?'
    ]
  },
  electrostatics: {
    mission:
      'Visualize Coulomb interactions by linking sign, distance, and medium to force direction and magnitude.',
    challenge: [
      'How does force change if distance becomes 3× while charges are unchanged?',
      'Why is electric field a vector while potential is scalar?',
      'For equal charges at triangle vertices, where can net field become zero?'
    ]
  },
  thermodynamics: {
    mission:
      'Decode PV diagrams and connect heat, work, and internal energy through real process paths.',
    challenge: [
      'In an isothermal expansion of ideal gas, what happens to internal energy?',
      'Compare work done in isobaric vs isochoric expansion.',
      'How does specific heat ratio influence adiabatic cooling?'
    ]
  }
};

const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const surpriseBtn = document.getElementById('surpriseBtn');
const aiOutput = document.getElementById('aiOutput');
const quiz = document.getElementById('quiz');

const adminKey = document.getElementById('adminKey');
const contentUpload = document.getElementById('contentUpload');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');

const angle = document.getElementById('angle');
const speed = document.getElementById('speed');
const gravity = document.getElementById('gravity');
const angleValue = document.getElementById('angleValue');
const speedValue = document.getElementById('speedValue');
const gravityValue = document.getElementById('gravityValue');
const metrics = document.getElementById('metrics');
const canvas = document.getElementById('trajectoryCanvas');
const ctx = canvas.getContext('2d');

const tabButtons = [...document.querySelectorAll('.tab-btn')];
const tabPanels = [...document.querySelectorAll('.tab-panel')];

function openTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === tabName);
  });
}

function detectTopic(input) {
  const text = input.toLowerCase();

  const dynamicTopic = Object.keys(presets).find((topic) => text.includes(topic.toLowerCase()));
  if (dynamicTopic) return dynamicTopic;

  if (text.includes('charge') || text.includes('electric') || text.includes('electro')) return 'electrostatics';
  if (text.includes('thermo') || text.includes('heat') || text.includes('gas')) return 'thermodynamics';
  return 'projectile';
}

function renderMission(topic, userPrompt) {
  const data = presets[topic];
  aiOutput.innerHTML = `
    <h3>Learning Mission: ${topic[0].toUpperCase() + topic.slice(1)}</h3>
    <p><strong>AI Plan:</strong> ${data.mission}</p>
    <p><strong>Your Prompt:</strong> ${userPrompt || 'Surprise mission requested'}</p>
    <p><strong>Flow:</strong> Visual intuition → equation mapping → timed challenge drill.</p>
  `;
  renderQuiz(data.challenge);
  openTab('studio');
}

function renderQuiz(questions) {
  quiz.innerHTML = questions
    .map(
      (question, index) => `<div class="quiz-item"><strong>Q${index + 1}.</strong> ${question}</div>`
    )
    .join('');
}

function isValidContentPack(pack) {
  if (!pack || typeof pack !== 'object') return false;

  return Object.values(pack).every((entry) => {
    return (
      entry &&
      typeof entry.mission === 'string' &&
      entry.mission.trim().length > 0 &&
      Array.isArray(entry.challenge) &&
      entry.challenge.length > 0 &&
      entry.challenge.every((q) => typeof q === 'string' && q.trim().length > 0)
    );
  });
}

function showUploadStatus(title, message) {
  uploadStatus.innerHTML = `
    <h3>${title}</h3>
    <p>${message}</p>
  `;
}

function handleUpload() {
  const key = adminKey.value.trim();
  const file = contentUpload.files[0];

  if (key !== ADMIN_KEY) {
    showUploadStatus('Upload failed', 'Invalid admin key.');
    return;
  }

  if (!file) {
    showUploadStatus('Upload failed', 'Please choose a JSON file to upload.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!isValidContentPack(parsed)) {
        showUploadStatus(
          'Upload failed',
          'Invalid schema. Each topic must include a mission string and non-empty challenge array.'
        );
        return;
      }

      Object.assign(presets, parsed);
      const topics = Object.keys(parsed);
      showUploadStatus(
        'Upload successful',
        `Loaded ${topics.length} topic(s): ${topics.join(', ')}. You can now generate missions for them.`
      );
      openTab('admin');
    } catch {
      showUploadStatus('Upload failed', 'Unable to parse JSON file.');
    }
  };

  reader.readAsText(file);
}

function drawTrajectory() {
  const a = Number(angle.value);
  const u = Number(speed.value);
  const g = Number(gravity.value);
  angleValue.textContent = `${a}°`;
  speedValue.textContent = `${u} m/s`;
  gravityValue.textContent = `${g.toFixed(1)} m/s²`;

  const rad = (a * Math.PI) / 180;
  const time = (2 * u * Math.sin(rad)) / g;
  const range = u * Math.cos(rad) * time;
  const height = (u * u * Math.sin(rad) ** 2) / (2 * g);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#8ce1ff';
  ctx.lineWidth = 2;
  ctx.beginPath();

  const scaleX = (canvas.width - 40) / Math.max(range, 1);
  const scaleY = (canvas.height - 30) / Math.max(height * 1.2, 1);

  for (let t = 0; t <= time; t += time / 80) {
    const x = u * Math.cos(rad) * t;
    const y = u * Math.sin(rad) * t - 0.5 * g * t * t;
    const px = 20 + x * scaleX;
    const py = canvas.height - 10 - y * scaleY;
    if (t === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }

  ctx.stroke();
  metrics.innerHTML = `
    <div>Time of flight: ${time.toFixed(2)} s</div>
    <div>Maximum height: ${height.toFixed(2)} m</div>
    <div>Horizontal range: ${range.toFixed(2)} m</div>
  `;
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => openTab(button.dataset.tab));
});

generateBtn.addEventListener('click', () => {
  const prompt = topicInput.value.trim();
  const topic = detectTopic(prompt);
  renderMission(topic, prompt);
});

surpriseBtn.addEventListener('click', () => {
  const topics = Object.keys(presets);
  const topic = topics[Math.floor(Math.random() * topics.length)];
  topicInput.value = `Give me a smart mission on ${topic}`;
  renderMission(topic, topicInput.value);
});

uploadBtn.addEventListener('click', handleUpload);

[angle, speed, gravity].forEach((input) => input.addEventListener('input', drawTrajectory));

drawTrajectory();
renderMission('projectile', 'Explain projectile motion in JEE-level depth');
openTab('studio');
