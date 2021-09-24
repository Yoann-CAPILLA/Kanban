const models = require('../models');

module.exports = mainController = {
    getClass: (req) => {
        //on récupère le nom de la classe contenu dans l'URL en passant la 1ère lettre en majuscule et en supprimant le dernier "s"
        // ex: cards --> Card
        const pathName = req.url.split('/');
        const modelName = pathName[1].charAt(0).toUpperCase() + pathName[1].slice(1, pathName[1].length - 1);
        //on renvoie le modèle adéquat pour la factorisation
        return models[modelName];
    },

    show: async (req, res, next) => {
        //on récupère le modèle pour la requête
        const model = mainController.getClass(req);

        try {
            //SELECT * FROM card, label ou list
            const entities = await model.findAll({
                include: {
                    all: true,
                    nested: true
                }
            });

            if (entities) { //on vérifie s'il y a bien un résultat
                res.json(entities);
            } else {
                next()
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({error: error.message});
        }
    },

    get: async (req, res, next) => {
        const model = mainController.getClass(req);
        //récupérer l'id de la carte à trouver au format number
        const id = parseInt(req.params.id);

        try {
            //SELECT * FROM card WHERE card_id = $1
            const entity = await model.findByPk(id, {
                include: {
                    all: true,
                    nested: true
                }
            });

            if (entity) {
                res.json(entity);
            } else {
                next()
            }
            
        } catch (error) {
            console.error(error);
            res.status(500).json({error: error.message});
        }
    },

    add: async (req, res) => {
        const model = mainController.getClass(req);

        try {
            //on crée une nouvelle entrée avec les infos contenues dans le body
            const newEntity = await model.create(req.body);
            res.json(newEntity);

        } catch (error) {
            console.error(error);
            res.status(500).json({error: error.message});
        }
    },

    update: async (req, res, next) => {
        const model = mainController.getClass(req);
        const id = parseInt(req.params.id);

        try {
            //on met à jour les infos de l'entrée selon son id
            const result = await model.update(req.body, {where: {id}});

            if (result[0] >= 1) {
                res.json(result[0]);
            } else {
                next()
            }
            
        } catch (error) {
            console.error(error);
            res.status(500).json({error: error.message});
        }
    },

    delete: async (req, res, next) => {
        const model = mainController.getClass(req);
        const id = parseInt(req.params.id);

        try {
            //on supprime l'entrée selon son id
            const result = await model.destroy({where: {id}});

            if (result >= 1) {
                res.json(result);
            } else {
                next()
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({error: error.message});
        }
    }
};