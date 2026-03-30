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

const modalAdd = document.getElementById('modal-add');
const btnOpenAdd = document.getElementById('btn-open-add');
const btnCloseAdd = document.getElementById('btn-close-add');
const btnCancelAdd = document.getElementById('btn-cancel');
const form = document.getElementById('form-add-listing');
const grid = document.getElementById('main-grid');
const navBar = document.getElementById('dynamic-categories-bar');
const dataList = document.getElementById('category-list');

const btnSurprise = document.getElementById('btn-surprise');
const btnCalendar = document.getElementById('btn-calendar');
const calendarView = document.getElementById('calendar-view');
let isCalendarMode = false;

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

const isDoneCheckbox = document.getElementById('is-done');
const dateDoneContainer = document.getElementById('date-done-container');

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
    
    // --- TRI AUTOMATIQUE PAR DATE ---
    balades.sort((a, b) => {
        let dateA = a.isDone && a.dateDone ? new Date(a.dateDone).getTime() : a.createdAt;
        let dateB = b.isDone && b.dateDone ? new Date(b.dateDone).getTime() : b.createdAt;
        return dateB - dateA; // Les plus récents en premier !
    });

    renderCategoriesBar();
    
    if(isCalendarMode) {
        renderCalendar();
    } else {
        renderBalades(filtreActuel);
    }
});

// --- LE BOUTON CALENDRIER ---
btnCalendar.addEventListener('click', () => {
    isCalendarMode = !isCalendarMode;
    if(isCalendarMode) {
        grid.style.display = 'none';
        navBar.style.display = 'none';
        calendarView.style.display = 'block';
        btnCalendar.innerText = "🗺️ Cartes";
        renderCalendar();
    } else {
        grid.style.display = 'grid';
        navBar.style.display = 'flex';
        calendarView.style.display = 'none';
        btnCalendar.innerText = "📅 Calendrier";
        renderBalades(filtreActuel);
    }
});

// --- LE GÉNÉRATEUR DE CALENDRIER FAÇON BEREAL ---
function renderCalendar() {
    calendarView.innerHTML = '';
    const doneBalades = balades.filter(b => b.isDone && b.dateDone); // On prend que celles faites et datées
    
    if(doneBalades.length === 0) {
        calendarView.innerHTML = '<p style="text-align:center; font-size: 1.2rem; font-weight: bold; color: var(--rose-flower); margin-top: 50px;">Aucun souvenir daté pour le moment ! Coche "Déjà fait" sur une escapade pour la voir apparaître ici. 📸</p>';
        return;
    }

    // Regrouper par Mois et Année (Ex: "2024-05")
    const grouped = {};
    doneBalades.forEach(b => {
        const d = new Date(b.dateDone);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        if(!grouped[key]) grouped[key] = [];
        grouped[key].push(b);
    });

    // Trier les mois du plus récent au plus ancien
    const months = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

    months.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthName = new Date(year, month-1, 1).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'});

        const monthSection = document.createElement('div');
        monthSection.className = 'calendar-month';
        monthSection.innerHTML = `<h3>${monthName} ${year}</h3>`;

        const gridDiv = document.createElement('div');
        gridDiv.className = 'calendar-grid';

        // Trouver quel jour de la semaine commence le mois (0 = Dimanche, 1 = Lundi...)
        const firstDay = new Date(year, month-1, 1).getDay();
        const blanks = firstDay === 0 ? 6 : firstDay - 1; // On ajuste pour que Lundi soit le 1er jour
        
        // Cases vides avant le 1er du mois
        for(let i=0; i<blanks; i++) {
            gridDiv.appendChild(document.createElement('div')); 
        }

        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Créer tous les jours du mois
        for(let d=1; d<=daysInMonth; d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';

            const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const escapade = grouped[monthKey].find(b => b.dateDone === dateStr);

            if(escapade) {
                dayDiv.classList.add('has-event');
                let imgHtml = escapade.images && escapade.images.length > 0 ? `<img src="${escapade.images[0]}" alt="souvenir">` : '';
                dayDiv.innerHTML = `${imgHtml}<span>${d}</span>`;
                dayDiv.addEventListener('click', () => openDetailModal(escapade));
            } else {
                dayDiv.innerHTML = `<span>${d}</span>`;
            }

            gridDiv.appendChild(dayDiv);
        }

        monthSection.appendChild(gridDiv);
        calendarView.appendChild(monthSection);
    });
}

btnSurprise.addEventListener('click', () => {
    const escapadesAPlanifier = balades.filter(b => !b.isDone);
    if (escapadesAPlanifier.length === 0) {
        alert("Vous avez déjà tout fait ! Il est temps d'ajouter de nouvelles idées d'escapades ! 🥰");
        return;
    }
    const indexAleatoire = Math.floor(Math.random() * escapadesAPlanifier.length);
    alert("Je lance les dés... 🎲 Prépare tes affaires, on part ici !");
    openDetailModal(escapadesAPlanifier[indexAleatoire]);
});

btnOpenAdd.addEventListener('click', () => {
    baladeEnCoursDeModificationId = null;
    form.reset();
    isDoneCheckbox.checked = false;
    dateDoneContainer.style.display = 'none';
    document.querySelector('#modal-add h2').innerText = "Créer une nouvelle escapade";
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

function openEditModal(balade) {
    baladeEnCoursDeModificationId = balade.id;
    document.querySelector('#modal-add h2').innerText = "Modifier notre aventure 💖";
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
    
    // Si on était sur le calendrier, on le rafraîchit
    if(isCalendarMode) renderCalendar(); 
    else {
        renderCategoriesBar();
        renderBalades(filtreActuel);
    }
});
