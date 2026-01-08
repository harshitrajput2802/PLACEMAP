import express from "express";
import cors from "cors";
import { analyzeStudent, analyzeResume } from "./placementAnalyzer.js";
import { db } from "./firebase.js";

const app = express();
//const PORT = 3000;
const PORT = process.env.PORT || 3000;

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.send("PLACEMAP backend is running");
});

// ================== SKILL-BASED ANALYSIS ==================
app.post("/analyze", async (req, res) => {
  const { skills, projects, targetRole, hoursPerWeek } = req.body;

    if (!skills || !projects || !targetRole || !hoursPerWeek) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // ================== DEV MODE SHORT-CIRCUIT ==================
  if (process.env.DEV_MODE === "true") {
    const snapshot = await db
      .collection("analyses")
      .where("type", "==", "skills")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return res.json({
        devMode: true,
        ...snapshot.docs[0].data().output
      });
    }
  }
  // ============================================================

  try {
     // 🔹 Try Gemini first
    const analysis = await analyzeStudent({
      skills,
      projects,
      targetRole,
      hoursPerWeek
    });

    // 🔹 Save to Firestore (inside try, before response)
    await db.collection("analyses").add({
      type: "skills",
      input: { skills, projects, targetRole, hoursPerWeek },
      output: analysis,
      createdAt: new Date()
    });

    return res.json(analysis);
  } catch (err) {
  console.error("⚠️ Gemini failed, using fallback", err.message);

  return res.json({
    fallback: true,
    message: "AI quota temporarily exceeded. Showing fallback analysis.",

    readinessScore: 60,
    skillJobMatchPercentage: 55,
    missingSkills: [
      "System Design",
      "Advanced DSA",
      "Real-world project experience"
    ],
    prioritySkills: [
      "Data Structures & Algorithms",
      "Backend Development",
      "Problem Solving"
    ],
    alternativeRoles: [
        {
          role: "Backend Developer",
          matchReason: "Strong programming fundamentals and backend-oriented problem solving."
        },
        {
          role: "Full Stack Developer",
          matchReason: "Existing exposure to both frontend and backend technologies."
        },
        {
          role: "QA Engineer",
          matchReason: "Logical thinking and code understanding transfer well to testing roles."
        }
      ],
    roadmap: {
      week1: ["Revise core DSA concepts", "Solve 10 easy problems"],
      week2: ["Learn basic system design", "Build a mini backend API"],
      week3: ["Practice medium DSA problems", "Revise OOPS"],
      week4: ["Mock interviews", "Resume refinement"]
    }    
  });
}
});

// ================== RESUME-BASED ANALYSIS ==================
app.post("/analyze-resume", async (req, res) => {
  const { resumeText, targetRole, hoursPerWeek } = req.body;

  if (!resumeText || !targetRole || !hoursPerWeek) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ================== DEV MODE SHORT-CIRCUIT ==================
  if (process.env.DEV_MODE === "true") {
    const snapshot = await db
      .collection("analyses")
      .where("type", "==", "resume")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return res.json({
        devMode: true,
        ...snapshot.docs[0].data().output
      });
    }
  }
  // ============================================================

  try {
    // 🔹 Try Gemini first
    const analysis = await analyzeResume({
      resumeText,
      targetRole,
      hoursPerWeek
    });

    // Save fresh result
    await db.collection("analyses").add({
      type: "resume",
      input: { resumeText, targetRole, hoursPerWeek },
      output: analysis,
      createdAt: new Date()
    });

    return res.json(analysis);

  } catch (err) {
  console.error("⚠️ Gemini failed, using fallback (resume)", err.message);

  return res.json({
    fallback: true,
    message: "AI quota temporarily exceeded. Showing fallback analysis.",

    readinessScore: 58,
    skillJobMatchPercentage: 52,
    missingSkills: [
      "System Design",
      "Production-level backend experience",
      "Interview problem-solving practice"
    ],
    prioritySkills: [
      "Data Structures & Algorithms",
      "Backend APIs",
      "Resume-aligned project work"
    ],
    alternativeRoles: [
        {
          role: "Backend Developer",
          matchReason: "Strong alignment with programming fundamentals, APIs, and databases."
        },
        {
          role: "Full Stack Developer",
          matchReason: "Frontend and backend exposure enables smooth transition."
        },
        {
          role: "Data Analyst",
          matchReason: "SQL, Python, and analytical reasoning are transferable."
        }
      ],
    roadmap: {
      week1: ["Revise DSA basics", "Analyze past interview questions"],
      week2: ["Learn backend fundamentals", "Build a small API project"],
      week3: ["Practice medium-level DSA problems", "Refine resume bullets"],
      week4: ["Mock interviews", "Apply with optimized resume"]
    }
  });
}

});

// ================== START SERVER ==================
//const PORT = process.env.PORT || 3000;

/*app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});