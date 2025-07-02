import express from 'express';
import cors from 'cors';
import { getProductionOrders } from './odoo.js'; // O como lo hayas llamado

const app = express();
app.use(cors());

app.get('/api/productionorders', async (req, res) => {
  try {
    const orders = await getProductionOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'No se pudieron obtener las órdenes de producción' });
  }
});

// Ruta para healthcheck
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ✅ Puerto dinámico para que Render funcione
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
