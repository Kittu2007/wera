import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not defined in environment variables.");
    } else {
      const serviceAccount = JSON.parse(serviceAccountKey);
      
      // Robustly handle escaped newline characters often found in environment variables
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
