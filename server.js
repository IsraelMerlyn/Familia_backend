const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const errorHandler = require("./errorHandler");

const { swaggerUi, specs } = require('./swaggerConfig');
// Configurar el servidor
const app = express();
const port = 3000;

app.use(bodyParser.json());



// Configurar Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


// Conectar a MongoDB
mongoose.connect("mongodb://localhost:27017/casaSalud", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Definir un modelo de Mongoose para los pacientes
const FamiliaSchema = new mongoose.Schema({
  nombre: String,
  apellidoMaterno: String,
  apellidoPaterno: String,
  telefono: {
    type: String,
    required: true,
    unique: true // Asegura que el número de teléfono sea único para cada familia
},
  integrantes: [{
    nombre: String,
    apellido: String,
    edad: Number,
    ocupacion: String,
    recibeBeca: Boolean,
    diabetes: Boolean,
    obesidad: Boolean,
    alcoholismo: Boolean,
    vacunado: Boolean
}]
});

const Familia = mongoose.model("Familia", FamiliaSchema);

/**
 * @swagger
 * components:
 *   schemas:
 *     Integrante:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           description: Nombre del integrante
 *         apellido:
 *           type: string
 *           description: Apellido del integrante
 *         edad:
 *           type: integer
 *           description: Edad del integrante
 *         ocupacion:
 *           type: string
 *           description: Ocupación del integrante
 *         recibeBeca:
 *           type: boolean
 *           description: Si el integrante recibe beca
 *         diabetes:
 *           type: boolean
 *           description: Si el integrante tiene diabetes
 *         obesidad:
 *           type: boolean
 *           description: Si el integrante tiene obesidad
 *         alcoholismo:
 *           type: boolean
 *           description: Si el integrante tiene alcoholismo
 *         vacunado:
 *           type: boolean
 *           description: Si el integrante está vacunado
 *     Familia:
 *       type: object
 *       required:
 *         - nombre
 *         - apellidoMaterno
 *         - apellidoPaterno
 *         - telefono
 *         - integrantes
 *       properties:
 *         nombre:
 *           type: string
 *           description: Nombre del jefe de familia
 *         apellidoMaterno:
 *           type: string
 *           description: Apellido materno del jefe de familia
 *         apellidoPaterno:
 *           type: string
 *           description: Apellido paterno del jefe de familia
 *         telefono:
 *           type: string
 *           description: Teléfono de contacto
 *         integrantes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Integrante'
 */



/**
 * @swagger
 * /api/familias:
 *   get:
 *     summary: Obtiene todas las familias
 *     tags: [Familias]
 *     responses:
 *       200:
 *         description: Lista de familias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Familia'
 *       500:
 *         description: Error del servidor
 */

app.get("/api/familias", async (req, res, next) => {
  try {
    const familias = await Familia.find();
    res.status(200).send(familias);
  } catch (error) {
    next(error);
  }
});



/**
 * @swagger
 * /api/familias:
 *   post:
 *     summary: Crea una nueva familia
 *     tags: [Familias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Carlos"
 *               apellidoMaterno:
 *                 type: string
 *                 example: "Martínez"
 *               apellidoPaterno:
 *                 type: string
 *                 example: "Gómez"
 *               telefono:
 *                 type: string
 *                 example: "555-1234"
 *               integrantes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       example: "Ana"
 *                     apellido:
 *                       type: string
 *                       example: "Martínez Gómez"
 *                     edad:
 *                       type: integer
 *                       example: 35
 *                     ocupacion:
 *                       type: string
 *                       example: "Ingeniera"
 *                     recibeBeca:
 *                       type: boolean
 *                       example: false
 *                     diabetes:
 *                       type: boolean
 *                       example: true
 *                     obesidad:
 *                       type: boolean
 *                       example: false
 *                     alcoholismo:
 *                       type: boolean
 *                       example: false
 *                     vacunado:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       201:
 *         description: Familia creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Familia'
 *       400:
 *         description: Error al crear la familia (número de teléfono duplicado o error en los datos)
 *       500:
 *         description: Error del servidor
 */

// Endpoint para crear una nueva familia
app.post('/api/familias', async (req, res) => {
    try {
        const { telefono, integrantes } = req.body;
        
        // Validar si el teléfono de la familia ya existe
        const existingFamilia = await Familia.findOne({ telefono });
        if (existingFamilia) {
            return res.status(400).send({ message: 'El número de teléfono de la familia ya está en uso' });
        }

        // Validar si algún integrante tiene un teléfono duplicado
        for (const integrante of integrantes) {
            if (integrante.telefono) {
                const existingIntegrante = await Familia.findOne({ 'integrantes.telefono': integrante.telefono });
                if (existingIntegrante) {
                    return res.status(400).send({ message: `El número de teléfono del integrante ${integrante.nombre} ya está en uso` });
                }
            }
        }

        const familia = new Familia(req.body);
        await familia.save();
        res.status(201).send(familia);
    } catch (error) {
        res.status(400).send({ message: 'Error al crear la familia', error });
    }
});


/**
 * @swagger
 * /api/familias/{id}:
 *   get:
 *     summary: Obtiene una familia por ID
 *     tags: [Familias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la familia
 *     responses:
 *       200:
 *         description: Familia encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Familia'
 *       404:
 *         description: No se encontró el recurso solicitado
 */

app.get("/api/familias/:id", async (req, res, next) => {
    try {
      const familia = await Familia.findById(req.params.id);
      if (!familia) {
        return res
          .status(404)
          .json({ error: "No se encontró el recurso solicitado" });
      }
      res.status(200).send(familia);
    } catch (error) {
      next(error);
    }
  });
  

/**
 * @swagger
 * /api/familias/{id}:
 *   put:
 *     summary: Actualiza una familia existente
 *     tags: [Familias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la familia a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Carlos"
 *               apellidoMaterno:
 *                 type: string
 *                 example: "Martínez"
 *               apellidoPaterno:
 *                 type: string
 *                 example: "Gómez"
 *               telefono:
 *                 type: string
 *                 example: "555-5678"
 *               integrantes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       example: "Ana"
 *                     apellido:
 *                       type: string
 *                       example: "Martínez Gómez"
 *                     edad:
 *                       type: integer
 *                       example: 35
 *                     ocupacion:
 *                       type: string
 *                       example: "Ingeniera"
 *                     recibeBeca:
 *                       type: boolean
 *                       example: false
 *                     diabetes:
 *                       type: boolean
 *                       example: true
 *                     obesidad:
 *                       type: boolean
 *                       example: false
 *                     alcoholismo:
 *                       type: boolean
 *                       example: false
 *                     vacunado:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       200:
 *         description: Familia actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Familia'
 *       400:
 *         description: Error al actualizar la familia (número de teléfono duplicado o error en los datos)
 *       404:
 *         description: Familia no encontrada
 *       500:
 *         description: Error del servidor
 */

// Endpoint para actualizar una familia
app.put('/api/familias/:id', async (req, res) => {
    try {
        const { telefono, integrantes } = req.body;
        const { id } = req.params;

        // Validar si el teléfono de la familia ya existe
        const existingFamilia = await Familia.findOne({ telefono, _id: { $ne: id } });
        if (existingFamilia) {
            return res.status(400).send({ message: 'El número de teléfono de la familia ya está en uso' });
        }

        // Validar si algún integrante tiene un teléfono duplicado
        for (const integrante of integrantes) {
            if (integrante.telefono) {
                const existingIntegrante = await Familia.findOne({ 'integrantes.telefono': integrante.telefono, _id: { $ne: id } });
                if (existingIntegrante) {
                    return res.status(400).send({ message: `El número de teléfono del integrante ${integrante.nombre} ya está en uso` });
                }
            }
        }

        const familia = await Familia.findByIdAndUpdate(id, req.body, { new: true });
        if (!familia) {
            return res.status(404).send({ message: 'Familia no encontrada' });
        }
        res.status(200).send(familia);
    } catch (error) {
        res.status(400).send({ message: 'Error al actualizar la familia', error });
    }
});




/**
 * @swagger
 * /api/integrantes/enfermedades:
 *   get:
 *     summary: Obtiene todos los integrantes con diabetes, obesidad o alcoholismo
 *     tags: [Integrantes]
 *     responses:
 *       200:
 *         description: Lista de integrantes con enfermedades crónicas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Integrante'
 *       500:
 *         description: Error del servidor
 */
app.get('/api/integrantes/enfermedades', async (req, res, next) => {
    try {
        const familias = await Familia.find({
            $or: [
                { 'integrantes.diabetes': true },
                { 'integrantes.obesidad': true },
                { 'integrantes.alcoholismo': true }
            ]
        });
        const integrantes = familias.flatMap(familia => familia.integrantes.filter(integrante => 
            integrante.diabetes || integrante.obesidad || integrante.alcoholismo
        ));
        res.status(200).send(integrantes);
    } catch (error) {
        next(error); // Pasar el error al middleware
    }
});



/**
 * @swagger
 * /api/familias/{id}:
 *   delete:
 *     summary: Elimina una familia por ID
 *     tags: [Familias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la familia
 *     responses:
 *       200:
 *         description: Familia eliminada
 *       404:
 *         description: No se encontró el recurso solicitado
 */






app.delete("/api/familias/:id", async (req, res, next) => {
  try {
    const familia = await Familia.findByIdAndDelete(req.params.id);
    if (!familia) {
      return res
        .status(404)
        .json({ error: "No se encontró el recurso solicitado" });
    }
    res.status(200).send(familia);
  } catch (error) {
    next(error);
  }
});


/**
 * @swagger
 * /api/familias/{familiaId}/integrantes/{integranteId}:
 *   delete:
 *     summary: Elimina un integrante de una familia
 *     tags: [Familias]
 *     parameters:
 *       - in: path
 *         name: familiaId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la familia
 *       - in: path
 *         name: integranteId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del integrante
 *     responses:
 *       200:
 *         description: Integrante eliminado correctamente
 *       404:
 *         description: No se encontró el recurso solicitado
 *       500:
 *         description: Error del servidor
 */


// Endpoint para eliminar un integrante de una familia
app.delete('/api/familias/:familiaId/integrantes/:integranteId', async (req, res) => {
    try {
        const { familiaId, integranteId } = req.params;
        const familia = await Familia.findById(familiaId);
        if (!familia) {
            return res.status(404).send({ message: 'Familia no encontrada' });
        }

        const integranteIndex = familia.integrantes.findIndex(integrante => integrante._id.toString() === integranteId);
        if (integranteIndex === -1) {
            return res.status(404).send({ message: 'Integrante no encontrado' });
        }

        familia.integrantes.splice(integranteIndex, 1);
        await familia.save();
        res.status(200).send({ message: 'Integrante eliminado correctamente', familia });
    } catch (error) {
        res.status(500).send({ message: 'Error al eliminar el integrante', error });
    }
});
/**
 * @swagger
 * /api/integrantes/diabetes:
 *   get:
 *     summary: Obtiene todos los integrantes con diabetes
 *     tags: [Integrantes]
 *     responses:
 *       200:
 *         description: Lista de integrantes con diabetes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Integrante'
 *       500:
 *         description: Error del servidor
 */
app.get('/api/integrantes/diabetes', async (req, res, next) => {
    try {
        const familias = await Familia.find({ 'integrantes.diabetes': true });
        const integrantes = familias.flatMap(familia => familia.integrantes.filter(integrante => integrante.diabetes));
        res.status(200).send(integrantes);
    } catch (error) {
        next(error); // Pasar el error al middleware
    }
});

/**
 * @swagger
 * /api/integrantes/obesidad:
 *   get:
 *     summary: Obtiene todos los integrantes con obesidad
 *     tags: [Integrantes]
 *     responses:
 *       200:
 *         description: Lista de integrantes con obesidad
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Integrante'
 *       500:
 *         description: Error del servidor
 */
app.get('/api/integrantes/obesidad', async (req, res, next) => {
    try {
        const familias = await Familia.find({ 'integrantes.obesidad': true });
        const integrantes = familias.flatMap(familia => familia.integrantes.filter(integrante => integrante.obesidad));
        res.status(200).send(integrantes);
    } catch (error) {
        next(error); // Pasar el error al middleware
    }
});


/**
 * @swagger
 * /api/integrantes:
 *   get:
 *     summary: Obtiene los integrantes filtrados por ocupación
 *     tags: [Integrantes]
 *     parameters:
 *       - in: query
 *         name: ocupacion
 *         schema:
 *           type: string
 *         required: true
 *         description: Ocupación por la cual filtrar los integrantes
 *     responses:
 *       200:
 *         description: Integrantes obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                     example: "Ana"
 *                   apellido:
 *                     type: string
 *                     example: "Martínez Gómez"
 *                   edad:
 *                     type: integer
 *                     example: 35
 *                   ocupacion:
 *                     type: string
 *                     example: "Ingeniera"
 *                   recibeBeca:
 *                     type: boolean
 *                     example: false
 *                   diabetes:
 *                     type: boolean
 *                     example: true
 *                   obesidad:
 *                     type: boolean
 *                     example: false
 *                   alcoholismo:
 *                     type: boolean
 *                     example: false
 *                   vacunado:
 *                     type: boolean
 *                     example: true
 *       400:
 *         description: Error al obtener los integrantes (parámetro de ocupación requerido)
 *       500:
 *         description: Error del servidor
 */

app.get('/api/integrantes', async (req, res) => {
    try {
        const { ocupacion } = req.query;

        if (!ocupacion) {
            return res.status(400).send({ message: 'El parámetro de ocupación es requerido' });
        }

        // Busca las familias cuyos integrantes tienen la ocupación especificada
        const familias = await Familia.find({ 'integrantes.ocupacion': ocupacion });
        const integrantes = familias.flatMap(familia =>
            familia.integrantes.filter(integrante => integrante.ocupacion === ocupacion)
        );

        res.status(200).send(integrantes);
    } catch (error) {
        res.status(500).send({ message: 'Error al obtener los integrantes', error });
    }
});




app.use(errorHandler);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
