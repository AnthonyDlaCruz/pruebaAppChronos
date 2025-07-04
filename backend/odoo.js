import Odoo from 'odoo-xmlrpc';


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

        // ✅ Extraer todos los origin únicos con valor definido
        const origins = [...new Set(
          productions
            .map(p => p.origin)
            .filter(origin => origin) // Solo que tengan valor
        )];

        const originToSale = {};

        // Buscar info en sale.order para cada origin
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
                originToSale[sale.name] = {
                  cliente: sale.partner_id?.[1] || 'Cliente desconocido',
                  nota_venta: sale.name
                };
              });
              res();
            });
          });
        }

        // Agrupar órdenes por nota de venta
        const grouped = {};

        for (const order of productions) {
          const origin = order.origin || 'Sin nota de venta';
          const saleData = originToSale[origin]; // puede ser undefined

          const agrupador = saleData?.nota_venta || 'Sin nota de venta';

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
            cliente: saleData?.cliente || 'N/A',
            nota_venta: agrupador
          };

          if (!grouped[agrupador]) grouped[agrupador] = [];
          grouped[agrupador].push(item);
        }

        const final = Object.entries(grouped).map(([pedido, ordenes]) => ({
          pedido,
          ordenes
        }));

        resolve(final);
      });
    });
  });
