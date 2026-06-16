'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { FileText, Package, Wrench, Users, PlusCircle, Download, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '@/components/logoBase64';
import { usePaginatedSearch } from '@/hooks/usePaginatedSearch';
import { TableSearchBar } from '@/components/shared/TableSearchBar';
import { TablePagination } from '@/components/shared/TablePagination';

const REPORT_TYPES = [
  { id: 'orders', label: 'Orders Report', icon: FileText },
  { id: 'production', label: 'Production Report', icon: Wrench },
  { id: 'inventory', label: 'Inventory Report', icon: Package },
  { id: 'followup', label: 'Follow-ups Report', icon: Users },
  { id: 'extras', label: 'Extras Report', icon: PlusCircle },
];

const REPORT_SEARCH_FIELDS: Record<string, string[]> = {
  orders: ['order_id', 'client_name', 'design_type', 'design_code', 'status', 'final_amount'],
  production: ['order_id', 'client_name', 'design_code', 'design_type'],
  inventory: ['material_name', 'supplier', 'unit', 'piece_type', 'material_family'],
  followup: ['order_id', 'client_name', 'feedback', 'action_taken'],
  extras: ['extra_name', 'price'],
};

const PRODUCTION_STEPS = [
  { key: 'sorting', label: 'Sorting' },
  { key: 'designing', label: 'Designing' },
  { key: 'cutting', label: 'Cutting' },
  { key: 'grinding', label: 'Grinding' },
  { key: 'polishing', label: 'Polishing' },
  { key: 'word_engraving', label: 'Engraving' },
  { key: 'blasting', label: 'Blasting' },
  { key: 'sampling', label: 'Sampling' },
  { key: 'installation', label: 'Installation' },
];

function isStepDone(value: unknown): boolean {
  return value === 1 || value === true || value === '1';
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('orders');
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'year', 'date', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [specificDate, setSpecificDate] = useState('');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', reportType, dateRange, customStartDate, customEndDate, specificDate],
    enabled:
      (dateRange !== 'custom' || (!!customStartDate && !!customEndDate)) &&
      (dateRange !== 'date' || !!specificDate),
    queryFn: async () => {
      let url = `/reports/${reportType}`;
      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        params.append('range', dateRange);
        if (dateRange === 'custom') {
          if (!customStartDate || !customEndDate) return [];
          params.append('startDate', customStartDate);
          params.append('endDate', customEndDate);
        } else if (dateRange === 'date') {
          if (!specificDate) return [];
          params.append('date', specificDate);
          params.append('startDate', specificDate);
        }
      }
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const { data } = await api.get(url);
      return data;
    }
  });

  const searchFields = useMemo(() => REPORT_SEARCH_FIELDS[reportType] || [], [reportType]);
  const {
    searchTerm, setSearchTerm, currentPage, setCurrentPage,
    paginatedItems, totalPages, pageSize, totalCount
  } = usePaginatedSearch(Array.isArray(reportData) ? reportData : undefined, searchFields, 10);

  const generatePDF = () => {
    try {
      if (!reportData || reportData.length === 0) {
        alert("No data to generate report.");
        return;
      }

      const doc = new jsPDF();
      
      // Logo
      try {
        doc.addImage(logoBase64, 'PNG', 14, 15, 45, 25);
      } catch (e) {
        console.warn("Could not load logo for PDF", e);
      }

      // Header Text
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("ENDLESS ETERNITY MEMORIALS", 65, 22);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Plot 9160, Pilane Industrial", 65, 28);
      doc.text("Tel: +267 575 0093 / 78 395 266", 65, 34);

      // Right Side: Report details
      let reportTitle = REPORT_TYPES.find(t => t.id === reportType)?.label || 'Report';
      if (reportTitle === 'Inventory Report') reportTitle = 'INVENTORY REPORT';
      else reportTitle = reportTitle.toUpperCase();

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      // Align to the right edge (page width is 210mm, so 195 is good)
      doc.text(reportTitle, 195, 22, { align: "right" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`DATE: ${new Date().toISOString().split('T')[0]}`, 195, 28, { align: "right" });
      doc.text(`TIME: ${new Date().toLocaleTimeString()}`, 195, 34, { align: "right" });

      let head: string[][] = [];
      let body: any[][] = [];

      if (reportType === 'orders') {
        head = [['Order ID', 'Client', 'Design Type', 'Status', 'Amount', 'Date']];
        body = reportData.map((item: any) => [
          `#${item.order_id}`,
          item.client_name,
          item.design_type,
          item.status,
          `BWP ${Number(item.final_amount).toFixed(2)}`,
          new Date(item.created_at).toLocaleDateString()
        ]);
      } else if (reportType === 'production') {
        head = [['Order ID', 'Client', ...PRODUCTION_STEPS.map(s => s.label)]];
        body = reportData.map((item: any) => [
          `#${item.order_id}`,
          item.client_name || '-',
          ...PRODUCTION_STEPS.map(s => isStepDone(item[s.key]) ? 'Yes' : 'No'),
        ]);
      } else if (reportType === 'inventory') {
        head = [['Material Name', 'Quantity', 'Unit', 'Reorder Level', 'Supplier']];
        body = reportData.map((item: any) => [
          item.material_name,
          item.quantity.toString(),
          item.unit,
          item.reorder_level.toString(),
          item.supplier || '-'
        ]);
      } else if (reportType === 'followup') {
        head = [['Order ID', 'Client Name', 'Date', 'Feedback', 'Action Taken']];
        body = reportData.map((item: any) => [
          `#${item.order_id}`,
          item.client_name,
          new Date(item.followup_date).toLocaleDateString(),
          item.feedback || '-',
          item.action_taken || '-'
        ]);
      } else if (reportType === 'extras') {
        head = [['Extra Name', 'Price', 'Created At']];
        body = reportData.map((item: any) => [
          item.extra_name,
          `BWP ${Number(item.price).toFixed(2)}`,
          new Date(item.created_at).toLocaleDateString()
        ]);
      }

      autoTable(doc, {
        startY: 55,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [210, 215, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [150,150,150] },
        bodyStyles: { halign: 'center', textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [150,150,150] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 14, right: 14 }
      });

      doc.save(`Endless_Eternity_${reportTitle.replace(' ', '_')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please check the console.");
    }
  };

  const renderTable = (data: any[]) => {
    if (!reportData || !Array.isArray(reportData) || reportData.length === 0) {
      return (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          No data available for this report.
        </div>
      );
    }

    if (totalCount === 0) {
      return (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          No results match your search.
        </div>
      );
    }

    if (reportType === 'orders') {
      return (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Design Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Final Amount</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
            {data.map((item: any, i: number) => (
              <tr key={i} className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{item.order_id}</td>
                <td className="px-6 py-4">{item.client_name}</td>
                <td className="px-6 py-4">{item.design_type}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' :
                    item.status === 'In Progress' ? 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20' :
                    'bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">BWP {Number(item.final_amount).toFixed(2)}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                  {new Date(item.order_date || item.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'production') {
      return (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-4">Order</th>
              <th className="px-4 py-4">Client</th>
              {PRODUCTION_STEPS.map(s => (
                <th key={s.key} className="px-2 py-4 text-center whitespace-nowrap">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
            {data.map((item: any, i: number) => (
              <tr key={i} className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40">
                <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">#{item.order_id}</td>
                <td className="px-4 py-4">{item.client_name || '-'}</td>
                {PRODUCTION_STEPS.map(s => (
                  <td key={s.key} className="px-2 py-4 text-center">
                    {isStepDone(item[s.key]) ? '✅' : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'inventory') {
      return (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Material Name</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Unit</th>
              <th className="px-6 py-4">Reorder Level</th>
              <th className="px-6 py-4">Supplier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
            {data.map((item: any, i: number) => (
              <tr key={i} className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.material_name}</td>
                <td className="px-6 py-4">
                  <span className={item.quantity <= item.reorder_level ? 'text-red-500 font-bold' : ''}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.unit}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.reorder_level}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.supplier || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'followup') {
      return (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Feedback</th>
              <th className="px-6 py-4">Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
            {data.map((item: any, i: number) => (
              <tr key={i} className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{item.order_id}</td>
                <td className="px-6 py-4">{item.client_name}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(item.followup_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.feedback || '-'}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.action_taken || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (reportType === 'extras') {
      return (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Extra Name</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-transparent dark:divide-slate-800/60">
            {data.map((item: any, i: number) => (
              <tr key={i} className="text-slate-700 transition-colors hover:bg-slate-50/50 dark:text-slate-300 dark:hover:bg-slate-800/40">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.extra_name}</td>
                <td className="px-6 py-4 font-medium">BWP {Number(item.price).toFixed(2)}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">View business analytics and export to PDF</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="date">Specific Date</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'date' && (
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          )}
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <span className="text-gray-500">to</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          <button 
            onClick={generatePDF}
            disabled={isLoading || !reportData || reportData.length === 0}
            className="flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = reportType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${
                isActive 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className={`mb-2 h-6 w-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>

      <Card hoverEffect={false} className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
        ) : dateRange === 'date' && !specificDate ? (
          <div className="p-12 text-center text-slate-500">Select a date to filter this report.</div>
        ) : dateRange === 'custom' && (!customStartDate || !customEndDate) ? (
          <div className="p-12 text-center text-slate-500">Select a start and end date to filter this report.</div>
        ) : (
          <>
            {reportData && reportData.length > 0 && (
              <div className="border-b border-slate-200/60 p-6 dark:border-slate-800">
                <TableSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search report results..." />
              </div>
            )}
            <div className="overflow-x-auto">
              {renderTable(paginatedItems)}
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
