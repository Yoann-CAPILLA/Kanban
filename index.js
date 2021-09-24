require('dotenv').config();
const express = require('express');
const router = require('./app/router');
const app = express();
const PORT = process.env.PORT;

app.use(express.urlencoded({extended: true}));

const multer = require('multer');
const upload = multer()
app.use(upload.none());

app.use(express.static('./public'));

app.use(router);

app.use((req, res) => {
    res.status(404).json({error: 'Ressource non trouvée'});
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});