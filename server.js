//Framework web para Node.js.
const express = require('express');
//Motor de plantillas Handlebars para Express.
const { engine } = require('express-handlebars');
//Cliente de PostgreSQL para Node.js.
const { Client } = require('pg');
//Librería para trabajar con JSON Web Tokens.
const jwt = require('jsonwebtoken');
//Middleware para manejar la subida de archivos en Express.
const fileUpload = require('express-fileupload');

const app = express();
// ruta principal donde se carga el html
app.get('/', (req, res) => {
   
});
// salida del html
app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});