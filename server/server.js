import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Recréer __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Configuration CORS
app.use(cors({
  origin: 'http://localhost:3000', // Autorise uniquement le frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes HTTP autorisées
  allowedHeaders: ['Content-Type', 'Authorization'], // En-têtes autorisés
  credentials: true, // Si des cookies ou des autorisations doivent être envoyés
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const password = "CSM4n4g3r!!"; // Ton mot de passe
const hashedPassword = bcrypt.hashSync(password, 10);
console.log("Mot de passe haché :", hashedPassword);

dotenv.config();

const PORT = 3001; 

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurer la connexion MySQL
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Configurer le stockage des fichiers
const upload = multer({ dest: 'uploads/' });

// Générer une clé API
app.post('/generate-key', async (req, res) => {
  const { password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (bcrypt.compareSync(process.env.ADMIN_PASSWORD, hashedPassword)) {
    const key = jwt.sign({ admin: true }, process.env.SECRET, { expiresIn: '1y' });
    await db.query('INSERT INTO api_keys (`key`) VALUES (?)', [key]);
    res.json({ key });
  } else {
    res.status(401).json({ message: 'Mot de passe incorrect' });
  }
});

// Ajouter une photo via l'API
app.post('/api/photos', upload.single('photo'), async (req, res) => {
  try {
    const { key, folder } = req.body;

    // Vérifie la clé API
    const [apiKey] = await db.query('SELECT * FROM api_keys WHERE `key` = ?', [key]);
    if (!apiKey.length) {
      return res.status(401).json({ message: 'Clé API invalide' });
    }

    // Lit le fichier en binaire
    const fileData = fs.readFileSync(req.file.path);

    // Sauvegarde dans la base de données
    const filename = req.file.originalname; // Nom d'origine
    await db.query('INSERT INTO photos (filename, folder, file_data) VALUES (?, ?, ?)', [
      filename, folder, fileData,
    ]);

    // Supprime le fichier temporaire
    fs.unlinkSync(req.file.path);

    res.json({ message: 'Photo ajoutée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’ajout de la photo :', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

app.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Récupère le fichier depuis la base de données
    const [rows] = await db.query('SELECT filename, file_data FROM photos WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Fichier introuvable' });
    }

    const { filename, file_data } = rows[0];

    // Retourne le fichier
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(file_data);
  } catch (error) {
    console.error('Erreur lors de la récupération du fichier :', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});




// Supprimer une photo via l'API
app.post('/api/photos', upload.single('photo'), async (req, res) => {
  try {
    const { key, folder } = req.body;

    // Vérifie la validité de la clé API
    const [apiKey] = await db.query('SELECT * FROM api_keys WHERE `key` = ?', [key]);
    if (!apiKey.length) {
      return res.status(401).json({ message: 'Clé API invalide' });
    }

    // Gère le fichier uploadé
    const filename = req.file.filename; // Nom généré par multer
    const filepath = path.join(__dirname, 'uploads', filename); // Définir filepath ici

    // Insère les informations dans la base de données
    await db.query('INSERT INTO photos (filename, folder) VALUES (?, ?)', [filename, folder]);

    res.json({ message: 'Photo ajoutée', filepath });
  } catch (error) {
    console.error('Erreur lors de l’ajout de la photo :', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});


// Interface graphique protégée par mot de passe
app.post('/login', async (req, res) => {
  console.log('Requête reçue pour /login :', req.body);
  const { password } = req.body;

  if (bcrypt.compareSync(password, process.env.ADMIN_PASSWORD)) {
    const token = jwt.sign({ admin: true }, process.env.SECRET, { expiresIn: '1h' });
    console.log('Connexion réussie, token généré :', token);
    res.json({ token });
  } else {
    console.log('Mot de passe incorrect');
    res.status(401).json({ message: 'Mot de passe incorrect' });
  }
});


// Middleware pour vérifier le token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Accès refusé' });

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    next();
  });
};

// Route pour afficher la galerie
app.get('/gallery', authenticateToken, async (req, res) => {
  const [photos] = await db.query('SELECT * FROM photos');
  res.json(photos);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
