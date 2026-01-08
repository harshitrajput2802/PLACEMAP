import admin from "firebase-admin";
import fs from "fs";

if (!admin.apps.length) {
  let serviceAccount;

  if (process.env.FIREBASE_KEY_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);
  } else {
    serviceAccount = JSON.parse(
      fs.readFileSync("./firebase-key.json", "utf8")
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
