// index.js

require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());


app.use(cors());


app.use(express.json());


app.use(express.urlencoded({ extended: true }));



app.get('/health', (req, res) => {
  res.json({ message: 'viva peron.' });
});




const authRoutes = require('./src/routes/auth.routes');
const pageRoutes = require('./src/routes/page.routes');
const linkRoutes = require('./src/routes/link.routes');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);     
app.use('/api/pages', pageRoutes);   
app.use('/api/links', linkRoutes);    


app.get('/api/rutas', (req, res) => {
  res.status(200).json(listEndpoints(app));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`-> Accede en http://localhost:${PORT}`);
});