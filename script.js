// --- 1. IMPORTATION DE FIREBASE (Le "Cerveau" en temps réel) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Tes clés secrètes lues depuis ton image !
const firebaseConfig = {
  apiKey: "AIzaSyC5kR-VsR0evaMoyx4b_0GtMZTANczt6Nw",
  authDomain: "marilou-2ans.firebaseapp.com",
  projectId: "marilou-2ans",
  storageBucket: "marilou-2ans.firebasestorage.app",
  messagingSenderId: "749671824923",
  appId: "1:749671824923:web:e506a054308defec4582be",
  measurementId: "G-592LQTJ2W2"
};

// Initialisation
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
const profileBtn = document.querySelector('.user-profile');

let balades = [];
let filtreActuel = "Tout";

// --- 3. SYNCHRONISATION EN TEMPS RÉEL AVEC FIREBASE ---
const baladesRef = collection(db, "balades");
const q = query(baladesRef, orderBy("createdAt", "desc")); // Trie des plus récentes aux plus anciennes

// "onSnapshot" écoute la base de données H24. Dès qu'il y a un changement, il met à jour le site !
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

// --- 5. AFFICHAGE DES BALADES ---
function renderBalades(filtre = "Tout") {
    grid.innerHTML = '';
    
    const baladesAffichees = filtre === "Tout" 
        ? balades 
        : balades.filter(b => b.category === filtre);

    // Si la base de données est vide (au tout début)
    if (baladesAffichees.length === 0) {
        grid.innerHTML = `<p style="text-align:center; width: 100%; grid-column: 1 / -1; color: var(--rose-flower); font-size: 1.2rem; font-weight: bold;">Notre carte aux trésors est vide ! Clique sur "Mettre mon grain de sel" pour ajouter notre première aventure ! 🌹🐷</p>`;
        return;
    }

    baladesAffichees.forEach(balade => {
        const article = document.createElement('article');
        article.className = 'listing-card';
        article.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${balade.image}" alt="${balade.title}" class="card-image">
                <button class="favorite-btn"><span class="material-symbols-rounded icon-heart">favorite</span></button>
            </div>
            <div class="card-info">
                <div class="card-header">
                    <h3 class="card-title">${balade.title}</h3>
                    <span class="card-rating">🐷 5.0</span>
                </div>
                <p class="card-location">📍 ${balade.location}</p>
                <p class="card-date">Ambiance : ${balade.category}</p>
                <p class="card-status"><span class="highlight">${balade.status}</span></p>
                <p style="font-size: 0.9rem; color: var(--text-light); margin-top: 10px; line-height: 1.4;">
                    ${balade.description}
                </p>
            </div>
        `;

        const heartBtn = article.querySelector('.favorite-btn');
        const heartIcon = article.querySelector('.icon-heart');
        heartIcon.style.fontVariationSettings = '"FILL" 0'; // Cœur vide par défaut
        
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

        grid.appendChild(article);
    });
}

// --- 6. INTERACTIVITÉ DES CATÉGORIES ET BOUTONS ---
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtreActuel = btn.querySelector('span:nth-child(2)').innerText;
        
        // Petite correction pour la catégorie "Nature" qui n'a pas exactement le même nom dans le menu et le formulaire
        if(filtreActuel === "Nature") filtreActuel = "Tout"; // On affiche tout quand on clique sur le premier bouton pour simplifier
        renderBalades(filtreActuel);
    });
});

searchBtns.forEach(btn => {
    btn.addEventListener('click', () => alert("Pas besoin de chercher, tant qu'on est ensemble, la destination n'a pas d'importance. 🥰"));
});
profileBtn.addEventListener('click', () => alert("Connecté en tant que : Les plus beaux amoureux du monde ! 🐷🌹"));

// --- 7. ENVOYER UNE NOUVELLE BALADE VERS FIREBASE ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectCat = document.getElementById('category');
    let finalCategory = "Nature";
    if(selectCat.value === "food") finalCategory = "Restos";
    if(selectCat.value === "chill") finalCategory = "Bord de mer";
    if(selectCat.value === "adventure") finalCategory = "Nocturne";

    const newBalade = {
        title: document.getElementById('title').value,
        location: document.getElementById('location').value,
        image: document.getElementById('image-url').value,
        category: finalCategory,
        description: document.getElementById('description').value,
        status: "À planifier",
        createdAt: new Date().getTime() // On sauvegarde l'heure exacte pour trier !
    };
    
    // 🔥 C'est ici que la magie opère : on envoie à Firebase !
    await addDoc(collection(db, "balades"), newBalade);
    
    form.reset();
    modal.close();
    
    // Revenir sur le filtre "Tout"
    categoryBtns.forEach(b => b.classList.remove('active'));
    categoryBtns[0].classList.add('active');
    filtreActuel = "Tout";
});
