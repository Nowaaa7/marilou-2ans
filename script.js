import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Éléments HTML
const modalAdd = document.getElementById('modal-add');
const btnOpenAdd = document.getElementById('btn-open-add');
const btnCloseAdd = document.getElementById('btn-close-add');
const btnCancelAdd = document.getElementById('btn-cancel');
const form = document.getElementById('form-add-listing');
const grid = document.getElementById('main-grid');
const navBar = document.getElementById('dynamic-categories-bar');
const dataList = document.getElementById('category-list');
const searchBtns = document.querySelectorAll('.search-btn');

// Éléments Modale Détail
const modalDetail = document.getElementById('modal-detail');
const btnCloseDetail = document.getElementById('btn-close-detail');
const mainImageDetail = document.getElementById('detail-main-image');
const titleDetail = document.getElementById('detail-title');
const locationDetail = document.getElementById('detail-location');
const durationDetail = document.getElementById('detail-duration');
const budgetDetail = document.getElementById('detail-budget');
const ratingDetail = document.getElementById('detail-rating'); 
const categoryDetail = document.getElementById('detail-category');
const descriptionDetail = document.getElementById('detail-description');
const mapsContainerDetail = document.getElementById('detail-maps-container');
const btnGalleryPrev = document.getElementById('btn-gallery-prev');
const btnGalleryNext = document.getElementById('btn-gallery-next');
const galleryCounter = document.getElementById('gallery-counter');

// Checkbox date et note
const isDoneCheckbox = document.getElementById('is-done');
const dateDoneContainer = document.getElementById('date-done-container');
const pigRatingInput = document.getElementById('pig-rating'); 

let balades = [];
let filtreActuel = "Tout";
let currentBaladeInDetail = null;
let currentImageIndex = 0;
let baladeEnCoursDeModificationId = null; 

isDoneCheckbox.addEventListener('change', (e) => {
    dateDoneContainer.style.display = e.target.checked ? 'block' : 'none';
});

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

// --- L'ERREUR ÉTAIT ICI ! C'EST CORRIGÉ ---
btnOpenAdd.addEventListener('click', () => {
    baladeEnCoursDeModificationId = null;
    form.reset();
    isDoneCheckbox.checked = false;
    dateDoneContainer.style.display = 'none';
    document.querySelector('#modal-add h2').innerText = "Créer une nouvelle escapade";
    // Correction :
    document.querySelector('button[form="form-add-listing"]').innerText = "Ajouter à notre carte";
    modalAdd.showModal();
});
btnCloseAdd.addEventListener('click', () => modalAdd.close());
btnCancelAdd.addEventListener('click', (e) => { e.preventDefault(); modalAdd.close(); });
btnCloseDetail.addEventListener('click', () => modalDetail.close());

function renderCategoriesBar() {
    navBar.innerHTML = ''; 
    dataList.innerHTML = ''; 
    const categoriesUniques = [...new Set(balades.map(b => b.category))].filter(Boolean);

    const btnTout = document.createElement('div');
    btnTout.className = `category ${filtreActuel === "Tout" ? "active" : ""}`;
    btnTout.innerHTML = `<span class="material-symbols-rounded">public</span><span>Tout</span>`;
    btnTout.addEventListener('click', () => { filtreActuel = "Tout"; renderCategoriesBar(); renderBalades(filtreActuel); });
    navBar.appendChild(btnTout);

    categoriesUniques.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = `category ${filtreActuel === cat ? "active" : ""}`;
        btn.innerHTML = `<span class="material-symbols-rounded">label</span><span>${cat}</span>`;
        btn.addEventListener('click', () => { filtreActuel = cat; renderCategoriesBar(); renderBalades(filtreActuel); });
        navBar.appendChild(btn);

        const option = document.createElement('option');
        option.value = cat;
        dataList.appendChild(option);
    });
}

function formatDateFr(dateString) {
    if(!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function renderBalades(filtre = "Tout") {
    grid.innerHTML = '';
    const baladesAffichees = filtre === "Tout" ? balades : balades.filter(b => b.category === filtre);

    if (baladesAffichees.length === 0) {
        grid.innerHTML = `<p style="text-align:center; width: 100%; grid-column: 1 / -1; color: var(--rose-flower); font-size: 1.2rem; font-weight: bold;">Aucune aventure ici pour l'instant ! 🌹🐷</p>`;
        return;
    }

    baladesAffichees.forEach(balade => {
        const article = document.createElement('article');
        article.className = 'listing-card';
        let vignetteImage = balade.images && balade.images.length > 0 ? balade.images[0] : 'https://api.dicebear.com/7.x/notionists/svg?seed=fallback';
        
        let statusBadge = balade.isDone ? `<span class="highlight done">Fait le ${formatDateFr(balade.dateDone)} ✅</span>` : `<span class="highlight">À planifier ⏳</span>`;
        let noteCochonHtml = balade.isDone ? "🐷".repeat(parseInt(balade.rating || 5)) : "💭 À tester";

        article.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${vignetteImage}" alt="${balade.title}" class="card-image">
                <button class="favorite-btn"><span class="material-symbols-rounded icon-heart">favorite</span></button>
                <button class="delete-btn" data-id="${balade.id}"><span class="material-symbols-rounded">delete</span></button>
                <button class="edit-btn" data-id="${balade.id}"><span class="material-symbols-rounded">edit</span></button>
            </div>
            <div class="card-info">
                <div class="card-header">
                    <h3 class="card-title">${balade.title}</h3>
                    <span class="card-rating" style="font-size: 1.1rem;">${noteCochonHtml}</span>
                </div>
                <p class="card-location">📍 ${balade.location}</p>
                <p class="card-status" style="margin-top: 10px; margin-bottom: 10px;">${statusBadge}</p>
                <p class="card-date">Catégorie : ${balade.category}</p>
            </div>
        `;

        article.addEventListener('click', (e) => {
            const isClickingButton = e.target.closest('.favorite-btn') || e.target.closest('.delete-btn') || e.target.closest('.edit-btn');
            if (!isClickingButton) openDetailModal(balade);
        });

        const heartBtn = article.querySelector('.favorite-btn');
        const heartIcon = article.querySelector('.icon-heart');
        heartIcon.style.fontVariationSettings = '"FILL" 0';
        heartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            heartIcon.style.fontVariationSettings = heartIcon.style.fontVariationSettings === '"FILL" 1' ? '"FILL" 0' : '"FILL" 1';
            heartIcon.style.color = heartIcon.style.fontVariationSettings === '"FILL" 1' ? 'var(--rose-flower)' : 'var(--text-light)';
        });

        const deleteBtn = article.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if(confirm("Es-tu sûr(e) de vouloir supprimer cette idée de balade ? 🥺🐷")) {
                await deleteDoc(doc(db, "balades", balade.id));
            }
        });

        const editBtn = article.querySelector('.edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(balade);
        });

        grid.appendChild(article);
    });
}

// --- ET L'ERREUR ÉTAIT AUSSI ICI ! C'EST CORRIGÉ ---
function openEditModal(balade) {
    baladeEnCoursDeModificationId = balade.id;
    document.querySelector('#modal-add h2').innerText = "Modifier notre aventure 💖";
    // Correction :
    document.querySelector('button[form="form-add-listing"]').innerText = "Enregistrer les modifications";

    document.getElementById('title').value = balade.title;
    document.getElementById('location').value = balade.location;
    document.getElementById('mapsLink').value = balade.mapsLink || "";
    document.getElementById('category-input').value = balade.category;
    document.getElementById('budget').value = balade.budget || "Gratuit";
    document.getElementById('duration').value = balade.duration || "";
    document.getElementById('description').value = balade.description;
    document.getElementById('images-urls').value = (balade.images || []).join('\n');

    isDoneCheckbox.checked = balade.isDone || false;
    if (balade.isDone) {
        dateDoneContainer.style.display = 'block';
        document.getElementById('date-done').value = balade.dateDone || "";
        document.getElementById('pig-rating').value = balade.rating || "5"; 
    } else {
        dateDoneContainer.style.display = 'none';
        document.getElementById('date-done').value = "";
        document.getElementById('pig-rating').value = "5";
    }

    modalAdd.showModal();
}

function openDetailModal(balade) {
    currentBaladeInDetail = balade;
    currentImageIndex = 0;
    titleDetail.innerText = balade.title;
    locationDetail.innerText = balade.location;
    durationDetail.innerText = `⏱️ ${balade.duration || 'À définir'}`;
    budgetDetail.innerText = `💰 Budget : ${balade.budget || 'Non précisé'}`;
    
    let noteCochonHtml = balade.isDone ? "🐷".repeat(parseInt(balade.rating || 5)) : "💭 À tester";
    ratingDetail.innerText = noteCochonHtml;

    categoryDetail.innerText = `Catégorie : ${balade.category}`;
    descriptionDetail.innerText = balade.description;

    mapsContainerDetail.innerHTML = '';
    if (balade.mapsLink) mapsContainerDetail.innerHTML = `<a href="${balade.mapsLink}" target="_blank" class="map-link">📍 Itinéraire Maps</a>`;

    updateGallery();
    modalDetail.showModal();
}

function updateGallery() {
    if (!currentBaladeInDetail.images || currentBaladeInDetail.images.length === 0) {
        mainImageDetail.src = 'https://api.dicebear.com/7.x/notionists/svg?seed=fallback';
        btnGalleryPrev.classList.add('hidden'); btnGalleryNext.classList.add('hidden'); galleryCounter.classList.add('hidden');
        return;
    }
    const totalImages = currentBaladeInDetail.images.length;
    mainImageDetail.src = currentBaladeInDetail.images[currentImageIndex];
    galleryCounter.innerText = `${currentImageIndex + 1} / ${totalImages}`;
    if (totalImages <= 1) {
        btnGalleryPrev.classList.add('hidden'); btnGalleryNext.classList.add('hidden'); galleryCounter.classList.add('hidden');
    } else {
        btnGalleryPrev.classList.remove('hidden'); btnGalleryNext.classList.remove('hidden'); galleryCounter.classList.remove('hidden');
    }
}

btnGalleryNext.addEventListener('click', () => { currentImageIndex = (currentImageIndex + 1) % currentBaladeInDetail.images.length; updateGallery(); });
btnGalleryPrev.addEventListener('click', () => { currentImageIndex = (currentImageIndex - 1 + currentBaladeInDetail.images.length) % currentBaladeInDetail.images.length; updateGallery(); });

searchBtns.forEach(btn => btn.addEventListener('click', () => alert("Pas besoin de chercher, tant qu'on est ensemble... 🥰")));

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let rawCat = document.getElementById('category-input').value.trim();
    let finalCategory = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);

    const imagesString = document.getElementById('images-urls').value;
    const imagesArray = imagesString.split('\n').map(s => s.trim()).filter(s => s !== "");

    const isDone = isDoneCheckbox.checked;
    const dateDone = document.getElementById('date-done').value;
    const ratingValue = document.getElementById('pig-rating').value; 

    const dataBalade = {
        title: document.getElementById('title').value,
        location: document.getElementById('location').value,
        mapsLink: document.getElementById('mapsLink').value,
        budget: document.getElementById('budget').value,
        duration: document.getElementById('duration').value,
        category: finalCategory || "Aventure", 
        description: document.getElementById('description').value,
        images: imagesArray,
        isDone: isDone,
        dateDone: isDone ? dateDone : null,
        rating: isDone ? ratingValue : null 
    };
    
    if (baladeEnCoursDeModificationId) {
        await updateDoc(doc(db, "balades", baladeEnCoursDeModificationId), dataBalade);
    } else {
        dataBalade.createdAt = new Date().getTime();
        await addDoc(collection(db, "balades"), dataBalade);
    }
    
    form.reset();
    isDoneCheckbox.checked = false;
    dateDoneContainer.style.display = 'none';
    modalAdd.close();
    
    filtreActuel = finalCategory;
    renderCategoriesBar();
});
