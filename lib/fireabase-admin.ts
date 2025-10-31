import * as admin from "firebase-admin";

interface FirebaseAdminAppParams {
  projectId: string;
  clientEmail: string;
  storageBucket: string;
  privateKey: string;
}

export const formatPrivateKey = (privateKey: string) =>
  privateKey.replace(/\\n/g, "\n");

const createFirebaseAdminApp = (params: FirebaseAdminAppParams) => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const cert = admin.credential.cert({
    projectId: params.projectId,
    clientEmail: params.clientEmail,
    privateKey: params.privateKey,
  });

  const app = admin.initializeApp({
    credential: cert,
    storageBucket: params.storageBucket,
    projectId: params.projectId,
  });

  console.log("Firebase admin initialized.", process.env.FIREBASE_DB_NAME);

  app.firestore().settings({
    ignoreUndefinedProperties: true,
    databaseId: `${process.env.FIREBASE_DB_NAME}`,
  });

  app.storage().bucket(`${process.env.FIREBASE_STORAGE_NAME}`);

  return app;
};

export const initFirebase = () => {
  let privateKey: string;

  // Check if we are in a production environment (Cloud Run)
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    // Decode the Base64 key from the environment variable
    const decodedServiceAccount = Buffer.from(
      process.env.FIREBASE_PRIVATE_KEY_BASE64,
      "base64"
    ).toString("utf-8");
    const credentials = JSON.parse(decodedServiceAccount);
    privateKey = formatPrivateKey(credentials.private_key);
  } else {
    // Fallback for local development using the .env file
    privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY as string);
  }

  if (!privateKey) {
    throw new Error("FIREBASE_PRIVATE_KEY not found in .env file");
  }

  // console.log(privateKey);

  const params = {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    storageBucket: process.env.FIREBASE_STORAGE_NAME as string,
    privateKey: privateKey,
  };
  return createFirebaseAdminApp(params);
};

export const firestoreAdmin = () => {
  const app = initFirebase();
  return app.firestore();
};

export const authenticationAdmin = () => {
  return initFirebase().auth();
};

export const storageAdmin = () => {
  const app = initFirebase();
  return app.storage().bucket();
};
