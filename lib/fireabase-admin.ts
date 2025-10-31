import * as admin from "firebase-admin";

interface FirebaseAdminAppParams {
  projectId: string;
  clientEmail: string;
  storageBucket: string;
  privateKey: string;
}

export const formatPrivateKey = (privateKey: string) =>
  privateKey.replace(/\\n/gm, "\n");

const createFirebaseAdminApp = (params: FirebaseAdminAppParams) => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const cert = admin.credential.cert({
    projectId: params.projectId,
    clientEmail: params.clientEmail,
    privateKey: formatPrivateKey(params.privateKey),
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
  const params = {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    storageBucket: process.env.FIREBASE_STORAGE_NAME as string,
    privateKey: process.env.FIREBASE_PRIVATE_KEY as string,
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
