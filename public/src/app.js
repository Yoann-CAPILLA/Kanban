const cardModule = require('./cardModule');
const labelModule = require('./labelModule');
const listModule = require('./listModule');

// on objet qui contient des fonctions
var app = {

  base_url: 'http://localhost:3000',

  // fonction d'initialisation, lancée au chargement de la page
  init: async function () {
    console.log('app.init !');

    //on dispatche l'info de base_url aux modules qui en auront besoin
    listModule.setBaseUrl(app.base_url);
    cardModule.setBaseUrl(app.base_url);
    labelModule.setBaseUrl(app.base_url);

    //au chargement de la page, on souhaite récupérer les listes existantes en BDD
    //La méthode étant déclarée async, on doit attendre qu'elle ait terminé son traitement avant de passer à la suite
    await app.getListsFromAPI();
    //ajout au chargement de la page de la méthode qui va gérer les ajouts des EventListeners
    app.addListenerToActions();
  },

  addListenerToActions: () => {
    //on ajoute un EventListener sur le bouton d'ajout d'une liste pour ouvrir la modale
    const button = document.getElementById('addListButton');
    button.addEventListener('click', listModule.showAddListModal);

    document.querySelector('#addLabelButton').addEventListener('click', labelModule.showAddLabelModal);
    document.querySelector('#modifyLabelButton').addEventListener('click', labelModule.showModifyRemoveLabelModal);

    //on cible tous les éléments ayant la class close pour leur ajouter un EventListener permettant de fermer la modale
    const closeButtons = document.querySelectorAll('.close');
    for (const closeButton of closeButtons) {
      closeButton.addEventListener('click', app.hideModals);
    }

    //on cible le formulaire d'ajout d'une liste 
    const form = document.querySelector('#addListModal form');
    form.addEventListener('submit', app.handleAddListForm);

    //on cible le formulaire d'ajout d'une carte
    const cardForm = document.querySelector('#addCardModal form');
    cardForm.addEventListener('submit', app.handleAddCardForm);  

    document.querySelector('#addLabelModal form').addEventListener('submit', app.handleAddLabelForm);
    document.querySelector('#modifyRemoveLabelModal form').addEventListener('submit', app.handleModifyRemoveLabelForm);

  },

  handleAddListForm: event => {
    //pour éviter que le module listModule ait à faire une référence à app dans son code, on laisse la déclaration de la méthode dans app, on délègue le traitement spécifique aux listes au module et on ferme les modales depuis app
    listModule.handleAddListForm(event);
    app.hideModals();
  },

  handleAddCardForm: event => {
    cardModule.handleAddCardForm(event);
    app.hideModals();
  },

  handleAddLabelForm: event => {
    labelModule.handleAddLabelForm(event);
    app.hideModals();
  },

  handleModifyRemoveLabelForm: event => {
    labelModule.handleModifyRemoveLabelForm(event);
    app.hideModals();
  },

  hideModals: () => {
    //on récupère tous les éléments de class modal
    const modals = document.querySelectorAll('.modal');
    //on boucle sur le tableau et pour chaque élément, on retire la class is-active
    for (const modal of modals) {
      modal.classList.remove('is-active');

      const nameInput = modal.querySelector('.input[name="name"]');
      if (nameInput) nameInput.value = '';

      const titleInput = modal.querySelector('.input[name="title"]');
      if (titleInput) titleInput.value = '';

      const colorInput = modal.querySelector('.input[name="color"]');
      if (colorInput) colorInput.value = '#000000';

      const deleteInput = document.getElementById("deleteLabel");
      if (deleteInput) deleteInput.checked = false;

    }
  },

  getListsFromAPI: async () => {
    try {
      const result = await fetch(`${app.base_url}/lists`);
      if (result.ok) {
        const json = await result.json();
        //avec fetch, on obtient un tableau d'objects List
        //Pour créer les listes dans le DOM, on boucle sur ce tableau et pour chaque élément, on appelle la méthode makeListInDOM
        for (const list of json) {
          listModule.makeListInDOM(list);
          //pour chaque élément du tableau de liste, on utilise la propriété cards qui contient un tableau des cartes de cette liste
          //on boucle sur ce tableau et pour chaque élément, on appelle makeCardInDOM
          for (const card of list.cards) {
            cardModule.makeCardInDOM(card);

            card.labels.forEach(label => {
              labelModule.makeLabelInDOM(label)
            });
          }
        }

      } else {
        console.error('Pépin au niveau du serveur');
      }
    } catch(error) {
      console.error('Impossible de charger les listes depuis l\'API', error);
    }
  }
};

// on accroche un écouteur d'évènement sur le document : quand le chargement est terminé, on lance app.init
document.addEventListener('DOMContentLoaded', app.init);