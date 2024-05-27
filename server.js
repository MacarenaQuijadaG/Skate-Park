// Importaciones
const express = require("express");
const { Pool } = require("pg");
const exphbs = require("express-handlebars");
const expressFileUpload = require("express-fileupload");
const jwt = require("jsonwebtoken");
const secretKey = "key";

// Configuración de PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'skatepark',
    password: 'desarrollo',
    port: 5432,
});

// Salida del servidor
const app = express();
app.listen(3000, () => console.log("Servidor PORT 3000!"));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(
    expressFileUpload({
        limits: 5000000,
        abortOnLimit: true,
        responseOnLimit: "El tamaño de la imagen supera el límite permitido",
        createParentPath: true // Crear la carpeta si no existe
    })
);
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));

// Configuración del motor de plantillas Handlebars
const hbs = exphbs.create({
    defaultLayout: "main",
    layoutsDir: `${__dirname}/views/mainLayout`,
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Rutas asociadas a los handlebars
app.get("/", async (req, res) => {
    try {
        const query = 'SELECT * FROM skaters';
        const { rows: skaters } = await pool.query(query);
        res.render("Home", { skaters });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/registro", (req, res) => {
    res.render("Registro");
});

app.get("/perfil", (req, res) => {
    const { token } = req.query;
    jwt.verify(token, secretKey, (err, skater) => {
        if (err) {
            res.status(500).send({
                error: `Algo salió mal...`,
                message: err.message,
                code: 500
            });
        } else {
            res.render("Perfil", { skater });
        }
    });
});
//Rutas del Login
app.get("/login", (req, res) => {
    res.render("Login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const query = 'SELECT * FROM skaters WHERE email = $1 AND password = $2';
        const { rows } = await pool.query(query, [email, password]);
        
        if (rows.length === 1) {
            const skater = rows[0];
            const token = jwt.sign(skater, secretKey);
            res.status(200).send(token);
        } else {
            res.status(401).send("Credenciales incorrectas");
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/Admin", async (req, res) => {
    try {
        const query = 'SELECT * FROM skaters';
        const { rows: skaters } = await pool.query(query);
        res.render("Admin", { skaters });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta SQL para obtener todos los skaters
app.get("/skaters", async (req, res) => {
    try {
        const query = 'SELECT * FROM skaters';
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para agregar un nuevo skater a la base de datos
app.post("/skaters", async (req, res) => {
    const skater = req.body;
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No se subió ninguna imagen.');
    }

    const { email, nombre, password, anos_experiencia, especialidad, estado = false } = skater; // Valor predeterminado para estado
    const { foto } = req.files;

    const fotoPath = `/uploads/${Date.now()}_${foto.name}`;
    const uploadPath = __dirname + '/public' + fotoPath;

    try {
        await foto.mv(uploadPath);

        const query = 'INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, $7)';
        await pool.query(query, [email, nombre, password, anos_experiencia, especialidad, fotoPath, estado]);

        res.status(201).redirect("/");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para actualizar datos de un skater
app.put("/skaters/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre, anos_experiencia, especialidad, estado } = req.body;

    if (req.files && req.files.foto) {
        const { foto } = req.files;
        const fotoPath = `/uploads/${Date.now()}_${foto.name}`;
        const uploadPath = __dirname + '/public' + fotoPath;

        try {
            await foto.mv(uploadPath);
            const query = 'UPDATE skaters SET nombre = $1, anos_experiencia = $2, especialidad = $3, foto = $4, estado = $5 WHERE id = $6';
            await pool.query(query, [nombre, anos_experiencia, especialidad, fotoPath, estado, id]);
            res.status(200).send("Datos actualizados con éxito");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        try {
            const query = 'UPDATE skaters SET nombre = $1, anos_experiencia = $2, especialidad = $3, estado = $4 WHERE id = $5';
            await pool.query(query, [nombre, anos_experiencia, especialidad, estado, id]);
            res.status(200).send("Datos actualizados con éxito");
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
});

// Ruta para actualizar el estado de un skater
app.put("/skaters/status/:id", async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const query = 'UPDATE skaters SET estado = $1 WHERE id = $2';
        const result = await pool.query(query, [estado, id]);
        
        // Verificar si se realizó la actualización correctamente
        if (result.rowCount === 1) {
            res.status(200).send("Estado actualizado con éxito");
        } else {
            res.status(404).send("Skater no encontrado");
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para eliminar un skater
app.delete("/skaters/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'DELETE FROM skaters WHERE id = $1';
        await pool.query(query, [id]);
        res.status(200).send("Skater eliminado con éxito");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
