// --- 1. LES DONNÉES DE BASE (Vos premières balades surprises) ---
// J'ai mis des exemples dans le thème, tu pourras les modifier !
const defaultBalades = [
    {
        id: 1,
        title: "Pique-nique romantique",
        location: "Roseraie du parc",
        image: "https://images.unsplash.com/photo-1558285549-2a06eeacab09?auto=format&fit=crop&q=80&w=800",
        category: "Nature",
        description: "Le spot parfait pour fêter nos 2 ans entourés de centaines de fleurs. 🌹",
        status: "À planifier"
    },
    {
        id: 2,
        title: "Goinfrage en amoureux",
        location: "Notre resto préféré",
        image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800",
        category: "Gourmandise",
        description: "Parce qu'on aime manger comme des petits cochons ! 🐷",
        status: "Validé"
    }
];

// On récupère les balades sauvegardées dans l'ordinateur, ou on prend celles par défaut
let balades = JSON.parse(localStorage.getItem('nosEscapades')) || defaultBalades;

// --- 2. RÉCUPÉRATION DES ÉLÉMENTS HTML ---
const modal = document.getElementById('modal-add');
const btnOpen = document.getElementById('btn-open-add');
const btnClose = document.getElementById('btn-close-add');
const btnCancel = document.getElementById('btn-cancel');
const form = document.getElementById('form-add-listing');
const grid = document.getElementById('main-grid');

// --- 3. GESTION DE LA FENÊTRE MODALE ---
// Ouvrir la fenêtre
btnOpen.addEventListener('click', () => {
    modal.showModal(); // showModal() est la fonction magique d'HTML5 pour centrer et griser le fond
});

// Fermer avec la croix
btnClose.addEventListener('click', () => {
    modal.close();
});

// Fermer avec le bouton Annuler
btnCancel.addEventListener('click', (e) => {
    e.preventDefault(); // Empêche la page de se recharger
    modal.close();
});

// --- 4. AFFICHAGE DES BALADES SUR LE SITE ---
function renderBalades() {
    // On vide la grille avant de tout réafficher
    grid.innerHTML = '';
    
    // On boucle sur chaque balade pour créer sa carte
    balades.forEach(balade => {
        const article = document.createElement('article');
        article.className = 'listing-card';
        
        // On construit l'intérieur de la carte avec du HTML
        article.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${balade.image}" alt="${balade.title}" class="card-image">
                <button class="favorite-btn"><span class="material-symbols-rounded">favorite</span></button>
            </div>
            <div class="card-info">
                <div class="card-header">
                    <h3 class="card-title">${balade.title}</h3>
                    <span class="card-rating">🐷 5.0</span> </div>
                <p class="card-location">📍 ${balade.location}</p>
                <p class="card-date">Ambiance : ${balade.category}</p>
                <p class="card-status"><span class="highlight">${balade.status}</span></p>
                <p style="font-size: 0.9rem; color: var(--text-light); margin-top: 10px; line-height: 1.4;">
                    ${balade.description}
                </p>
            </div>
        `;
        
        // On ajoute la carte à la grille
        grid.appendChild(article);
    });
}

// --- 5. AJOUTER UNE NOUVELLE BALADE ---
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    
    // On crée un nouvel objet avec ce qui a été tapé dans le formulaire
    const newBalade = {
        id: Date.now(), // Crée un identifiant unique
        title: document.getElementById('title').value,
        location: document.getElementById('location').value,
        image: document.getElementById('image-url').value,
        category: document.options ? document.getElementById('category').options[document.getElementById('category').selectedIndex].text : "Nouvelle aventure",
        description: document.getElementById('description').value,
        status: "À planifier"
    };
    
    // On ajoute cette nouvelle balade au début de notre liste
    balades.unshift(newBalade);
    
    // On sauvegarde dans la mémoire du navigateur
    localStorage.setItem('nosEscapades', JSON.stringify(balades));
    
    // On met à jour l'affichage, on vide le formulaire et on ferme la fenêtre
    renderBalades();
    form.reset();
    modal.close();
});

// --- 6. AU CHARGEMENT DE LA PAGE ---
// On affiche les balades une première fois quand on arrive sur le site
renderBalades();