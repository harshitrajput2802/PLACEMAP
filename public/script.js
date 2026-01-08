//const API_BASE = "http://localhost:3000";
//const API_BASE = "http://172.27.48.1:3000";
//const API_BASE = "https://placemap-da452.web.app/";

const API_BASE = "https://placemap-backend-276752406738.asia-south1.run.app";

// ================== MAIN ENTRY ==================
async function analyze() {
  const mode = document.querySelector('input[name="mode"]:checked').value;

  // UI state
  document.getElementById("results").style.display = "none";
  document.getElementById("loading").style.display = "block";

  if (mode === "manual") {
    await analyzeManual();
  } else {
    await analyzeResume();
  }
}

// ================== MANUAL MODE ==================
async function analyzeManual() {
    try {
  const skills = document.getElementById("skills").value.split(",");
  const projects = document.getElementById("projects").value.split(",");
  const targetRole = document.getElementById("role").value;
  const hoursPerWeek = Number(document.getElementById("hours").value);

  //const response = await fetch("/analyze", {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skills,
      projects,
      targetRole,
      hoursPerWeek
    })
  });

  const data = await response.json();
  renderResults(data);
  } catch (err) {
    document.getElementById("loading").style.display = "none";
    alert("Something went wrong. Please try again.");
  }
}

// ================== RESUME MODE ==================
async function analyzeResume() {
  const file = document.getElementById("resumeFile").files[0];
  const targetRole = document.getElementById("resumeRole").value;
  const hoursPerWeek = Number(document.getElementById("resumeHours").value);

  if (!file) {
    alert("Please upload a resume PDF");
    document.getElementById("loading").style.display = "none";
    return;
  }

  const resumeText = await extractTextFromPDF(file);

  //const response = await fetch("/analyze-resume", {
  const response = await fetch(`${API_BASE}/analyze-resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resumeText,
      targetRole,
      hoursPerWeek
    })
  });

  const data = await response.json();
  renderResults(data);
}

// ================== RENDER RESULTS ==================
function renderResults(data) {

  const fallbackBanner = document.getElementById("fallbackNotice");

if (data.fallback) {
  fallbackBanner.innerText =
    "⚠️ " + (data.message || "AI quota temporarily exceeded. Showing fallback analysis.");
  fallbackBanner.style.display = "block";
} else {
  fallbackBanner.style.display = "none";
}

  // Handle wrapped response (resume warnings)
  const result = data.analysis ? data.analysis : data;
  renderAlternativeRoles(result.alternativeRoles);

  if (data.warning) {
    alert(data.warning);
  }

  document.getElementById("loading").style.display = "none";
  document.getElementById("results").style.display = "block";

  //document.getElementById("score").innerText =
    //(result.readinessScore ?? "N/A") + " / 100";

  const scoreValue = result.readinessScore ?? 0;
  const scoreElement = document.getElementById("score");
  const barElement = document.getElementById("scoreBar");

  const phaseNote = document.getElementById("phaseNote");

  if (scoreValue < 40) {
    phaseNote.style.display = "block";
  } else {
    phaseNote.style.display = "none";
  }


// Reset classes
scoreElement.classList.remove("score-low", "score-medium", "score-high");

// Set text
scoreElement.innerText = scoreValue + " / 100";

// Set color + bar
if (scoreValue < 40) {
  scoreElement.classList.add("score-low");
  barElement.style.background = "#e74c3c";
} else if (scoreValue < 70) {
  scoreElement.classList.add("score-medium");
  barElement.style.background = "#f39c12";
} else {
  scoreElement.classList.add("score-high");
  barElement.style.background = "#27ae60";
}

// Set progress width
barElement.style.width = scoreValue + "%";


  document.getElementById("match").innerText =
    (result.skillJobMatchPercentage ?? "N/A") + "% aligned with job role";

  fillList("missing", result.missingSkills || []);
  fillList("priority", result.prioritySkills || []);

  fillList("week1", result.roadmap?.week1 || []);
  fillList("week2", result.roadmap?.week2 || []);
  fillList("week3", result.roadmap?.week3 || []);
  fillList("week4", result.roadmap?.week4 || []);
}

// ================== HELPERS ==================
function fillList(id, items) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    li.innerText = item;
    ul.appendChild(li);
  });
}

function renderAlternativeRoles(roles) {
  const container = document.getElementById("alternativeRoles");
  container.innerHTML = "";

  if (!roles || roles.length === 0) {
    container.innerHTML = "<p>No alternative roles suggested.</p>";
    return;
  }

  roles.forEach(item => {
    const div = document.createElement("div");
    div.className = "alt-role";

    div.innerHTML = `
      <div class="alt-role-title">💼 ${item.role}</div>
      <div class="alt-role-reason">${item.matchReason}</div>
    `;

    container.appendChild(div);
  });
}

// ================== MODE TOGGLE ==================
function toggleMode() {
  const mode = document.querySelector('input[name="mode"]:checked').value;

  document.getElementById("manualSection").style.display =
    mode === "manual" ? "block" : "none";

  document.getElementById("resumeSection").style.display =
    mode === "resume" ? "block" : "none";
}

// ================== PDF TEXT EXTRACTION ==================
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach(item => {
      text += item.str + " ";
    });
  }
  return text;
}