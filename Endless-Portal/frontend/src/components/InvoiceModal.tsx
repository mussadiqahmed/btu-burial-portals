import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from './logoBase64';
import { useExtras, useDesignTypes } from '@/services/queries';

interface InvoiceModalProps {
  order: any;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const { data: extrasData } = useExtras();
  const { data: designTypesData } = useDesignTypes();

  const getExtraPrice = (name: string) => {
    if (!extrasData) return 0;
    const extra = extrasData.find((e: any) => e.extra_name.toLowerCase() === name.toLowerCase());
    return extra ? Number(extra.price) : 0;
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Logo (using base64 to prevent async loading errors)
      try {
        doc.addImage(logoBase64, 'PNG', 14, 15, 45, 25);
      } catch (e) {
        console.warn("Could not load logo for PDF", e);
      }

    // Header Text
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ENDLESS ETERNITY MEMORIALS", 65, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Plot 9160, Pilane Industrial", 65, 28);
    doc.text("Tel: +267 575 0093 / 78 395 266", 65, 34);

    // Right Side: INVOICE details
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 195, 22, { align: "right" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`NO. ${String(order.order_id).padStart(4, '0')}`, 195, 28, { align: "right" });
    doc.text(`DATE: ${new Date(order.order_date).toISOString().split('T')[0]}`, 195, 34, { align: "right" });

    // Left Side: Client details
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`COMPANY:`, 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.client_name}`, 35, 55);
    
    doc.setFont("helvetica", "bold");
    doc.text(`CONTACT:`, 14, 61);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.contact_number || ''}`, 35, 61);
    
    doc.setFont("helvetica", "bold");
    doc.text(`ATT:`, 14, 67);
    doc.text(`TEL NO:`, 14, 73);
    doc.text(`E-MAIL:`, 14, 79);
    doc.text(`VAT NO:`, 14, 85);

    // Lines for blank fields
    doc.line(35, 67, 90, 67);
    doc.line(35, 73, 90, 73);
    doc.line(35, 79, 90, 79);
    doc.line(35, 85, 90, 85);

    // Table Data
    let materials: any[] = [];
    try {
      if (typeof order.materials === 'string') {
        const parsed = JSON.parse(order.materials);
        if (Array.isArray(parsed)) {
          materials = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          materials = Object.entries(parsed).map(([name, qty]) => ({ material_name: name, quantity: qty }));
        }
      } else if (Array.isArray(order.materials)) {
        materials = order.materials;
      } else if (typeof order.materials === 'object' && order.materials !== null) {
        materials = Object.entries(order.materials).map(([name, qty]) => ({ material_name: name, quantity: qty }));
      }
    } catch (e) {
      console.warn("Failed to parse materials", e);
    }

    let extras: any[] = [];
    try {
      if (typeof order.extras_details === 'string') {
        const parsed = JSON.parse(order.extras_details);
        extras = Array.isArray(parsed) ? parsed : [];
      } else if (Array.isArray(order.extras_details)) {
        extras = order.extras_details;
      } else if (typeof order.extras_details === 'object' && order.extras_details !== null) {
        // Handle object format like {"Bible": 1, "Heart": 2}
        extras = Object.entries(order.extras_details).map(([name, qty]) => ({ extra_name: name, quantity: qty }));
      }
    } catch (e) {
      console.warn("Failed to parse extras", e);
    }

    const tableBody = [];
    
    // Add Design Type as base
    let basePrice = 1000.0;
    if (designTypesData) {
      const dt = designTypesData.find((d: any) => d.name === order.design_type);
      if (dt) basePrice = Number(dt.price);
    }
    tableBody.push([
      1,
      `Design: ${order.design_type || 'Standard'}`,
      basePrice.toFixed(2),
      basePrice.toFixed(2)
    ]);

    // Add Materials (Materials are included in the base price)
    materials.forEach((m: any) => {
      tableBody.push([
        m.quantity || 1,
        `Material: ${m.material_name || 'Unknown'}`,
        'Included',
        'Included'
      ]);
    });

    // Add Extras
    extras.forEach((e: any) => {
      const price = e.price || getExtraPrice(e.extra_name);
      const qty = e.quantity || 1;
      tableBody.push([
        qty,
        `Extra: ${e.extra_name || 'Unknown'}`,
        price > 0 ? price.toFixed(2) : 'Included',
        price > 0 ? (price * qty).toFixed(2) : 'Included'
      ]);
    });

    // Add legacy checkboxes if true
    const addLegacyExtra = (key: string, label: string) => {
      if (order[key]) {
        const price = getExtraPrice(label);
        tableBody.push([
          1, 
          `Extra: ${label}`, 
          price > 0 ? price.toFixed(2) : 'Included', 
          price > 0 ? price.toFixed(2) : 'Included'
        ]);
      }
    };

    addLegacyExtra('extra_bible', 'Bible');
    addLegacyExtra('extra_heart', 'Heart');
    addLegacyExtra('extra_photo', 'Photo');
    addLegacyExtra('extra_white_vase', 'White Vase');
    addLegacyExtra('extra_black_vase', 'Black Vase');

    autoTable(doc, {
      startY: 95,
      head: [['QTY', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL']],
      body: tableBody.length > 0 ? tableBody : [[1, `Design: ${order.design_type}`, 'Included', 'Included']],
      theme: 'grid',
      headStyles: { fillColor: [210, 215, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [150,150,150] },
      bodyStyles: { halign: 'center', textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [150,150,150] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { halign: 'left' },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Custom Requirements & Botubs
    doc.setFont("helvetica", "normal");
    doc.text(`Custom Requirements: ${order.custom_requirements || 'None'}`, 14, finalY);
    doc.text(`Botubs Scheme: ${order.botubs_scheme ? 'Yes' : 'No'}`, 14, finalY + 8);

    // Totals on the right
    const subTotal = Number(order.final_amount) || 0;
    const vat = subTotal * 0.14; // Example 14% VAT based on sample
    const total = subTotal + vat;
    const deposit = Number(order.deposit_paid) || 0;
    const balance = total - deposit;

    const totalsX = 130;
    const valuesX = 195;
    
    doc.text("SUB-TOTAL", totalsX, finalY + 20);
    doc.text(`${subTotal.toFixed(2)}`, valuesX, finalY + 20, { align: "right" });
    
    doc.text("VAT (14%)", totalsX, finalY + 28);
    doc.text(`${vat.toFixed(2)}`, valuesX, finalY + 28, { align: "right" });
    
    doc.line(totalsX, finalY + 32, valuesX, finalY + 32);

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", totalsX, finalY + 38);
    doc.text(`${total.toFixed(2)}`, valuesX, finalY + 38, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.text("DEPOSIT PAID", totalsX, finalY + 46);
    doc.text(`${deposit.toFixed(2)}`, valuesX, finalY + 46, { align: "right" });
    
    doc.text("BALANCE DUE", totalsX, finalY + 54);
    doc.text(`${balance > 0 ? balance.toFixed(2) : 'N/A'}`, valuesX, finalY + 54, { align: "right" });

    // Signatures
    doc.text("Invoiced by:", 14, finalY + 70);
    doc.line(14, finalY + 90, 70, finalY + 90);
    doc.text("Print Name", 30, finalY + 96);
    
    doc.line(80, finalY + 90, 140, finalY + 90);
    doc.text("Signature", 100, finalY + 96);

      doc.save(`Invoice_${String(order.order_id).padStart(4, '0')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please check the console.");
    }
  };

  // Parse materials for UI display
  let materialsUI: any[] = [];
  try {
    if (typeof order.materials === 'string') {
      const parsed = JSON.parse(order.materials);
      if (Array.isArray(parsed)) {
        materialsUI = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        materialsUI = Object.entries(parsed).map(([name, qty]) => ({ material_name: name, quantity: qty }));
      }
    } else if (Array.isArray(order.materials)) {
      materialsUI = order.materials;
    } else if (typeof order.materials === 'object' && order.materials !== null) {
      materialsUI = Object.entries(order.materials).map(([name, qty]) => ({ material_name: name, quantity: qty }));
    }
  } catch (e) {
    console.warn("Failed to parse materials for UI", e);
  }

  let extrasUI: any[] = [];
  try {
    if (typeof order.extras_details === 'string') {
      const parsed = JSON.parse(order.extras_details);
      extrasUI = Array.isArray(parsed) ? parsed : [];
    } else if (Array.isArray(order.extras_details)) {
      extrasUI = order.extras_details;
    } else if (typeof order.extras_details === 'object' && order.extras_details !== null) {
      extrasUI = Object.entries(order.extras_details).map(([name, qty]) => ({ extra_name: name, quantity: qty }));
    }
  } catch (e) {
    console.warn("Failed to parse extras for UI", e);
  }

  const subTotal = Number(order.final_amount) || 0;
  const vat = subTotal * 0.14;
  const total = subTotal + vat;
  const deposit = Number(order.deposit_paid) || 0;
  const balance = total - deposit;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center space-x-3">
            <button 
              onClick={generatePDF}
              className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </button>
            <button 
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content (A4 Aspect Ratio Approximation) */}
        <div className="p-8 md:p-12 bg-white text-black font-sans">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center space-x-6">
              <img src="/logo.png" alt="Endless Eternity" className="h-20 object-contain" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight uppercase">Endless Eternity Memorials</h1>
                <p className="text-sm text-gray-800 mt-1">Plot 9160, Pilane Industrial</p>
                <p className="text-sm text-gray-800">Tel: +267 575 0093 / 78 395 266</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-sm mt-2">NO. {String(order.order_id).padStart(4, '0')}</p>
              <p className="text-sm">DATE: {new Date(order.order_date).toISOString().split('T')[0]}</p>
            </div>
          </div>

          {/* Client Details */}
          <div className="mb-8 text-sm space-y-1.5">
            <p><span className="font-semibold w-24 inline-block">COMPANY:</span> {order.client_name}</p>
            <p><span className="font-semibold w-24 inline-block">CONTACT:</span> {order.contact_number || '-'}</p>
            <p className="flex items-center"><span className="font-semibold w-24 inline-block">ATT:</span> <span className="border-b border-black w-48 inline-block"></span></p>
            <p className="flex items-center"><span className="font-semibold w-24 inline-block">TEL NO:</span> <span className="border-b border-black w-48 inline-block"></span></p>
            <p className="flex items-center"><span className="font-semibold w-24 inline-block">E-MAIL:</span> <span className="border-b border-black w-48 inline-block"></span></p>
            <p className="flex items-center"><span className="font-semibold w-24 inline-block">VAT NO:</span> <span className="border-b border-black w-48 inline-block"></span></p>
          </div>

          {/* Table */}
          <table className="w-full mb-8 border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-300">
                <th className="border border-gray-400 py-2 px-4 text-center w-16 font-bold">QTY</th>
                <th className="border border-gray-400 py-2 px-4 text-left font-bold">DESCRIPTION</th>
                <th className="border border-gray-400 py-2 px-4 text-center w-32 font-bold">UNIT PRICE</th>
                <th className="border border-gray-400 py-2 px-4 text-center w-32 font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {/* Base Design */}
              <tr>
                <td className="border border-gray-400 py-2 px-4 text-center">1</td>
                <td className="border border-gray-400 py-2 px-4">Design: {order.design_type || 'Standard'}</td>
                <td className="border border-gray-400 py-2 px-4 text-center">
                  {(() => {
                    let bp = 1000.0;
                    if (designTypesData) {
                      const dt = designTypesData.find((d: any) => d.name === (order.design_type || 'Standard'));
                      if (dt) bp = Number(dt.price);
                    }
                    return bp.toFixed(2);
                  })()}
                </td>
                <td className="border border-gray-400 py-2 px-4 text-center">
                  {(() => {
                    let bp = 1000.0;
                    if (designTypesData) {
                      const dt = designTypesData.find((d: any) => d.name === (order.design_type || 'Standard'));
                      if (dt) bp = Number(dt.price);
                    }
                    return bp.toFixed(2);
                  })()}
                </td>
              </tr>

              {/* Materials */}
              {materialsUI.map((m: any, i: number) => (
                <tr key={`mat-${i}`}>
                  <td className="border border-gray-400 py-2 px-4 text-center">{m.quantity || 1}</td>
                  <td className="border border-gray-400 py-2 px-4">Material: {m.material_name || 'Unknown'}</td>
                  <td className="border border-gray-400 py-2 px-4 text-center">Included</td>
                  <td className="border border-gray-400 py-2 px-4 text-center">Included</td>
                </tr>
              ))}

              {/* Extras Details */}
              {extrasUI.map((e: any, i: number) => {
                const price = e.price || getExtraPrice(e.extra_name);
                const qty = e.quantity || 1;
                return (
                  <tr key={`ext-${i}`}>
                    <td className="border border-gray-400 py-2 px-4 text-center">{qty}</td>
                    <td className="border border-gray-400 py-2 px-4">Extra: {e.extra_name || 'Unknown'}</td>
                    <td className="border border-gray-400 py-2 px-4 text-center">{price > 0 ? price.toFixed(2) : 'Included'}</td>
                    <td className="border border-gray-400 py-2 px-4 text-center">{price > 0 ? (price * qty).toFixed(2) : 'Included'}</td>
                  </tr>
                );
              })}

              {/* Legacy Toggles */}
              {order.extra_bible ? <tr><td className="border border-gray-400 py-2 px-4 text-center">1</td><td className="border border-gray-400 py-2 px-4">Extra: Bible</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('Bible') > 0 ? getExtraPrice('Bible').toFixed(2) : 'Included'}</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('Bible') > 0 ? getExtraPrice('Bible').toFixed(2) : 'Included'}</td></tr> : null}
              {order.extra_heart ? <tr><td className="border border-gray-400 py-2 px-4 text-center">1</td><td className="border border-gray-400 py-2 px-4">Extra: Heart</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('Heart') > 0 ? getExtraPrice('Heart').toFixed(2) : 'Included'}</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('Heart') > 0 ? getExtraPrice('Heart').toFixed(2) : 'Included'}</td></tr> : null}
              {order.extra_photo ? <tr><td className="border border-gray-400 py-2 px-4 text-center">1</td><td className="border border-gray-400 py-2 px-4">Extra: Photo</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('Photo') > 0 ? getExtraPrice('Photo').toFixed(2) : 'Included'}</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('Photo') > 0 ? getExtraPrice('Photo').toFixed(2) : 'Included'}</td></tr> : null}
              {order.extra_white_vase ? <tr><td className="border border-gray-400 py-2 px-4 text-center">1</td><td className="border border-gray-400 py-2 px-4">Extra: White Vase</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('White Vase') > 0 ? getExtraPrice('White Vase').toFixed(2) : 'Included'}</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('White Vase') > 0 ? getExtraPrice('White Vase').toFixed(2) : 'Included'}</td></tr> : null}
              {order.extra_black_vase ? <tr><td className="border border-gray-400 py-2 px-4 text-center">1</td><td className="border border-gray-400 py-2 px-4">Extra: Black Vase</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('Black Vase') > 0 ? getExtraPrice('Black Vase').toFixed(2) : 'Included'}</td><td className="border border-gray-400 py-2 px-4 text-center">{getExtraPrice('Black Vase') > 0 ? getExtraPrice('Black Vase').toFixed(2) : 'Included'}</td></tr> : null}

            </tbody>
          </table>

          {/* Additional Info */}
          <div className="mb-8 text-sm">
            <p className="mb-2">Custom Requirements: {order.custom_requirements || 'None'}</p>
            <p className="mb-2">Payment Status: {order.payment_status || 'Not set'}</p>
            <p>Botubs Scheme: {order.botubs_scheme ? 'Yes' : 'No'}</p>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-16">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>SUB-TOTAL</span>
                <span>{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (14%)</span>
                <span>{vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-400">
                <span>TOTAL</span>
                <span>{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span>DEPOSIT PAID</span>
                <span>{deposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>BALANCE DUE</span>
                <span>{balance > 0 ? balance.toFixed(2) : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-16 text-sm">
            <p className="mb-10">Invoiced by:</p>
            <div className="flex space-x-12">
              <div className="w-48 text-center">
                <div className="border-b border-black mb-2 h-8"></div>
                <p>Print Name</p>
              </div>
              <div className="w-48 text-center">
                <div className="border-b border-black mb-2 h-8"></div>
                <p>Signature</p>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
