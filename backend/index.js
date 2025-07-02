import express from 'express';
import cors from 'cors';
import { getProductionOrders } from './odoo.js'; // O como lo hayas llamado

const app = express(); // ✅ Definir app aquí
app.use(cors());

// ✅ Luego sí puedes usar `app.get`
app.get('/api/productionorders', async (req, res) => {
  try {
    const orders = await getProductionOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'No se pudieron obtener las órdenes de producción' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
