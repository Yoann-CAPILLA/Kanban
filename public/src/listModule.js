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