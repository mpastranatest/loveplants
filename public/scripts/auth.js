import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";

import {
    loadPlants,
    listenToPlants,
} from "./firestore.js";

import {
    setupLogoutScreen,
    setupUILinks,
    setupAccountDetails,
} from "./index.js";

// Get session status and functions

const auth = getAuth();
const functions = getFunctions();

// Load UI according to session status

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idTokenResult = await user.getIdTokenResult();
    user.admin = idTokenResult.claims.admin;

    const userDocRef = doc(window.db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.data();

    // User favorites array to set up toggles
    user.favorites = userData.favorites || [];

    console.log('SESSION STATUS - User logged in:', user);
    setupUILinks(user);
    setupAccountDetails(user);
    loadPlants(user);
    listenToPlants(user);
  } else {
    console.log('SESSION STATUS - User logged out');
    setupUILinks();
    setupAccountDetails();
    setupLogoutScreen();
  }
});

// Signup users

const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = signupForm['signup-email'].value;
  const password = signupForm['signup-password'].value;
  const bio = signupForm['signup-bio'].value;
  const age = Number(signupForm['signup-age'].value);

    // Create user and then create a record of 'users' table
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        const user = userCredential.user;
        return setDoc(doc(window.db, 'users', user.uid), {
        bio: bio,
        age: age
        });
    })
    .then(() => {
        const modal = document.querySelector('#modal-signup');
        M.Modal.getInstance(modal).close();
        signupForm.reset();
    })
    .catch(error => {
        console.error("Signup error:", error.message);
    });
});

// Login users

const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = loginForm['login-email'].value;
  const password = loginForm['login-password'].value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const modal = document.querySelector('#modal-login');
      M.Modal.getInstance(modal).close();
      loginForm.reset();
    })
    .catch((error) => {
      console.error(error.message);
    });
});

// Logout users

const logout = document.querySelector('#logout');
logout.addEventListener('click', (e) => {
  e.preventDefault();
  signOut(auth).then(() => {
    console.log('User signed out');
  });
});

// Make admins

const adminForm = document.querySelector('#make-admin-form');
adminForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const adminEmail = document.querySelector('#make-admin-email').value;
  console.log(adminEmail);
  const addAdminRole = httpsCallable(functions, 'addAdminRole');
  addAdminRole({ email: adminEmail }).then(result => {
    console.log(result);
  })
  .then(() => {
        const modal = document.querySelector('#modal-admin');
        M.Modal.getInstance(modal).close();
        signupForm.reset();
  });
});