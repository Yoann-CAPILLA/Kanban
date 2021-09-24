(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./cardModule":2,"./labelModule":3,"./listModule":4}],2:[function(require,module,exports){
const labelModule = require('./labelModule');

const cardModule = {

    base_url: null,

    setBaseUrl: url => {
        cardModule.base_url = url;
    },

    showAddCardModal: event => {
        //on récupère la valeur de data-list-id en utilisant la référence vers l'élément cliqué
        const listId = event.target.closest('.panel').getAttribute('data-list-id');
        const div = document.getElementById('addCardModal');
        //on n'oublie pas de mettre à jour l'attribut value du champ caché du formulaire
        div.querySelector('[name="list_id"]').value = listId;
        div.classList.add('is-active');
    },

    handleAddCardForm: async event => {
        //on désactive le comportement par défaut
        event.preventDefault();
        //on récupère les infos du formulaire dans un FormData
        const formData = new FormData(event.target);

        //on calcule la position de notre nouvelle carte
        //on sélectionne la liste de la nouvelle carte à partir de la valeur de list_id qu'on a dans le formData
        //pour respecter la syntaxe de sélection par un attribute, on doit indiquer la valeur de list_id sous forme d'une string
        // [data-list-id=12] est incorrecte, on doit bien indiquer [data-list-id="12"]
        const position = document.querySelectorAll(`[data-list-id="${formData.get('list_id')}"] .box`).length;
        formData.set('position', position);

        try {
            //on attend que la BDD nous ait répondu avant de continuer
            //grâce à multer qu'on a ajouté à notre API, on peut directement mettre le formData dans le corps de la requête, express saura en extraire les infos et les placer dans request.body
            const result = await fetch(`${cardModule.base_url}/cards`, {
                method: 'POST',
                body: formData
            });

            //on teste si la requête a bien abouti (status 200) 
            if (result.ok) {
                //
                const json = await result.json();
                cardModule.makeCardInDOM(json);
            } else {
                console.error('On a eu un pépin sur le serveur');
            }


        } catch (error) {
            console.error('Impossible d\'ajouter la carte', error);
        }
    },


    makeCardInDOM: data => {
        //on récupère le template
        const template = document.getElementById('cardTemplate');
        //on crée un nouveau noeud en clonant notre modèle
        const node = document.importNode(template.content, true);
        //on configure la nouvelle carte
        node.querySelector('.column').textContent = data.title;

        //on sélectionne le container de la carte à partir de sa classe CSS
        const box = node.querySelector('.box');
        box.style.borderTop = `.75em solid ${data.color}`;
        box.setAttribute('data-card-id', data.id);

        //on ajoute un event listener sur la balise <a> qui contient l'image du crayon
        const modifLink = box.querySelector('.fa-pencil-alt').closest('a');
        modifLink.addEventListener('click', cardModule.showCardTitleForm);

        //on ajoute un event listener sur la balise <a> qui contient l'image de la poubelle
        const deleteLink = box.querySelector('.fa-trash-alt').closest('a');
        deleteLink.addEventListener('click', cardModule.deleteCard);

        //on ajoute un event listener pour surveiller l'envoi du formulaire de modif
        box.querySelector('form').addEventListener('submit', cardModule.handleCardTitleForm);

        box.querySelector('.label .icon').addEventListener('click', labelModule.showLabel);

        //on ajoute le noeud au bon endroit dans le DOM
        //on cible l'élément html qui a un attribut data-list-id de la même valeur que le list_id de notre formulaire
        //dans cet élément, on cible le sous-élément de class .panel-block : c'est cet élément qui est sensé contenir les cartes d'une liste, on ajoute notre nouvelle carte à cet élément
        document.querySelector(`[data-list-id="${data.list_id}"] .panel-block`).appendChild(node);

    },

    showCardTitleForm: event => {
        //on cible la div container de la carte
        const div = event.target.closest('.box');
        //on masque la div contenant le titre de la carte
        const title = div.querySelector('.column');
        title.classList.add('is-hidden');
        //on affiche le formulaire de modif
        div.querySelector('form').classList.remove('is-hidden');
        //on met le titre de la carte en value de l'input du formulaire
        div.querySelector('[name="title"]').value = title.textContent;

    },

    handleCardTitleForm: async event => {
        //on désactive le comportement par défaut
        event.preventDefault();
        //on va centraliser les data du formulaire dans un FormData
        const formData = new FormData(event.target);

        //on checke si l'utilisateur a bien saisi quelque chose dans le champ title
        //si c'est pas le cas, on sort de la fonction en affichant une erreur
        if (formData.get('title') === '') {
            console.error('Veuillez saisir un titre pour cette carte');
            //on utilise le mot-clé return pour sortir de la fonction sans exécuter le reste du code
            return;
        }

        const box = event.target.closest('.box')

        const title = box.querySelector('.column');

        try {
            //on met à jour la carte en BDD avec une requête via notre API
            const result = await fetch(`${cardModule.base_url}/cards/${box.getAttribute('data-card-id')}`, {
                method: 'PATCH',
                body: formData
            });

            if (result.ok) {
                const json = await result.json();
                if (json >= 1) {
                    //la mise à jour a bien été effectuée
                    //on sélectionne la div qui contient le titre pour la mettre à jour
                    title.textContent = formData.get('title');
                    box.style.borderTop = `.75em solid ${formData.get('color')}`;
                } else {
                    console.error('Aucune carte mise à jour');
                }
            } else {
                console.error('On a eu un pépin sur le serveur');
            }
        } catch (error) {
            console.error('Impossible de mettre la carte à jour', error);
        } finally {
            title.classList.remove('is-hidden');
            event.target.classList.add('is-hidden');
        }
    },

    deleteCard: async event => {

        try {
            const result = await fetch(`${cardModule.base_url}/cards/${event.target.closest('.box').getAttribute('data-card-id')}`, {
                method: 'DELETE'
            });

            if (result.ok) {
                const json = await result.json();
                if (json) {
                    event.target.closest('.box').remove();
                } else {
                    console.error('Carte non supprimée');
                }
            } else {
                console.error('On a eu un pépin sur le serveur');
            }
        } catch (error) {
            console.error('Impossible de supprimer la carte', error);
        }
    },
}

module.exports = cardModule;
},{"./labelModule":3}],3:[function(require,module,exports){
const labelModule = {

    base_url: null,

    setBaseUrl: url => {
        labelModule.base_url = url;
    },

    makeLabelInDOM: data => {
        //on récupère la carte et le conteneur du label
        const card = document.querySelector(`[data-card-id="${data.card_has_label.card_id}"]`);
        const labelContainer = card.querySelector('.label');
        //on crée un élement qui va recevoir les infos du label
        const span = document.createElement('span');
        span.classList.add('tag');
        span.classList.add('is-rounded');
        span.setAttribute('data-label-id', data.id);
        span.textContent = data.name
        span.style.backgroundColor = data.color;
        //on crée un bouton pour la suppression du label auquel on ajoute un écouteur d'événement
        const button = document.createElement('button');
        button.classList.add('delete');
        button.classList.add('is-small');
        button.addEventListener('click', labelModule.dissociateLabel);
        //on insère le bouton dans l'élément qu'on affiche ensuite dans le DOM
        span.appendChild(button);
        labelContainer.appendChild(span);
    },

    showLabel: async event => {
        //on cibles les éléments nécessaire à l'ajout d'un label
        const cardId = parseInt(event.target.closest('.box').getAttribute('data-card-id'));
        const labelContainer = event.target.closest('.label');
        const form = event.target.closest('.box').querySelector('#addLabel');
        const options = document.querySelectorAll(`[data-card-id="${cardId}"] #labels option`);
        //on vide la liste déroulante des labels éxistants (potentielles modifications préalable)
        options.forEach(option => {
            option.remove();
        });

        try {
            const result = await fetch(`${labelModule.base_url}/labels`, {
                method: 'GET'
            });

            if (result.ok) {
                const json = await result.json();
                //on récupère les labels à jour puis on les insère dans la liste
                json.forEach(label => {
                    const option = document.createElement('option');
                    option.value = label.id;
                    option.textContent = label.name;
                    document.querySelector(`[data-card-id="${cardId}"] #labels`).appendChild(option);
                });
                //on masque les labels déjà associés à la carte pour afficher le formulaire d'ajout d'un nouveau
                labelContainer.classList.add('is-hidden');
                form.classList.remove('is-hidden');
            } else {
                console.error('On a eu un pépin sur le serveur');
            }
        } catch (error) {
            console.error('Impossible d\'obtenir les labels', error);
        }
        //on ajoute un eventlistener pour l'association du label à la carte lors de l'envoi du formulaire
        form.addEventListener('submit', labelModule.associateLabel);
    },

    associateLabel: async event => {
        event.preventDefault();
        //on cibles les éléments nécessaire à l'association d'un label
        const form = event.target;
        const labelContainer = form.closest('.box').querySelector('.label');
        //on récupère les ids de la carte et du label
        const cardId = parseInt(form.closest('.box').getAttribute('data-card-id'));
        const labelId = form.labels.value;

        try {
            //on ajoute l'entrée en base de données
            const result = await fetch(`${labelModule.base_url}/cards/${cardId}/labels/${labelId}`, {
                method: 'POST'
            });

            if (result.ok) {
                const json = await result.json();
                //on supprime tous les labels de la carte
                if (json.id === cardId) {
                    event.target.closest('.box').querySelectorAll('.tag').forEach(label => {
                        label.remove()
                    });
                    //on insère les labels avec le dernier ajouté
                    json.labels.forEach(label => {
                        labelModule.makeLabelInDOM(label)
                    });
                } else {
                    console.error('Label non associé');
                }
            } else {
                console.error('On a eu un pépin sur le serveur');
            }
        } catch (error) {
            console.error('Impossible d\'associer le label', error);
        } finally {
            //on cache le formulaire et réafiche les labels associés
            labelContainer.classList.remove('is-hidden');
            form.classList.add('is-hidden');
        }

    },

    dissociateLabel: async event => {

        const cardId = parseInt(event.target.closest('.box').getAttribute('data-card-id'));
        const labelId = event.target.closest('.tag').getAttribute('data-label-id');

        try {
            //on supprime l'entrée en base de données
            const result = await fetch(`${labelModule.base_url}/cards/${cardId}/labels/${labelId}`, {
                method: 'DELETE'
            });

            if (result.ok) {
                //on supprime le label
                event.target.closest('.tag').remove();
            } else {
                console.error('On a eu un pépin sur le serveur');
            }
        } catch (error) {
            console.error('Impossible de dissocier le label', error);
        }
    },

    showAddLabelModal: event => {
        const div = document.getElementById('addLabelModal');
        div.classList.add('is-active');
    },

    showModifyRemoveLabelModal: async event => {
        const div = document.getElementById('modifyRemoveLabelModal');
        const options = document.querySelectorAll('#modifyLabel option');
        //on supprime les options de la liste déroulante
        options.forEach(option => {
            option.remove();
        });

        try {
            const result = await fetch(`${labelModule.base_url}/labels`, {
                method: 'GET'
            });

            if (result.ok) {
                const json = await result.json();
                //on met à jour les options de la liste déroulante
                json.forEach(label => {
                    const option = document.createElement('option');
                    option.value = label.id;
                    option.textContent = label.name;
                    document.querySelector('#modifyLabel').appendChild(option);
                });

                div.classList.add('is-active');
            } else {
                console.error('On a eu un pépin sur le serveur');
            }
        } catch (error) {
            console.error('Impossible d\'obtenir les labels', error);
        }
    },

    handleAddLabelForm: async event => {
        event.preventDefault();
        //on récupère les données du formulaire
        const formData = new FormData(event.target);

        try {
            //on ajoute l'entrée en base de données
            const result = await fetch(`${labelModule.base_url}/labels`, {
                method: 'POST',
                body: formData
            });

            if (!result.ok) {
                console.error('On a eu un pépin sur le serveur');
            }

        } catch (error) {
            console.error('Impossible d\'ajouter le label', error);
        }
    },

    handleModifyRemoveLabelForm: async event => {
        event.preventDefault();
        //on récupère les données du formulaire et l'id du label
        const formData = new FormData(event.target);
        const labelId = event.target.modifyLabel.value;

        if (!event.target.deleteLabel.checked) {

            try {
                //si la case "supprimer le label" n'est pas coché, on modifie l'entrée en base de données
                const result = await fetch(`${labelModule.base_url}/labels/${labelId}`, {
                    method: 'PATCH',
                    body: formData
                });
    
    
                if (result.ok) {
                    const response = await result.json();

                    if (response === 1) {
                        //on récupère toutes les occurences existantes du label pour les mettre à jour
                        const existingOccurences = document.querySelectorAll(`.tag[data-label-id="${labelId}"]`);
                        for (const occurence of existingOccurences) {
                            occurence.textContent = formData.get('name');
                            occurence.style.backgroundColor = formData.get('color');
                            //on rajoute le bouton de suppression son eventlistener
                            const button = document.createElement('button');
                            button.classList.add('delete');
                            button.classList.add('is-small');

                            button.addEventListener('click', labelModule.dissociateLabel);

                            occurence.appendChild(button);
                        }
                    }
                } else {
                    console.error('On a eu un pépin sur le serveur');
                }
    
    
            } catch (error) {
                console.error('Impossible de mettre à jour le label', error);
            }

        } else {

            try {
                //la case "supprimer le label" est coché, on retire l'entrée de la base de données
                const result = await fetch(`${labelModule.base_url}/labels/${labelId}`, {
                    method: 'DELETE',
                });
    
                if (result.ok) {
                    //on met à jour le DOM pour enlever les occurences existantes du label qu'on vient de supprimer
                    const occurences = document.querySelectorAll(`.tag[data-label-id="${labelId}"]`);
                    for (const occurence of occurences) {
                        occurence.remove();
                    }
                } else {
                    console.error('On a eu un pépin sur le serveur');
                }
    
    
            } catch (error) {
                console.error('Impossible de mettre à jour le label', error);
            }

        }

    },
}

module.exports = labelModule;
},{}],4:[function(require,module,exports){
const cardModule = require('./cardModule');

const listModule = {

    base_url: null,

    setBaseUrl: url => {
        listModule.base_url = url;
    },

    showAddListModal: () => {
        const div = document.getElementById('addListModal');
        div.classList.add('is-active');
    },

    handleAddListForm: async event => {
        //on désactive le comportement par défaut
        event.preventDefault();
        //on récupère les data du formulaire dans un FormData qui va nous faciliter la vie
        //FormData est capable d'extraire tous les inputs d'une balise <form> quelque soit leur niveau d'imbrication dans le html
        const formData = new FormData(event.target);

        //on donne une valeur au champ position de notre nouvelle liste
        const position = document.querySelectorAll('.panel').length;
        formData.set('position', position);

        try {

            //on utilise fetch en POST pour envoyer les infos à l'API et ajouter la nouvelle liste en BDD
            const result = await fetch(`${listModule.base_url}/lists`, {
                method: 'POST',
                body: formData
            });

            if (result.ok) {
                const json = await result.json();
                listModule.makeListInDOM(json);
            } else {
                console.error('On a eu un pépin sur le serveur');
            }

        } catch (error) {
            console.error('Impossible d\'ajouter la liste', error);
        }
    },

    makeListInDOM: data => {
        //on récupère le template
        const template = document.getElementById('listTemplate');
        //on va créer le nouveau noeud html en clonant le template ET en incluant tous les éléments qu'il contient
        const node = document.importNode(template.content, true);

        //on utilise cetet fois l'object JSON qu'on a reçu en paramètre pour configurer notre nouvel élément HTML
        const h2 = node.querySelector('h2');
        h2.textContent = data.name;
        //on fait réagir le h2 au doubleclick pour afficher le formulaire de modif
        h2.addEventListener('dblclick', listModule.showListNameForm);

        //on ajoute un EventListener sur l'événement submit du formulaire de modif
        node.querySelector('form').addEventListener('submit', listModule.handleListNameForm);


        //on profite de l'étape de création de la liste pour mettre à jour les infos des balises avec les data qu'on a obtenu de la BDD : name et list_id
        node.querySelector('.panel').setAttribute('data-list-id', data.id);

        //on profite encore une fois de l'étape de création de la liste pour mettre à jour le champ caché du formulaire de modif list-id
        node.querySelector('[name="list-id"]').value = data.id

        //on ajoute pour la nouvelle liste la fonctionnalité pour ajouter une carte
        //En effet, cette fonctionnalité est appliquée aux listes existantes au chargement de la page, pas sur les nouvelles
        node.querySelector('.button--add-card').addEventListener('click', cardModule.showAddCardModal);

        node.querySelector('.button--remove-list').addEventListener('click', listModule.deleteList);
        //on ajoute le noeud html au bon endroit, en 1ère position de la liste de listes
        //on est obligé d'ajouter un test pour vérifier si la page contient déjà au moins une liste
        //Si c'est le cas, on peut la sélectionner et utiliser before pour ajouter la nouvelle liste
        //Sinon, on doit sélectionner le container des listes et utiliser appendChild pour insérer la 1ère liste
        const firstList = document.querySelector('.is-one-quarter');

        if (firstList) {
            firstList.before(node);
        } else {
            document.querySelector('.card-lists').appendChild(node);
        }

    },

    showListNameForm: event => {
        //on masque le h2, on en a une référence dans event.target
        event.target.classList.add('is-hidden');
        //pour récupérer le formulaire, on doit partir du h2, la seule référence à un élément html dont on dispose ici
        //on utilise la méthode .closest pour remonter dans l'arborescence html jusqu'à un élément qui contient le formulaire qu'on cherche à cibler
        const form = event.target.closest('.column').querySelector('form');
        //on affiche le formulaire
        form.classList.remove('is-hidden');
        //on met en value de l'input name le contenu du h2
        form.querySelector('[name="name"]').value = event.target.textContent;
    },

    handleListNameForm: async event => {
        event.preventDefault();
        //générer un FormData à partir du formulaire

        const formData = new FormData(event.target);

        //on checke si l'utilisateur a bien saisi quelque chose dans le champ name
        //si c'est pas le cas, on sort de la fonction en affichant une erreur
        if (formData.get('name') === '') {
            console.error('Veuillez saisir un nom pour cette liste');
            //on utilise le mot-clé return pour sortir de la fonction sans exécuter le reste du code
            return;
        }

        const h2 = event.target.closest('.panel').querySelector('h2');

        //on va faire une mise à jour de la liste avec fetch
        try {
            //on mettra à jour le nom de la liste dans le DOM
            const result = await fetch(`${listModule.base_url}/lists/${formData.get('list-id')}`, {
                method: 'PATCH',
                body: formData
            });

            if (result.ok) {
                const json = await result.json();
                //si l'API nous répond avec le nombre 1, c'est que tout s'est bien passé
                //sinon, on affiche un message d'erreur
                if (json === 1) {
                    h2.textContent = formData.get('name');
                } else {
                    console.error('Mise à jour impossible, vérifiez les logs du serveur');
                }
            } else {
                console.error('On a eu pépin sur le serveur');
            }

        } catch (error) {
            console.error('Impossible de mettre la liste à jour', error);
        } finally {
            //on masque le formulaire
            event.target.classList.add('is-hidden');
            //on réaffiche le h2
            h2.classList.remove('is-hidden');

        }
    },

    deleteList: async event => {

        try {
            const result = await fetch(`${listModule.base_url}/lists/${event.target.closest('.panel').getAttribute('data-list-id')}`, {
                method: 'DELETE'
            });

            if (result.ok) {
                const json = await result.json();
                if (json) {
                    event.target.closest('.panel').remove();
                } else {
                    console.error('Liste non supprimée');
                }
            } else {
                console.error('On a eu un pépin sur le serveur');
            }
        } catch (error) {
            console.error('Impossible de supprimer la liste', error);
        }
    },
}

module.exports = listModule;
},{"./cardModule":2}]},{},[1]);
