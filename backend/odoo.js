import Odoo from 'odoo-xmlrpc';

// ⚠️ Reemplaza estos valores por los reales de tu instancia Odoo
const odoo = new Odoo({
    url: 'https://hidro.chronosps.app/',
    port: 443,
    db: 'hidrotest',
    username: 'simon@chronosps.cl',
    password: '6010ad7229d4653763058abaae61e0607f4b8e74'

});

// Función para obtener órdenes de producción
export const getProductionOrders = () =>
  new Promise((resolve, reject) => {
    odoo.connect((err) => {
      if (err) {
        console.error('Error al conectar con Odoo:', err);
        return reject(err);
      }

      const inParams = [
        [], // Sin filtros por ahora
        ['name', 'product_id', 'product_qty', 'qty_produced', 'state', 'origin']
      ];
      const params = [inParams];

      odoo.execute_kw('mrp.production', 'search_read', params, async (err2, productions) => {
        if (err2) {
          console.error('Error al obtener órdenes de producción:', err2);
          return reject(err2);
        }

        // Agrupar por origin (pedido de venta)
        const grouped = {};
        const origins = [...new Set(productions.map(p => p.origin).filter(Boolean))];

        const originToClient = {};

        // Buscar los clientes asociados a los pedidos de venta
        if (origins.length > 0) {
          await new Promise((res, rej) => {
            const inParams = [
              [['name', 'in', origins]],
              ['name', 'partner_id']
            ];
            const params = [inParams];

            odoo.execute_kw('sale.order', 'search_read', params, (err3, sales) => {
              if (err3) return rej(err3);
              sales.forEach(sale => {
                originToClient[sale.name] = sale.partner_id?.[1] || 'Cliente desconocido';
              });
              res();
            });
          });
        }

        // Armar la estructura final agrupada
        for (const order of productions) {
          const origin = order.origin || 'Sin Pedido';
          const progress = order.qty_produced && order.product_qty
            ? (order.qty_produced / order.product_qty) * 100
            : 0;

          const item = {
            name: order.name,
            product: order.product_id?.[1] || '',
            qty_total: order.product_qty,
            qty_done: order.qty_produced,
            state: order.state,
            progress: progress.toFixed(2),
            cliente: originToClient[order.origin] || 'N/D'
          };

          if (!grouped[origin]) grouped[origin] = [];
          grouped[origin].push(item);
        }

        const final = Object.entries(grouped).map(([pedido, ordenes]) => ({
          pedido,
          ordenes
        }));

        resolve(final);
      });
    });
  });