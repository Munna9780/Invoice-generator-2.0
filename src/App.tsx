import React, { useState } from 'react';
import { FileText, Plus, Download, Trash2, Layout, Palette, Calendar, DollarSign, Mail, MapPin } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast, { Toaster } from 'react-hot-toast';
import type { InvoiceData, InvoiceItem, InvoiceTemplate, InvoiceDesign } from './types';
import { invoiceDesigns } from './designs';
import { DesignPreview } from './components/DesignPreview';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

const initialInvoiceData: InvoiceData = {
  invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  fromName: '',
  fromEmail: '',
  fromAddress: '',
  toName: '',
  toEmail: '',
  toAddress: '',
  items: [],
  notes: '',
  taxRate: 0,
  taxAmount: 0,
  total: 0,
  advancePaid: 0,
  balanceRemaining: 0,
  currency: 'USD',
  design: invoiceDesigns[0]
};

function App() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialInvoiceData);

  const getCurrencySymbol = (currencyCode: string) => {
    return currencies.find(c => c.code === currencyCode)?.symbol || '$';
  };

  const applyDesign = (design: InvoiceDesign) => {
    setInvoiceData(prev => ({
      ...prev,
      design
    }));
    toast.success(`Applied ${design.name} design`);
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    calculateTotals();
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        amount: field === 'quantity' || field === 'rate' 
          ? Number(newItems[index].quantity) * Number(newItems[index].rate)
          : newItems[index].amount
      };
      return { ...prev, items: newItems };
    });
    calculateTotals();
  };

  const calculateTotals = () => {
    setInvoiceData(prev => {
      const itemsTotal = prev.items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = itemsTotal * (prev.taxRate / 100);
      const total = itemsTotal + taxAmount;
      const balanceRemaining = total - prev.advancePaid;
      
      return {
        ...prev,
        taxAmount,
        total,
        balanceRemaining
      };
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const design = invoiceData.design || invoiceDesigns[0];
    
    // Set colors based on design
    const primaryColor = design.primaryColor;
    const secondaryColor = design.secondaryColor;
    const accentColor = design.accentColor;
    
    // Add background header based on layout
    if (design.layout === 'modern' || design.layout === 'bold') {
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
    } else if (design.layout === 'elegant') {
      doc.setFillColor(secondaryColor);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 8, 297, 'F');
    }
    
    // Add company logo and header
    doc.setFontSize(24);
    doc.setTextColor(design.layout === 'modern' || design.layout === 'bold' ? '#FFFFFF' : primaryColor);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Reset text color for rest of content
    doc.setTextColor(design.layout === 'minimal' ? primaryColor : '#000000');
    
    // Add invoice details
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${invoiceData.date}`, 20, 45);
    doc.text(`Due Date: ${invoiceData.dueDate}`, 20, 50);
    
    // Add from details with styling
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('From:', 20, 65);
    doc.setTextColor('#000000');
    doc.setFontSize(10);
    doc.text(invoiceData.fromName, 20, 70);
    doc.text(invoiceData.fromEmail, 20, 75);
    doc.text(invoiceData.fromAddress, 20, 80);
    
    // Add to details with styling
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('To:', 20, 95);
    doc.setTextColor('#000000');
    doc.setFontSize(10);
    doc.text(invoiceData.toName, 20, 100);
    doc.text(invoiceData.toEmail, 20, 105);
    doc.text(invoiceData.toAddress, 20, 110);
    
    // Add items table with styling
    let yPos = 130;
    doc.setFillColor(primaryColor);
    doc.setTextColor('#FFFFFF');
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.text('Description', 25, yPos);
    doc.text('Qty', 100, yPos);
    doc.text('Rate', 130, yPos);
    doc.text('Amount', 160, yPos);
    
    // Reset text color for items
    doc.setTextColor('#000000');
    
    yPos += 10;
    invoiceData.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      if (design.layout !== 'minimal') {
        doc.setFillColor(isEven ? '#FFFFFF' : secondaryColor);
        doc.rect(20, yPos - 5, 170, 8, 'F');
      }
      doc.text(item.description, 25, yPos);
      doc.text(item.quantity.toString(), 100, yPos);
      doc.text(`${getCurrencySymbol(invoiceData.currency)}${item.rate}`, 130, yPos);
      doc.text(`${getCurrencySymbol(invoiceData.currency)}${item.amount}`, 160, yPos);
      yPos += 10;
    });
    
    // Add totals with styling
    yPos += 10;
    doc.setTextColor(primaryColor);
    doc.text(`Tax (${invoiceData.taxRate}%):`, 130, yPos);
    doc.setTextColor('#000000');
    doc.text(`${getCurrencySymbol(invoiceData.currency)}${invoiceData.taxAmount.toFixed(2)}`, 160, yPos);
    
    yPos += 10;
    doc.setTextColor(primaryColor);
    doc.text('Total:', 130, yPos);
    doc.setTextColor('#000000');
    doc.text(`${getCurrencySymbol(invoiceData.currency)}${invoiceData.total.toFixed(2)}`, 160, yPos);

    yPos += 10;
    doc.setTextColor(primaryColor);
    doc.text('Advance Paid:', 130, yPos);
    doc.setTextColor('#000000');
    doc.text(`${getCurrencySymbol(invoiceData.currency)}${invoiceData.advancePaid.toFixed(2)}`, 160, yPos);

    yPos += 10;
    doc.setFillColor(primaryColor);
    doc.rect(130, yPos - 5, 60, 8, 'F');
    doc.setTextColor('#FFFFFF');
    doc.text('Balance Due:', 130, yPos);
    doc.text(`${getCurrencySymbol(invoiceData.currency)}${invoiceData.balanceRemaining.toFixed(2)}`, 160, yPos);

    // Add notes section if present
    if (invoiceData.notes) {
      yPos += 40;
      doc.setTextColor(primaryColor);
      doc.text('Notes:', 20, yPos);
      doc.setTextColor('#000000');
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(invoiceData.notes, 170);
      doc.text(splitNotes, 20, yPos + 10);
    }
    
    doc.save(`invoice-${invoiceData.invoiceNumber}.pdf`);
    toast.success('Invoice PDF generated successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto">
        {/* SEO-optimized header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-indigo-600" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-gray-900">Professional Invoice Generator</h1>
              <p className="text-sm text-gray-500">Create and customize beautiful invoices in minutes</p>
            </div>
          </div>
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            aria-label="Download invoice as PDF"
          >
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Download PDF
          </button>
        </header>

        <main>
          {/* Invoice Details Section */}
          <section aria-labelledby="invoice-details-heading" className="bg-white shadow-lg rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invoice-number">Invoice Number</label>
                  <input
                    type="text"
                    id="invoice-number"
                    value={invoiceData.invoiceNumber}
                    readOnly
                    className="bg-white block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    aria-label="Invoice number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invoice-date">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    <input
                      type="date"
                      id="invoice-date"
                      value={invoiceData.date}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invoice-due-date">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    <input
                      type="date"
                      id="invoice-due-date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium text-gray-900">From</h2>
                  <div className="flex-grow border-b border-gray-200 mx-4"></div>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={invoiceData.fromName}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, fromName: e.target.value }))}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      aria-label="Your name"
                    />
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={invoiceData.fromEmail}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, fromEmail: e.target.value }))}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      aria-label="Your email"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="relative">
                    <textarea
                      placeholder="Your Address"
                      value={invoiceData.fromAddress}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, fromAddress: e.target.value }))}
                      rows={3}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      aria-label="Your address"
                    />
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div className="hidden lg:block border-r border-gray-200"></div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium text-gray-900">To</h2>
                  <div className="flex-grow border-b border-gray-200 mx-4"></div>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Client Name"
                      value={invoiceData.toName}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, toName: e.target.value }))}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      aria-label="Client name"
                    />
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Client Email"
                      value={invoiceData.toEmail}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, toEmail: e.target.value }))}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      aria-label="Client email"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="relative">
                    <textarea
                      placeholder="Client Address"
                      value={invoiceData.toAddress}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, toAddress: e.target.value }))}
                      rows={3}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      aria-label="Client address"
                    />
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Items Section */}
          <section aria-labelledby="items-heading" className="bg-white shadow-lg rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 id="items-heading" className="text-lg font-medium text-gray-900">Items</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={invoiceData.currency}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, currency: e.target.value }))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-label="Select currency"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  aria-label="Add new item"
                >
                  <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {invoiceData.items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No items added yet. Click "Add Item" to get started.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-t-lg text-sm font-medium text-gray-700">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-center">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center hover:bg-gray-50 p-4 rounded-lg transition-colors">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          aria-label={`Item ${index + 1} description`}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center"
                          aria-label={`Item ${index + 1} quantity`}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {getCurrencySymbol(invoiceData.currency)}
                          </span>
                          <input
                            type="number"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                            className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center"
                            aria-label={`Item ${index + 1} rate`}
                          />
                        </div>
                      </div>
                      <div className="col-span-1 text-right font-medium">
                        {getCurrencySymbol(invoiceData.currency)}{item.amount.toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <Trash2 className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="flex justify-end">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Tax Rate:</span>
                      <input
                        type="number"
                        value={invoiceData.taxRate}
                        onChange={(e) => {
                          setInvoiceData(prev => ({ ...prev, taxRate: Number(e.target.value) }));
                          calculateTotals();
                        }}
                        className="w-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        aria-label="Tax rate percentage"
                      />
                      <span className="ml-1">%</span>
                    </div>
                    <span className="font-medium">
                      {getCurrencySymbol(invoiceData.currency)}{invoiceData.taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">
                      {getCurrencySymbol(invoiceData.currency)}{invoiceData.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Advance Paid:</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                          {getCurrencySymbol(invoiceData.currency)}
                        </span>
                        <input
                          type="number"
                          value={invoiceData.advancePaid}
                          onChange={(e) => {
                            setInvoiceData(prev => ({ ...prev, advancePaid: Number(e.target.value) }));
                            calculateTotals();
                          }}
                          className="pl-6 w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          aria-label="Advance payment amount"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Balance Due:</span>
                    <span className="text-red-600">
                      {getCurrencySymbol(invoiceData.currency)}{invoiceData.balanceRemaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-medium mb-4">Notes</h2>
                <textarea
                  placeholder="Add any notes or payment terms..."
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  aria-label="Additional notes"
                />
              </div>
            </div>
          </section>

          {/* Design Selection Section */}
          <section aria-labelledby="design-heading" className="bg-white shadow-lg rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
              <div className="flex items-center">
                <Palette className="h-5 w-5 text-gray-500 mr-2" aria-hidden="true" />
                <h2 id="design-heading" className="text-lg font-medium">Invoice Design</h2>
              </div>
              <div className="text-sm text-gray-500 mt-1 sm:mt-0">
                Select a design that matches your brand
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {invoiceDesigns.map((design) => (
                <DesignPreview
                  key={design.id}
                  design={design}
                  isSelected={invoiceData.design?.id === design.id}
                  onSelect={(selectedDesign) => {
                    setInvoiceData(prev => ({ ...prev, design: selectedDesign }));
                    toast.success(`Applied ${selectedDesign.name} design`);
                  }}
                />
              ))}
            </div>
          </section>
        </main>

        {/* SEO Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Create professional invoices quickly and easily with our free invoice generator.</p>
          <p className="mt-2">Perfect for freelancers, small businesses, and entrepreneurs.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;