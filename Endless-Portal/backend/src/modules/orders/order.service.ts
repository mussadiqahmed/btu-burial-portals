import pool from '../../database/db';
import { deductMaterials, restoreMaterials, resolveMaterialsFromDesign } from '../../utils/designMaterials';

const VALID_DESIGN_TYPES = ['Standard', 'Executive', 'Presidential', 'Custom'] as const;

const VALID_PAYMENT_STATUSES = ['Deposit Paid', 'Fully Paid'] as const;

export class OrderService {
  async calculateExtrasCost(data: any): Promise<number> {
    if (data.extrasDetails && Object.keys(data.extrasDetails).length > 0) {
      return Object.values(data.extrasDetails).reduce((sum: any, val: any) => sum + parseFloat(val), 0) as number;
    }

    let legacyExtrasTotal = 0.0;
    const [extras]: any = await pool.execute('SELECT extra_name, price FROM extras');
    const extrasPrices = extras.reduce((acc: any, extra: any) => {
      acc[extra.extra_name] = extra.price;
      return acc;
    }, {});

    if (data.extraBible || data.extra_bible) legacyExtrasTotal += parseFloat(extrasPrices['Bible'] || extrasPrices['Bible design'] || 0);
    if (data.extraHeart || data.extra_heart) legacyExtrasTotal += parseFloat(extrasPrices['Heart'] || extrasPrices['Heart design'] || 0);
    if (data.extraPhoto || data.extra_photo) legacyExtrasTotal += parseFloat(extrasPrices['Photo'] || extrasPrices['A4 coloured photo'] || 0);
    if (data.extraWhiteVase || data.extra_white_vase) legacyExtrasTotal += parseFloat(extrasPrices['White Vase'] || extrasPrices['Marble vase'] || 0);
    if (data.extraBlackVase || data.extra_black_vase) legacyExtrasTotal += parseFloat(extrasPrices['Black Vase'] || extrasPrices['Zim Black vase'] || 0);

    return legacyExtrasTotal;
  }

  async getDesignPrice(connection: any, data: any): Promise<number> {
    const designCode = data.designCode || data.design_code;
    const designType = data.designType || data.design_type;

    if (designCode) {
      const [rows]: any = await connection.execute('SELECT price FROM design_types WHERE code = ?', [designCode]);
      if (rows.length > 0) return parseFloat(rows[0].price);
    }
    if (designType) {
      const [rows]: any = await connection.execute(
        'SELECT price FROM design_types WHERE name = ? OR code = ?',
        [designType, designType]
      );
      if (rows.length > 0) return parseFloat(rows[0].price);
    }
    return 1000.0;
  }

  async resolveDesignType(connection: any, data: any, fallback?: string): Promise<string> {
    const designCode = data.designCode || data.design_code;
    const explicit = data.designType || data.design_type || fallback;

    if (designCode) {
      const [rows]: any = await connection.execute(
        'SELECT category FROM design_types WHERE code = ?',
        [designCode]
      );
      if (rows.length > 0 && rows[0].category && VALID_DESIGN_TYPES.includes(rows[0].category)) {
        return rows[0].category;
      }
    }

    if (explicit && VALID_DESIGN_TYPES.includes(explicit)) {
      return explicit;
    }

    if (explicit) {
      const match = VALID_DESIGN_TYPES.find(t => t.toLowerCase() === String(explicit).toLowerCase());
      if (match) return match;
    }

    return 'Standard';
  }

  normalizePaymentStatus(value?: string | null): string | null {
    if (!value || !String(value).trim()) return null;
    const match = VALID_PAYMENT_STATUSES.find(
      s => s.toLowerCase() === String(value).trim().toLowerCase()
    );
    return match || null;
  }

  async createOrder(data: any) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const extrasCost = await this.calculateExtrasCost(data);
      const isCustomOrder = !!(data.isCustomOrder || data.is_custom_order);
      const designCode = data.designCode || data.design_code || null;
      const materialFamily = data.materialFamily || data.material_family || null;

      const basePrice = await this.getDesignPrice(connection, data);

      let finalAmount = data.final_amount ?? data.finalAmount;
      if (data.botubsScheme || data.botubs_scheme) {
        finalAmount = finalAmount !== undefined && finalAmount !== null ? parseFloat(finalAmount) : 0.0;
      } else {
        if (finalAmount === undefined || finalAmount === null) {
          finalAmount = basePrice + extrasCost;
        } else {
          finalAmount = parseFloat(finalAmount) + extrasCost;
        }
      }

      let materials: Record<string, number> = data.materials || {};

      if (!isCustomOrder && designCode) {
        materials = await resolveMaterialsFromDesign(connection, designCode, materialFamily);
      }

      const materialsJson = Object.keys(materials).length > 0 ? JSON.stringify(materials) : null;
      const extrasDetailsJson = data.extrasDetails ? JSON.stringify(data.extrasDetails) : null;

      const designTypeLabel = await this.resolveDesignType(connection, data);
      const paymentStatus = this.normalizePaymentStatus(data.paymentStatus || data.payment_status);

      const [result]: any = await connection.execute(
        `INSERT INTO orders (
          client_name, contact_number, order_date, design_type, design_code, is_custom_order, material_family,
          materials, status, deposit_paid, payment_status, final_amount, due_date, delivery_date, botubs_scheme,
          custom_requirements, extra_bible, extra_heart, extra_photo, extra_white_vase,
          extra_black_vase, notes, extras_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.clientName || data.client_name,
          data.contactNumber || data.contact_number || null,
          data.orderDate || data.order_date ? new Date(data.orderDate || data.order_date) : new Date(),
          designTypeLabel,
          designCode,
          isCustomOrder ? 1 : 0,
          materialFamily,
          materialsJson,
          data.status || 'Pending',
          data.depositPaid || data.deposit_paid || null,
          paymentStatus,
          finalAmount,
          data.dueDate || data.due_date ? new Date(data.dueDate || data.due_date) : null,
          data.deliveryDate || data.delivery_date ? new Date(data.deliveryDate || data.delivery_date) : null,
          data.botubsScheme || data.botubs_scheme || false,
          data.customRequirements || data.custom_requirements || null,
          data.extraBible || data.extra_bible || false,
          data.extraHeart || data.extra_heart || false,
          data.extraPhoto || data.extra_photo || false,
          data.extraWhiteVase || data.extra_white_vase || false,
          data.extraBlackVase || data.extra_black_vase || false,
          data.notes || null,
          extrasDetailsJson
        ]
      );

      const orderId = result.insertId;

      await connection.execute(`INSERT INTO production_workflow (order_id) VALUES (?)`, [orderId]);

      if (Object.keys(materials).length > 0) {
        await deductMaterials(connection, materials);
      }

      await connection.commit();

      const [newOrder]: any = await connection.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
      return newOrder[0];
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updateOrder(id: number, data: any) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existingOrders]: any = await connection.execute('SELECT * FROM orders WHERE order_id = ?', [id]);
      if (existingOrders.length === 0) throw new Error('Order not found');

      const existing = existingOrders[0];
      const existingMaterials = existing.materials
        ? typeof existing.materials === 'string' ? JSON.parse(existing.materials) : existing.materials
        : {};

      const extrasCost = await this.calculateExtrasCost(data);
      const isCustomOrder = data.isCustomOrder !== undefined
        ? !!(data.isCustomOrder || data.is_custom_order)
        : !!existing.is_custom_order;
      const designCode = data.designCode || data.design_code || existing.design_code;
      const materialFamily = data.materialFamily || data.material_family || existing.material_family;

      const basePrice = await this.getDesignPrice(connection, { ...data, designCode, designType: data.designType || existing.design_type });

      let finalAmount = data.final_amount ?? data.finalAmount;
      if (data.botubsScheme || data.botubs_scheme) {
        finalAmount = finalAmount !== undefined && finalAmount !== null ? parseFloat(finalAmount) : 0.0;
      } else {
        if (finalAmount === undefined || finalAmount === null) {
          finalAmount = basePrice + extrasCost;
        } else {
          finalAmount = parseFloat(finalAmount) + extrasCost;
        }
      }

      let materials: Record<string, number> = data.materials || {};

      if (!isCustomOrder && designCode && !data.materials) {
        materials = await resolveMaterialsFromDesign(connection, designCode, materialFamily);
      } else if (!data.materials && isCustomOrder) {
        materials = existingMaterials;
      }

      await restoreMaterials(connection, existingMaterials);

      if (Object.keys(materials).length > 0) {
        await deductMaterials(connection, materials);
      }

      const materialsJson = Object.keys(materials).length > 0 ? JSON.stringify(materials) : null;
      const extrasDetailsJson = data.extrasDetails ? JSON.stringify(data.extrasDetails) : null;
      const designTypeLabel = await this.resolveDesignType(connection, data, existing.design_type);
      const paymentStatus = data.paymentStatus !== undefined || data.payment_status !== undefined
        ? this.normalizePaymentStatus(data.paymentStatus ?? data.payment_status)
        : existing.payment_status ?? null;

      await connection.execute(
        `UPDATE orders SET
          client_name = ?, contact_number = ?, order_date = ?, design_type = ?, design_code = ?,
          is_custom_order = ?, material_family = ?, materials = ?, status = ?, deposit_paid = ?,
          payment_status = ?, final_amount = ?, due_date = ?, delivery_date = ?, botubs_scheme = ?, custom_requirements = ?,
          extra_bible = ?, extra_heart = ?, extra_photo = ?, extra_white_vase = ?,
          extra_black_vase = ?, notes = ?, extras_details = ?
        WHERE order_id = ?`,
        [
          data.clientName || data.client_name,
          data.contactNumber || data.contact_number || null,
          data.orderDate || data.order_date ? new Date(data.orderDate || data.order_date) : existing.order_date,
          designTypeLabel,
          designCode,
          isCustomOrder ? 1 : 0,
          materialFamily,
          materialsJson,
          data.status || existing.status,
          data.depositPaid ?? data.deposit_paid ?? existing.deposit_paid,
          paymentStatus,
          finalAmount,
          data.dueDate || data.due_date ? new Date(data.dueDate || data.due_date) : existing.due_date,
          data.deliveryDate || data.delivery_date ? new Date(data.deliveryDate || data.delivery_date) : existing.delivery_date,
          data.botubsScheme ?? data.botubs_scheme ?? existing.botubs_scheme,
          data.customRequirements || data.custom_requirements || existing.custom_requirements,
          data.extraBible ?? data.extra_bible ?? existing.extra_bible,
          data.extraHeart ?? data.extra_heart ?? existing.extra_heart,
          data.extraPhoto ?? data.extra_photo ?? existing.extra_photo,
          data.extraWhiteVase ?? data.extra_white_vase ?? existing.extra_white_vase,
          data.extraBlackVase ?? data.extra_black_vase ?? existing.extra_black_vase,
          data.notes ?? existing.notes,
          extrasDetailsJson,
          id
        ]
      );

      await connection.commit();
      const [updatedOrder]: any = await connection.execute('SELECT * FROM orders WHERE order_id = ?', [id]);
      return updatedOrder[0];
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async getOrders(username?: string) {
    if (username) {
      const [rows] = await pool.execute('SELECT * FROM orders WHERE client_name = ?', [username]);
      return rows;
    }
    const [rows] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC');
    return rows;
  }

  async deleteOrder(id: number) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existingOrders]: any = await connection.execute('SELECT materials FROM orders WHERE order_id = ?', [id]);
      if (existingOrders.length === 0) throw new Error('Order not found');

      const materials = existingOrders[0].materials
        ? typeof existingOrders[0].materials === 'string'
          ? JSON.parse(existingOrders[0].materials)
          : existingOrders[0].materials
        : {};

      await restoreMaterials(connection, materials);
      await connection.execute('DELETE FROM production_workflow WHERE order_id = ?', [id]);
      await connection.execute('DELETE FROM orders WHERE order_id = ?', [id]);

      await connection.commit();
      return { success: true };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
