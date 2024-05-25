const express = require("express");
const app = express();
const { create } = require("express-handlebars");
const expressFileUpload = require("express-fileupload");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

const secretKey = "key";
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'skatepark',
    password: 'desarrollo',
    port: 5432,
});

// Server
app.listen(3000, () => console.log("Servidor encendido PORT 3000!"));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(
    expressFileUpload({
        limits: 5000000,
        abortOnLimit: true,
        responseOnLimit: "El tamaño de la imagen supera el límite permitido",
    })
);
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));

const hbs = create({
    defaultLayout: "main",
    layoutsDir: `${__dirname}/views/mainLayout`,
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Rutas asociadas a los handlebars
app.get("/", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters');
        res.render("Home", { skaters: result.rows });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        });
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

app.get("/login", (req, res) => {
    res.render("Login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM skaters WHERE email = $1', [email]);
        const skater = result.rows[0];
        if (skater && await bcrypt.compare(password, skater.password)) {
            const token = jwt.sign(skater, secretKey);
            res.status(200).send(token);
        } else {
            res.status(400).send("Email o contraseña incorrectos");
        }
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        });
    }
});

app.get("/Admin", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters');
        res.render("Admin", { skaters: result.rows });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        });
    }
});

// API REST de Skaters
app.get("/skaters", async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM skaters');
        res.status(200).send(result.rows);
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        });
    }
});

app.post("/skaters", async (req, res) => {
    const { email, nombre, password, anos_experiencia, especialidad } = req.body;
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No se encontró ningún archivo en la consulta");
    }
    const { foto } = req.files;
    const pathPhoto = `/uploads/${foto.name}`;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        foto.mv(`${__dirname}/public${pathPhoto}`, async (err) => {
            if (err) throw err;

            const query = `
                INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado)
                VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *;
            `;
            const values = [email, nombre, hashedPassword, anos_experiencia, especialidad, pathPhoto];
            const result = await pool.query(query, values);
            res.status(201).redirect("/");
        });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        });
    }
});

app.put("/skaters", async (req, res) => {
    const { id, nombre, anos_experiencia, especialidad } = req.body;
    try {
        const query = `
            UPDATE skaters
            SET nombre = $1, anos_experiencia = $2, especialidad = $3
            WHERE id = $4;
        `;
        const values = [nombre, anos_experiencia, especialidad, id];
        await pool.query(query, values);
        res.status(200).send("Datos actualizados con éxito");
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        });
    }
});

app.put("/skaters/status/:id", async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        const query = `
            UPDATE skaters
            SET estado = $1
            WHERE id = $2;
        `;
        const values = [estado, id];
        await pool.query(query, values);
        res.status(200).send("Estado actualizado con éxito");
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        });
    }
});

app.delete("/skaters/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            DELETE FROM skaters
            WHERE id = $1;
        `;
        await pool.query(query, [id]);
        res.status(200).send("Skater eliminado con éxito");
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        });
    }
});
