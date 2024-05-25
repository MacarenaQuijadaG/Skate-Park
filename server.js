//Framework web para Node.js.
const express = require('express');
//Motor de plantillas Handlebars para Express.
const { engine } = require('express-handlebars');
//Cliente de PostgreSQL para Node.js.
const { Pool } = require('pg');
//Librería para trabajar con JSON Web Tokens.
const jwt = require('jsonwebtoken');
//Middleware para manejar la subida de archivos en Express.
const fileUpload = require('express-fileupload');
//middleware que analiza el cuerpo de las solicitudes entrantes.
const bodyParser = require('body-parser');
//constante que se utiliza como clave secreta para firmar y verificar JWT
const bcrypt = require('bcryptjs');
//
const SECRET_KEY = 'key';

const app = express();
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
// ruta principal donde se carga el html
app.get('/', (req, res) => {
   
});
// salida del html
app.listen(3000, () => {
    console.log('Servidor en el puerto 3000');
});

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'skatepark',
    password: 'desarrollo',
    port: 5432,
});

