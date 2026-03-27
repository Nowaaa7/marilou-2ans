// --- 1. IMPORTATION DE FIREBASE (Ajout de deleteDoc et doc) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5kR-VsR0evaMoyx4b_0GtMZTANczt6Nw",
  authDomain: "marilou-2ans.firebaseapp.com",
  projectId: "marilou-2ans",
  storageBucket: "marilou-2ans.firebasestorage.app",
  messagingSenderId: "749671824923",
  appId: "1:749671824923:web:e506a054308defec4582be",
  measurementId: "G-592LQTJ2W2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. RÉCUPÉRATION DES ÉLÉMENTS HTML ---
const modal = document.getElementById('modal-add');
const btnOpen = document.getElementById('btn-open-add');
const btnClose = document.getElementById('btn-close-add');
const btnCancel = document.getElementById('btn-cancel');
const form = document.getElementById('form-add-listing');
const grid = document.getElementById('main-grid');
const categoryBtns = document.querySelectorAll('.category');
const searchBtns = document.querySelectorAll('.search-btn');

let balades = [];
let filtreActuel = "Tout";

// --- 3. SYNCHRONISATION EN TEMPS RÉEL AVEC FIREBASE ---
const baladesRef = collection(db, "balades");
const q = query(baladesRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    balades = [];
    snapshot.forEach((doc) => {
        balades.push({ id: doc.id, ...doc.data() });
    });
    renderBalades(filtreActuel);
});

// --- 4. GESTION DE LA FENÊTRE MODALE ---
btnOpen.addEventListener('click', () => modal.showModal());
btnClose.addEventListener('click', () => modal.close());
btnCancel.addEventListener('click', (e) => {
    e.preventDefault();
    modal.close();
});

// --- 5. AFFICHAGE DES BALADES (AVEC NOUVELLES FONCTIONS) ---
function renderBalades(filtre = "Tout") {
    grid.innerHTML = '';
    
    const baladesAffichees = filtre === "Tout" 
        ? balades 
        : balades.filter(b => b.category === filtre);

    if (baladesAffichees.length === 0) {
        grid.innerHTML = `<p style="text-align:center; width: 100%; grid-column: 1 / -1; color: var(--rose-flower); font-size: 1.2rem; font-weight: bold;">Notre carte aux trésors est vide ! Clique sur "Mettre mon grain de sel" pour ajouter notre première aventure ! 🌹🐷</p>`;
        return;
    }

    baladesAffichees.forEach(balade => {
        const article = document.createElement('article');
        article.className = 'listing-card';
        
        // On construit la carte avec les nouvelles infos (budget, durée, maps)
        let mapsHTML = balade.mapsLink ? `<a href="${balade.mapsLink}" target="_blank" class="map-link">📍 Itinéraire Maps</a>` : '';
        
        article.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${balade.image}" alt="${balade.title}" class="card-image">
                <button class="favorite-btn"><span class="material-symbols-rounded icon-heart">favorite</span></button>
                <button class="delete-btn" data-id="${balade.id}"><span class="material-symbols-rounded">delete</span></button>
            </div>
            <div class="card-info">
                <div class="card-header">
                    <h3 class="card-title">${balade.title}</h3>
                    <span class="card-rating">🐷 5.0</span>
                </div>
                <p class="card-location">📍 ${balade.location}</p>
                
                <div class="card-meta">
                    <span>⏱️ ${balade.duration || 'À définir'}</span>
                    <span>💰 Budget : ${balade.budget || 'Non précisé'}</span>
                </div>

                <p class="card-date">Ambiance : ${balade.category}</p>
                <p style="font-size: 0.9rem; color: var(--text-light); margin-top: 10px; line-height: 1.4;">
                    ${balade.description}
                </p>
                ${mapsHTML}
            </div>
        `;

        // Animation Cœur
        const heartBtn = article.querySelector('.favorite-btn');
        const heartIcon = article.querySelector('.icon-heart');
        heartIcon.style.fontVariationSettings = '"FILL" 0';
        heartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (heartIcon.style.fontVariationSettings === '"FILL" 1') {
                heartIcon.style.fontVariationSettings = '"FILL" 0';
                heartIcon.style.color = 'var(--text-light)';
            } else {
                heartIcon.style.fontVariationSettings = '"FILL" 1';
                heartIcon.style.color = 'var(--rose-flower)';
            }
        });

        // 🔥 SUPPRESSION FIREBASE 🔥
        const deleteBtn = article.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Demande de confirmation
            if(confirm("Es-tu sûr(e) de vouloir supprimer cette idée de balade ? 🥺🐷")) {
                await deleteDoc(doc(db, "balades", balade.id));
            }
        });

        grid.appendChild(article);
    });
}

// --- 6. INTERACTIVITÉ DES CATÉGORIES ---
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtreActuel = btn.querySelector('span:nth-child(2)').innerText;
        if(filtreActuel === "Nature") filtreActuel = "Tout"; 
        renderBalades(filtreActuel);
    });
});

searchBtns.forEach(btn => {
    btn.addEventListener('click', () => alert("Pas besoin de chercher, tant qu'on est ensemble, la destination n'a pas d'importance. 🥰"));
});

// --- 7. ENVOYER LA BALADE (AVEC LES NOUVEAUX PARAMÈTRES) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectCat = document.getElementById('category');
    let finalCategory = "Nature";
    if(selectCat.value === "food") finalCategory = "Restos";
    if(selectCat.value === "chill") finalCategory = "Bord de mer";
    if(selectCat.value === "adventure") finalCategory = "Nocturne";

    // On récupère toutes les nouvelles valeurs
    const newBalade = {
        title: document.getElementById('title').value,
        location: document.getElementById('location').value,
        mapsLink: document.getElementById('mapsLink').value,
        budget: document.getElementById('budget').value,
        duration: document.getElementById('duration').value,
        image: document.getElementById('image-url').value,
        category: finalCategory,
        description: document.getElementById('description').value,
        status: "À planifier",
        createdAt: new Date().getTime()
    };
    
    await addDoc(collection(db, "balades"), newBalade);
    
    form.reset();
    modal.close();
    
    categoryBtns.forEach(b => b.classList.remove('active'));
    categoryBtns[0].classList.add('active');
    filtreActuel = "Tout";
});
