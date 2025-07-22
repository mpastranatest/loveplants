// Import deletePlant from the Firestore functions

import { deletePlant } from './firestore.js';

import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const auth = getAuth();

// Default image for plants without picture

const defaultImg = 'img/icon.png';

// Document selectors

const plantGrid = document.querySelector('.plant-grid');
const logoutScreen = document.querySelector('.logout-screen');

const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');

const accountDetails = document.querySelector('.account-details');

const adminItems = document.querySelectorAll('.admin');

// Set up account details

const setupAccountDetails = async (user) => {
  const accountDetails = document.querySelector('.account-details');

  if (user) {
    try {
      const userRef = doc(window.db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const html = `
        <div><strong>Email:</strong> ${user.email}</div>
        <div><strong>Bio:</strong> ${userData.bio || 'No bio set'}</div>
        <div><strong>Age:</strong> ${userData.age || 'Not specified'}</div>
        ${user.admin ? '<div><em>Admin</em></div>' : ''}
      `;

      accountDetails.innerHTML = html;
    } catch (err) {
      console.error('Error fetching account details:', err.message);
      accountDetails.innerHTML = '<div>Error loading account info</div>';
    }
  } else {
    accountDetails.innerHTML = '<div>Please log in to view account details.</div>';
  }
};

// Set up plants

const setupPlants = (data, user) => {
  let html = '';
  const favorites = user?.favorites || [];

  data.forEach(doc => {
    const plant = doc.data();
    const id = doc.id;
    const isFavorite = favorites.includes(id);

    const li = `
      <div class="plant-card card">
        <div class="card-image">
          <img src="${plant.imageUrl || defaultImg}" alt="${plant.name}" class="plant-img">
        </div>
        <div class="card-content">
          <span class="card-title">${plant.name}</span>
          <p>${plant.description}</p>
        </div>
        <div class="card-action">
          <div class="switch">
            <label>
              <input type="checkbox" class="favorite-toggle" data-id="${id}" ${isFavorite ? 'checked' : ''}>
              <span class="lever"></span>
              Fav
            </label>
          </div>
          ${user && user.admin ? `
          <div style="margin-top: 10px;">
            <button class="btn red delete-btn" data-id="${id}">Delete</button>
            <button class="btn blue edit-btn" data-id="${id}">Edit</button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    html += li;
  });

  // Update main screen and clear logout message

  plantGrid.innerHTML = html;
  logoutScreen.innerHTML = '';

  // Delete button action
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      deletePlant(id);
    });
  });

  // Edit button action
  const editButtons = document.querySelectorAll('.edit-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const docRef = doc(window.db, 'plants', id);
      const docSnap = await getDoc(docRef);
      const plant = docSnap.data();

      document.querySelector('#edit-name').value = plant.name;
      document.querySelector('#edit-description').value = plant.description;
      M.updateTextFields();

      document.querySelector('#edit-form').setAttribute('data-id', id);

      const modal = document.querySelector('#modal-edit');
      M.Modal.getInstance(modal).open();
    });
  });

  // Favorites toggle action
  const favoriteToggles = document.querySelectorAll('.favorite-toggle');
  favoriteToggles.forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const plantId = e.target.dataset.id;
      const userRef = doc(window.db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      let favorites = userSnap.data().favorites || [];

      if (e.target.checked) {
        if (!favorites.includes(plantId)) favorites.push(plantId);
      } else {
        favorites = favorites.filter(id => id !== plantId);
      }

      try {
        await updateDoc(userRef, { favorites });
        M.toast({ html: 'Favorite list updated', classes: 'rounded' });

        // 🔁 Get updated user data and reload UI
        const newUserSnap = await getDoc(userRef);
        const updatedFavorites = newUserSnap.data().favorites || [];
        user.favorites = updatedFavorites;

        // 👇 Vuelve a cargar la vista con favoritos actualizados
        setupPlants(data, user);

      } catch (err) {
        console.error('Error updating favorite list:', err.message);
      }
    });
  });
};

// Show all plants button

document.querySelector('#show-all').addEventListener('click', async () => {
  const snapshot = await getDocs(collection(window.db, 'plants'));
  setupPlants(snapshot.docs, auth.currentUser);
});

// Show favorite plants button

document.querySelector('#show-favorites').addEventListener('click', async () => {
  const userDocRef = doc(window.db, 'users', auth.currentUser.uid);
  const userSnap = await getDoc(userDocRef);
  const userData = userSnap.data();
  const favorites = userData.favorites || [];

  const snapshot = await getDocs(collection(window.db, 'plants'));
  const favoriteDocs = snapshot.docs.filter(doc => favorites.includes(doc.id));
  setupPlants(favoriteDocs, auth.currentUser);
});

// Set up logout screen

const setupLogoutScreen = () => {
  plantGrid.innerHTML = '';
  logoutScreen.innerHTML = `
    <div class="card-panel center-align" style="margin-top: 50px;">
      <i class="material-icons large green-text">LovePlants</i>
      <h5>Login to view your plants</h5>
      <p class="grey-text">Your garden awaits</p>
    </div>
  `;
};

// Set up UI links

const setupUILinks = (user) => {
  if (user) {
    if (user.admin) {
      adminItems.forEach(item => item.style.display = 'block');
    }
    loggedInLinks.forEach(item => item.style.display = 'block');
    loggedOutLinks.forEach(item => item.style.display = 'none');
  } else {
    loggedInLinks.forEach(item => item.style.display = 'none');
    adminItems.forEach(item => item.style.display = 'none');
    loggedOutLinks.forEach(item => item.style.display = 'block');
  }
};

// Set up materialize components

document.addEventListener('DOMContentLoaded', function() {

  var modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);

  var items = document.querySelectorAll('.collapsible');
  M.Collapsible.init(items);

});

// Export functions to other scripts

export {
    setupPlants,
    setupLogoutScreen,
    setupUILinks,
    setupAccountDetails,
};