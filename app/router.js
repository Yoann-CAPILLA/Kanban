const express = require('express');
const router = express.Router();

const mainController = require('./controllers/mainController');
const cardLabelController = require('./controllers/cardLabelController');

router.get('/lists', mainController.show)
    .post('/lists', mainController.add);

router.get('/lists/:id', mainController.get)
    .patch('/lists/:id', mainController.update)
    .delete('/lists/:id', mainController.delete);

router.get('/cards', mainController.show)
    .post('/cards', mainController.add);

router.get('/cards/:id', mainController.get)
    .patch('/cards/:id', mainController.update)
    .delete('/cards/:id', mainController.delete);

router.get('/labels', mainController.show)
    .post('/labels', mainController.add);

router.get('/labels/:id', mainController.get)
    .patch('/labels/:id', mainController.update)
    .delete('/labels/:id', mainController.delete);

router.post('/cards/:idCard/labels/:idLabel', cardLabelController.addCardLabel)
    .delete('/cards/:idCard/labels/:idLabel', cardLabelController.deleteCardLabel);

module.exports = router;