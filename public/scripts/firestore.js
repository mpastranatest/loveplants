import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

import {
    setupPlants,
} from "./index.js";

// Document selectors

const createForm = document.querySelector('#create-form');

// Initialize storage

const storage = getStorage();

// Load plants from database

const loadPlants = async (user) => {
  const snapshot = await getDocs(collection(window.db, 'plants'));
  setupPlants(snapshot.docs, user);
};

// Add new plant

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = createForm['name'].value;
  const description = createForm['description'].value;
  const file = createForm['image'].files[0];

  try {
    const storageRef = ref(storage, `plantImages/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(snapshot.ref);

    // Add plant to Firestore with imageUrl
    await addDoc(collection(window.db, 'plants'), {
      name,
      description,
      imageUrl
    });

    // Close modal and reset
    const modal = document.querySelector('#modal-create');
    M.Modal.getInstance(modal).close();
    createForm.reset();
  } catch (err) {
    console.error('Error adding plant:', err.message);
  }
});

// Delete plant

const deletePlant = async (id) => {
  try {
    await deleteDoc(doc(db, 'plants', id));
    M.toast({ html: 'Plant deleted', classes: 'rounded' });
  } catch (error) {
    console.error('Error trying to delete plant:', error);
    M.toast({ html: 'Error trying to delete plant', classes: 'red rounded' });
  }
};

// Edit plant

const editForm = document.querySelector('#edit-form');
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = editForm.getAttribute('data-id');
  const name = document.querySelector('#edit-name').value;
  const description = document.querySelector('#edit-description').value;

  try {
    const docRef = doc(window.db, 'plants', id);
    await updateDoc(docRef, { name, description });

    M.toast({ html: 'Plant updated', classes: 'green rounded' });

    const modal = document.querySelector('#modal-edit');
    M.Modal.getInstance(modal).close();
    editForm.reset();
  } catch (err) {
    console.error('Error trying to update plant:', err);
    M.toast({ html: 'Error trying to update plant', classes: 'red rounded' });
  }
});

// Realtime plant updater

const listenToPlants = (user) => {
  const plantsRef = collection(window.db, 'plants');
  return onSnapshot(plantsRef, (snapshot) => {
    setupPlants(snapshot.docs, user);
  }, (error) => {
    console.error("Error listening to plants:", error.message);
  });
};

// Export functions to other scripts

window.loadPlants = loadPlants;

export {
    loadPlants,
    listenToPlants,
    deletePlant,
};