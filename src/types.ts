export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceTemplate {
  name: string;
  description: string;
  color: string;
  data: Partial<InvoiceData>;
}

export interface InvoiceDesign {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  layout: 'classic' | 'modern' | 'minimal' | 'bold' | 'elegant';
}