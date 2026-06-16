import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '@/components/logoBase64';

const PIECE_LABELS: Record<string, string> = {
  kerb_long: 'Long Kerb',
  kerb_short: 'Short Kerb',
  ledger: 'Ledger',
  headstone_big: 'Big Headstone',
  headstone_small: 'Small Headstone',
  base_big: 'Big Base',
  base_small: 'Small Base',
  slab: 'Slab',
  pillar: 'Pillar',
  frame_short: 'Short Frame',
  offcut: 'Offcut',
};

export type QuotationPdfInput = {
  quotation_id: number;
  client_name: string;
  contact_number?: string | null;
  design_code?: string | null;
  is_custom?: boolean | number;
  design_name?: string | null;
  description?: string | null;
  dimensions?: string | null;
  pricing_details?: string | null;
  amount: number;
  status?: string;
  notes?: string | null;
  created_at?: string;
};

export type DesignForPdf = {
  category?: string;
  description?: string;
  components?: string | unknown[];
};

function getComponentRows(design?: DesignForPdf | null): string[][] {
  if (!design?.components) return [];
  const components =
    typeof design.components === 'string' ? JSON.parse(design.components) : design.components;
  return (components || []).map((c: { piece_type: string; quantity: number }) => [
    PIECE_LABELS[c.piece_type] || c.piece_type,
    String(c.quantity),
  ]);
}

export function buildQuotationPdf(q: QuotationPdfInput, design?: DesignForPdf | null): jsPDF {
  const doc = new jsPDF();

  try {
    doc.addImage(logoBase64, 'PNG', 14, 12, 50, 28);
  } catch {
    /* logo optional */
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ENDLESS ETERNITY MEMORIALS', 70, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Plot 9160, Pilane Industrial, Gaborone', 70, 27);
  doc.text('Tel: +267 575 0093 / 78 395 266', 70, 33);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 195, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quotation #: Q-${q.quotation_id}`, 14, 52);
  doc.text(`Date: ${new Date(q.created_at || Date.now()).toLocaleDateString('en-GB')}`, 14, 59);
  doc.text(`Status: ${q.status || 'Draft'}`, 14, 66);

  autoTable(doc, {
    startY: 74,
    head: [['Client Details', '']],
    body: [
      ['Client Name', q.client_name],
      ['Contact', q.contact_number || '—'],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
  });

  const afterClient = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const isCustom = !!(q.is_custom || q.is_custom === 1);

  if (isCustom) {
    autoTable(doc, {
      startY: afterClient,
      head: [['Custom Design', 'Details']],
      body: [
        ['Design Name', q.design_name || '—'],
        ['Description', q.description || '—'],
        ['Dimensions', q.dimensions || '—'],
        ['Pricing Details', q.pricing_details || '—'],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
    });
  } else {
    autoTable(doc, {
      startY: afterClient,
      head: [['Design', 'Details']],
      body: [
        ['Design Code', q.design_code || 'N/A'],
        ['Category', design?.category || '—'],
        ['Description', design?.description || '—'],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 140 } },
    });

    const componentRows = getComponentRows(design);
    if (componentRows.length > 0) {
      const afterDesign = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      autoTable(doc, {
        startY: afterDesign,
        head: [['Component', 'Qty']],
        body: componentRows,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      });
    }
  }

  const afterComponents =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount: BWP ${Number(q.amount).toLocaleString()}`, 14, afterComponents);

  if (q.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Notes:', 14, afterComponents + 10);
    const lines = doc.splitTextToSize(q.notes, 180);
    doc.text(lines, 14, afterComponents + 17);
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('Thank you for choosing Endless Eternity Memorials.', 105, 285, { align: 'center' });

  return doc;
}

export function quotationPdfBase64(q: QuotationPdfInput, design?: DesignForPdf | null): string {
  const doc = buildQuotationPdf(q, design);
  return doc.output('datauristring').split(',')[1];
}

export function quotationPdfFilename(q: QuotationPdfInput): string {
  const safe = q.client_name.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  return `Quotation-Q${q.quotation_id}-${safe}.pdf`;
}
