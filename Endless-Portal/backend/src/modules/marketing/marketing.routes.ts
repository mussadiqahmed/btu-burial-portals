import { Router } from 'express';
import pool from '../../database/db';
import { OrderService } from '../orders/order.service';
import { isEmailConfigured, sendQuotationEmail } from '../../utils/mail';

const router = Router();
const orderService = new OrderService();

function buildStatsDateFilter(
  dateCol: string,
  range?: string,
  month?: string,
  startDate?: string,
  endDate?: string
): { filter: string; params: any[] } {
  if (range === 'custom' && startDate && endDate) {
    return {
      filter: ` AND DATE(${dateCol}) BETWEEN ? AND ?`,
      params: [startDate, endDate],
    };
  }

  const monthStr = month || new Date().toISOString().slice(0, 7);
  const [year, mon] = monthStr.split('-');
  return {
    filter: ` AND YEAR(${dateCol}) = ? AND MONTH(${dateCol}) = ?`,
    params: [year, mon],
  };
}

// --- LEADS ---
router.get('/leads', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM marketing_leads ORDER BY created_at DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/leads', async (req, res) => {
  try {
    const { client_name, contact_number, email, status, source, notes, assigned_to } = req.body;
    const [result]: any = await pool.execute(
      `INSERT INTO marketing_leads (client_name, contact_number, email, status, source, notes, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [client_name, contact_number || null, email || null, status || 'New', source || null, notes || null, assigned_to || null]
    );
    res.status(201).json({ lead_id: result.insertId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { client_name, contact_number, email, status, source, notes, assigned_to } = req.body;
    await pool.execute(
      `UPDATE marketing_leads SET client_name=?, contact_number=?, email=?, status=?, source=?, notes=?, assigned_to=? WHERE lead_id=?`,
      [client_name, contact_number, email, status, source, notes, assigned_to, id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/leads/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM marketing_leads WHERE lead_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- QUOTATIONS ---
router.get('/quotations', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM marketing_quotations ORDER BY created_at DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quotations', async (req, res) => {
  try {
    const {
      lead_id, client_name, contact_number, client_email, design_code, amount, status, sent_date, notes,
      is_custom, design_name, description, dimensions, pricing_details,
    } = req.body;

    if (!client_name || !String(client_name).trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    const isCustom = !!(is_custom || is_custom === 1);
    const code = !isCustom && design_code && String(design_code).trim() ? String(design_code).trim() : null;
    const customDesignName = isCustom ? String(design_name || '').trim() : null;

    if (isCustom && !customDesignName) {
      return res.status(400).json({ error: 'Design name is required for custom quotations.' });
    }
    if (!isCustom && !code) {
      return res.status(400).json({ error: 'Design code is required for standard quotations.' });
    }

    const validStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected'];
    const quoteStatus = validStatuses.includes(status) ? status : 'Draft';

    const [result]: any = await pool.execute(
      `INSERT INTO marketing_quotations (
        lead_id, client_name, contact_number, client_email, design_code, is_custom, design_name,
        description, dimensions, pricing_details, amount, status, sent_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lead_id || null,
        String(client_name).trim(),
        contact_number || null,
        client_email?.trim() || null,
        code,
        isCustom ? 1 : 0,
        customDesignName,
        isCustom ? (description || null) : null,
        isCustom ? (dimensions || null) : null,
        isCustom ? (pricing_details || null) : null,
        parsedAmount,
        quoteStatus,
        sent_date || null,
        notes || null,
      ]
    );
    res.status(201).json({ quotation_id: result.insertId });
  } catch (error: any) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Failed to create quotation.' });
  }
});

router.put('/quotations/:id', async (req, res) => {
  try {
    const {
      lead_id, client_name, contact_number, client_email, design_code, amount, status, sent_date, notes,
      is_custom, design_name, description, dimensions, pricing_details,
    } = req.body;

    const isCustom = !!(is_custom || is_custom === 1);
    const code = !isCustom && design_code && String(design_code).trim() ? String(design_code).trim() : null;
    const customDesignName = isCustom ? String(design_name || '').trim() : null;

    if (isCustom && !customDesignName) {
      return res.status(400).json({ error: 'Design name is required for custom quotations.' });
    }
    if (!isCustom && !code) {
      return res.status(400).json({ error: 'Design code is required for standard quotations.' });
    }

    await pool.execute(
      `UPDATE marketing_quotations SET
        lead_id=?, client_name=?, contact_number=?, client_email=?, design_code=?,
        is_custom=?, design_name=?, description=?, dimensions=?, pricing_details=?,
        amount=?, status=?, sent_date=?, notes=?
       WHERE quotation_id=?`,
      [
        lead_id ?? null,
        client_name,
        contact_number ?? null,
        client_email?.trim() || null,
        code,
        isCustom ? 1 : 0,
        customDesignName,
        isCustom ? (description ?? null) : null,
        isCustom ? (dimensions ?? null) : null,
        isCustom ? (pricing_details ?? null) : null,
        amount ?? 0,
        status ?? 'Draft',
        sent_date ?? null,
        notes ?? null,
        req.params.id,
      ]
    );
    const [rows]: any = await pool.execute('SELECT * FROM marketing_quotations WHERE quotation_id = ?', [req.params.id]);
    res.json(rows[0] || { success: true });
  } catch (error: any) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Failed to update quotation.' });
  }
});

router.delete('/quotations/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM marketing_quotations WHERE quotation_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ error: 'Failed to delete quotation.' });
  }
});

router.get('/email-status', async (_req, res) => {
  res.json({ configured: isEmailConfigured() });
});

router.post('/quotations/:id/send-email', async (req, res) => {
  try {
    const id = req.params.id;
    const { to, pdfBase64, message } = req.body;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to).trim())) {
      return res.status(400).json({ error: 'A valid recipient email address is required.' });
    }
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ error: 'PDF attachment is required.' });
    }

    const [quotes]: any = await pool.execute(
      'SELECT * FROM marketing_quotations WHERE quotation_id = ?',
      [id]
    );
    if (quotes.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quote = quotes[0];
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    await sendQuotationEmail({
      to: String(to).trim(),
      clientName: quote.client_name,
      quotationId: quote.quotation_id,
      pdfBuffer,
      message: message || undefined,
    });

    if (quote.status === 'Draft') {
      await pool.execute(
        'UPDATE marketing_quotations SET status = ?, sent_date = CURDATE() WHERE quotation_id = ?',
        ['Sent', id]
      );
    }

    res.json({ success: true, message: `Quotation sent to ${to}` });
  } catch (error: any) {
    console.error('Send quotation email error:', error);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

router.post('/quotations/:id/convert-to-order', async (req, res) => {
  try {
    const id = req.params.id;
    const [quotes]: any = await pool.execute(
      'SELECT * FROM marketing_quotations WHERE quotation_id = ?',
      [id]
    );
    if (quotes.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quote = quotes[0];
    const isCustomQuote = !!(quote.is_custom || quote.is_custom === 1);

    if (!isCustomQuote && !quote.design_code) {
      return res.status(400).json({ error: 'Quotation has no design code — add a design before converting.' });
    }

    const materialFamily = (req.body.material_family || req.body.materialFamily || null) as string | null;

    let orderPayload: Record<string, unknown>;

    if (isCustomQuote) {
      const customParts = [
        quote.design_name ? `Design: ${quote.design_name}` : null,
        quote.description ? `Description: ${quote.description}` : null,
        quote.dimensions ? `Dimensions: ${quote.dimensions}` : null,
        quote.pricing_details ? `Pricing: ${quote.pricing_details}` : null,
      ].filter(Boolean);

      const customRequirements = customParts.join('\n');
      const baseNotes = `Converted from custom quotation Q-${quote.quotation_id}.`;
      const notes = quote.notes
        ? `${baseNotes} ${quote.notes}`
        : baseNotes;

      orderPayload = {
        client_name: quote.client_name,
        contact_number: quote.contact_number,
        is_custom_order: true,
        design_type: 'Custom',
        design_code: null,
        material_family: materialFamily,
        status: 'Pending',
        final_amount: quote.amount,
        custom_requirements: customRequirements || quote.design_name,
        notes,
      };
    } else {
      const [designs]: any = await pool.execute(
        'SELECT category FROM design_types WHERE code = ?',
        [quote.design_code]
      );
      const category = designs[0]?.category || 'Standard';

      orderPayload = {
        client_name: quote.client_name,
        contact_number: quote.contact_number,
        design_code: quote.design_code,
        design_type: category,
        material_family: materialFamily,
        status: 'Pending',
        final_amount: quote.amount,
        notes: quote.notes
          ? `Converted from quotation Q-${quote.quotation_id}. ${quote.notes}`
          : `Converted from quotation Q-${quote.quotation_id}`,
      };
    }

    const order = await orderService.createOrder(orderPayload);

    await pool.execute(
      'UPDATE marketing_quotations SET status = ? WHERE quotation_id = ?',
      ['Accepted', id]
    );

    res.status(201).json({ order, quotation_id: quote.quotation_id });
  } catch (error: any) {
    console.error('Convert quotation to order error:', error);
    const message = error?.message || '';
    const isUserFacing =
      message.startsWith('Design code') ||
      message.startsWith('Design "') ||
      message.startsWith('No inventory item found') ||
      message.startsWith('Insufficient stock');
    if (isUserFacing) {
      return res.status(400).json({ error: message });
    }
    res.status(500).json({ error: 'Failed to convert quotation to order.' });
  }
});

// --- DOCUMENTS ---
router.get('/documents', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM marketing_documents ORDER BY created_at DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/documents', async (req, res) => {
  try {
    const { title, category, file_url, description } = req.body;
    const [result]: any = await pool.execute(
      `INSERT INTO marketing_documents (title, category, file_url, description) VALUES (?, ?, ?, ?)`,
      [title, category || 'Other', file_url || null, description || null]
    );
    res.status(201).json({ document_id: result.insertId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM marketing_documents WHERE document_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- SALES STATS (monthly or custom date range) ---
router.get('/stats', async (req, res) => {
  try {
    const range = typeof req.query.range === 'string' ? req.query.range : undefined;
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const leadsFilter = buildStatsDateFilter('created_at', range, month, startDate, endDate);
    const quotesFilter = buildStatsDateFilter('created_at', range, month, startDate, endDate);
    const ordersFilter = buildStatsDateFilter('COALESCE(order_date, created_at)', range, month, startDate, endDate);

    const [leadsByStatus]: any = await pool.execute(
      `SELECT status, COUNT(*) as count FROM marketing_leads WHERE 1=1${leadsFilter.filter} GROUP BY status`,
      leadsFilter.params
    );

    const [leadsBySource]: any = await pool.execute(
      `SELECT COALESCE(NULLIF(TRIM(source), ''), 'Unknown') as source, COUNT(*) as count
       FROM marketing_leads WHERE 1=1${leadsFilter.filter} GROUP BY source ORDER BY count DESC`,
      leadsFilter.params
    );

    const [quotationStats]: any = await pool.execute(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM marketing_quotations WHERE 1=1${quotesFilter.filter} GROUP BY status`,
      quotesFilter.params
    );

    const [orderStats]: any = await pool.execute(
      `SELECT COUNT(*) as order_count, COALESCE(SUM(final_amount), 0) as revenue
       FROM orders WHERE 1=1${ordersFilter.filter}`,
      ordersFilter.params
    );

    const [recentQuotations]: any = await pool.execute(
      `SELECT * FROM marketing_quotations WHERE 1=1${quotesFilter.filter} ORDER BY created_at DESC LIMIT 10`,
      quotesFilter.params
    );

    res.json({
      month: month || (range === 'custom' ? `${startDate} to ${endDate}` : new Date().toISOString().slice(0, 7)),
      range,
      startDate,
      endDate,
      leadsByStatus,
      leadsBySource,
      quotationStats,
      orderCount: orderStats[0]?.order_count || 0,
      orderRevenue: orderStats[0]?.revenue || 0,
      recentQuotations,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
