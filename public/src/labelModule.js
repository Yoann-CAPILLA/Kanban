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