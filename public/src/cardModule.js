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