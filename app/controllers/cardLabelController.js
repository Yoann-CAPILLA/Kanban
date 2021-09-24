const {Card, Label} = require('../models');


module.exports = {
    addCardLabel: async (request, response, next) => {
        //on a un id de carte et un id de label
        const {idCard, idLabel} = request.params;
        //on commence par récupérer les instances associées à ces ids

        try {
            const card = await Card.findByPk(parseInt(idCard));
            //pour transformer une string en number, on peut utiliser parseInt, Number, ou la notation raccourcie : +nomVariable
            const label = await Label.findByPk(+idLabel);
    
            if (card && label) {
                //on associe les 2 instances
                //grâce à Sequelize et aux méthodes mixins ajoutées aux instances, on peut manipuler les enregistrements de notre table de liaison card_has_tag sans avoir à écrire une seule ligne de SQL
                //Pas besoin non plus de créer un Model pour cette table de liaison, tout est géré sous le capot
                await card.addLabel(label);
                //on a découvert que ça marche aussi avec uniquement l'id de label
                //card.addLabel(idLabel);
    
                //on retourne l'instance de carte modifiée
                // la méthode .reload va recharger/rafraichir les infos stockées dans l'instance
                const carteModifiee = await card.reload({
                    include: 'labels'
                });
                response.json(carteModifiee);
    
            } else {
                next();
            }
    
        } catch(error) {
            console.error(error);
            response.status(500).json({error: error.message});
        }
    },

    deleteCardLabel: async (request, response, next) => {
        //on a un id de carte et un id de label
        const {idCard, idLabel} = request.params;

        try {
            const card = await Card.findByPk(parseInt(idCard));
            //pour transformer une string en number, on peut utiliser parseInt, Number, ou la notation raccourcie : +nomVariable
            const label = await Label.findByPk(+idLabel);
    
            if (card && label) {
                //on dissocie les 2 instances
                await card.removeLabel(label);
                //on a découvert que ça marche aussi avec uniquement l'id de label
                //card.addLabel(idLabel);
    
                //on retourne l'instance de carte modifiée
                // la méthode .reload va recharger/rafraichir les infos stockées dans l'instance
                const carteModifiee = await card.reload({
                    include: 'labels'
                });
                response.json(carteModifiee);
    
            } else {
                next();
            }

        } catch(error) {
            console.error(error);
            response.status(500).json({error: error.message});
        }
    }
};