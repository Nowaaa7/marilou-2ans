// --- 1. IMPORTATION DE FIREBASE ---
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
// Éléments de l'ajout
const modalAdd = document.getElementById('modal-add');
const btnOpenAdd = document.getElementById('btn-open-add');
const btnCloseAdd = document.getElementById('btn-close-add');
const btnCancelAdd = document.getElementById('btn-cancel');
const form = document.getElementById('form-add-listing');

// Éléments de la grille principale
const grid = document.getElementById('main-grid');
const navBar = document.getElementById('dynamic-categories-bar');
const dataList = document.getElementById('category-list');
const searchBtns = document.querySelectorAll('.search-btn');

// NOUVEAU : Éléments de la fenêtre "Gros Plan"
const modalDetail = document.getElementById('modal-detail');
const btnCloseDetail = document.getElementById('btn-close-detail');
const mainImageDetail = document.getElementById('detail-main-image');
const titleDetail = document.getElementById('detail-title');
const locationDetail = document.getElementById('detail-location');
const durationDetail = document.getElementById('detail-duration');
const budgetDetail = document.getElementById('detail-budget');
const categoryDetail = document.getElementById('detail-category');
const descriptionDetail = document.getElementById('detail-description');
const mapsContainerDetail = document.getElementById('detail-maps-container');
const btnGalleryPrev = document.getElementById('btn-gallery-prev');
const btnGalleryNext = document.getElementById('btn-gallery-next');
const galleryCounter = document.getElementById('gallery-counter');

// Variables d'état
let balades = [];
let filtreActuel = "Tout";
let currentBaladeInDetail = null; // La balade affichée en gros plan
let currentImageIndex = 0; // L'index de l'image affichée dans la galerie

// --- 3. SYNCHRONISATION EN TEMPS RÉEL ---
const baladesRef = collection(db, "balades");
const q = query(baladesRef, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    balades = [];
    snapshot.forEach((doc) => {
        balades.push({ id: doc.id, ...doc.data() });
    });
    renderCategoriesBar();
    renderBalades(filtreActuel);
});

// --- 4. GESTION DES FENÊTRES (OUVRIR/FERMER) ---
// Fenêtre ajout
btnOpenAdd.addEventListener('click', () => modalAdd.showModal());
btnCloseAdd.addEventListener('click', () => modalAdd.close());
btnCancelAdd.addEventListener('click', (e) => {
    e.preventDefault();
    modalAdd.close();
});

// NOUVEAU : Fermer la fenêtre gros plan
btnCloseDetail.addEventListener('click', () => modalDetail.close());

// --- 5. GÉNÉRATION DYNAMIQUE DES CATÉGORIES ---
function renderCategoriesBar() {
    navBar.innerHTML = ''; 
    dataList.innerHTML = ''; 

    const categoriesUniques = [...new Set(balades.map(b => b.category))].filter(Boolean);

    const btnTout = document.createElement('div');
    btnTout.className = `category ${filtreActuel === "Tout" ? "active" : ""}`;
    btnTout.innerHTML = `<span class="material-symbols-rounded">public</span><span>Tout</span>`;
    btnTout.addEventListener('click', () => {
        filtreActuel = "Tout";
        renderCategoriesBar();
        renderBalades(filtreActuel);
    });
    navBar.appendChild(btnTout);

    categoriesUniques.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = `category ${filtreActuel === cat ? "active" : ""}`;
        btn.innerHTML = `<span class="material-symbols-rounded">label</span><span>${cat}</span>`;
        btn.addEventListener('click', () => {
            filtreActuel = cat;
            renderCategoriesBar();
            renderBalades(filtreActuel);
        });
        navBar.appendChild(btn);

        const option = document.createElement('option');
        option.value = cat;
        dataList.appendChild(option);
    });
}

// --- 6. AFFICHAGE DES BALADES (GRILLE PRINCIPALE) ---
function renderBalades(filtre = "Tout") {
    grid.innerHTML = '';
    
    const baladesAffichees = filtre === "Tout" 
        ? balades 
        : balades.filter(b => b.category === filtre);

    if (baladesAffichees.length === 0) {
        grid.innerHTML = `<p style="text-align:center; width: 100%; grid-column: 1 / -1; color: var(--rose-flower); font-size: 1.2rem; font-weight: bold;">Aucune aventure ici pour l'instant ! 🌹🐷</p>`;
        return;
    }

    baladesAffichees.forEach(balade => {
        const article = document.createElement('article');
        article.className = 'listing-card';
        
        // On prend la PREMIÈRE image pour la vignette
        let vignetteImage = balade.images && balade.images.length > 0 ? balade.images[0] : 'https://api.dicebear.com/7.x/notionists/svg?seed=fallback';
        
        article.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${vignetteImage}" alt="${balade.title}" class="card-image">
                <button class="favorite-btn"><span class="material-symbols-rounded icon-heart">favorite</span></button>
                <button class="delete-btn" data-id="${balade.id}"><span class="material-symbols-rounded">delete</span></button>
            </div>
            <div class="card-info">
                <div class="card-header">
                    <h3 class="card-title">${balade.title}</h3>
                    <span class="card-rating">🐷 5.0</span>
                </div>
                <p class="card-location">📍 ${balade.location}</p>
                
                <p class="card-date">Catégorie : ${balade.category}</p>
            </div>
        `;

        // --- NOUVEAU : OUVRIR LE GROS PLAN ---
        // On clique n'importe où sur la carte, SAUF sur les boutons favori/suppression
        article.addEventListener('click', (e) => {
            const isClickingButton = e.target.closest('.favorite-btn') || e.target.closest('.delete-btn');
            if (!isClickingButton) {
                openDetailModal(balade);
            }
        });

        // Animation Cœur
        const heartBtn = article.querySelector('.favorite-btn');
        const heartIcon = article.querySelector('.icon-heart');
        heartIcon.style.fontVariationSettings = '"FILL" 0';
        heartBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêche d'ouvrir la fenêtre de détails
            if (heartIcon.style.fontVariationSettings === '"FILL" 1') {
                heartIcon.style.fontVariationSettings = '"FILL" 0';
                heartIcon.style.color = 'var(--text-light)';
            } else {
                heartIcon.style.fontVariationSettings = '"FILL" 1';
                heartIcon.style.color = 'var(--rose-flower)';
            }
        });

        // Suppression
        const deleteBtn = article.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Empêche d'ouvrir la fenêtre de détails
            if(confirm("Es-tu sûr(e) de vouloir supprimer cette idée de balade ? 🥺🐷")) {
                await deleteDoc(doc(db, "balades", balade.id));
                const categorieExisteEncore = balades.some(b => b.category === filtreActuel && b.id !== balade.id);
                if (!categorieExisteEncore && filtreActuel !== "Tout") {
                    filtreActuel = "Tout";
                }
            }
        });

        grid.appendChild(article);
    });
}

// --- 7. NOUVEAU : GESTION DE LA FENÊTRE GROS PLAN & GALERIE ---

function openDetailModal(balade) {
    currentBaladeInDetail = balade;
    currentImageIndex = 0; // On recommence à la première image

    // Remplissage des textes
    titleDetail.innerText = balade.title;
    locationDetail.innerText = balade.location;
    durationDetail.innerText = `⏱️ ${balade.duration || 'À définir'}`;
    budgetDetail.innerText = `💰 Budget : ${balade.budget || 'Non précisé'}`;
    categoryDetail.innerText = `Catégorie : ${balade.category}`;
    descriptionDetail.innerText = balade.description;

    // Bouton Maps
    mapsContainerDetail.innerHTML = '';
    if (balade.mapsLink) {
        mapsContainerDetail.innerHTML = `<a href="${balade.mapsLink}" target="_blank" class="map-link">📍 Itinéraire Maps</a>`;
    }

    // Affichage de la galerie
    updateGallery();

    // Ouvrir la fenêtre
    modalDetail.showModal();
}

// Met à jour l'image affichée dans la galerie
function updateGallery() {
    if (!currentBaladeInDetail.images || currentBaladeInDetail.images.length === 0) {
        mainImageDetail.src = 'https://api.dicebear.com/7.x/notionists/svg?seed=fallback';
        btnGalleryPrev.classList.add('hidden');
        btnGalleryNext.classList.add('hidden');
        galleryCounter.classList.add('hidden');
        return;
    }

    const totalImages = currentBaladeInDetail.images.length;
    mainImageDetail.src = currentBaladeInDetail.images[currentImageIndex];
    galleryCounter.innerText = `${currentImageIndex + 1} / ${totalImages}`;

    // Masquer les boutons si une seule image
    if (totalImages <= 1) {
        btnGalleryPrev.classList.add('hidden');
        btnGalleryNext.classList.add('hidden');
        galleryCounter.classList.add('hidden');
    } else {
        btnGalleryPrev.classList.remove('hidden');
        btnGalleryNext.classList.remove('hidden');
        galleryCounter.classList.remove('hidden');
    }
}

// Navigation galerie
btnGalleryNext.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % currentBaladeInDetail.images.length; // Reboucle
    updateGallery();
});

btnGalleryPrev.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + currentBaladeInDetail.images.length) % currentBaladeInDetail.images.length; // Reboucle inverse
    updateGallery();
});

// Petits boutons mignons
searchBtns.forEach(btn => {
    btn.addEventListener('click', () => alert("Pas besoin de chercher, tant qu'on est ensemble, la destination n'a pas d'importance. 🥰"));
});

// --- 8. ENVOYER LA BALADE (MODIFIÉ POUR MULTI-IMAGES) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Catégorie dynamique
    let rawCat = document.getElementById('category-input').value.trim();
    let finalCategory = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);

    // 🔥 NOUVEAU : Traitement des images
    // On récupère le texte, on le sépare par ligne (\n), et on enlève les espaces vides
    const imagesString = document.getElementById('images-urls').value;
    const imagesArray = imagesString.split('\n').map(s => s.trim()).filter(s => s !== "");

    const newBalade = {
        title: document.getElementById('title').value,
        location: document.getElementById('location').value,
        mapsLink: document.getElementById('mapsLink').value,
        budget: document.getElementById('budget').value,
        duration: document.getElementById('duration').value,
        category: finalCategory || "Aventure", 
        description: document.getElementById('description').value,
        createdAt: new Date().getTime(),
        // 🔥 On sauvegarde la liste (array) d'images
        images: imagesArray
    };
    
    await addDoc(collection(db, "balades"), newBalade);
    
    form.reset();
    modalAdd.close();
    
    filtreActuel = finalCategory;
    renderCategoriesBar();
});
