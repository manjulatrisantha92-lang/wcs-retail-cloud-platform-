/**
 * Bluetooth ESC/POS Thermal Printer & Cash Drawer Utility
 * Supports Web Bluetooth API for connecting to portable & desktop thermal receipt printers:
 * - PT-210, MPT-II, POS-58, GOOJPRT, Xprinter, Sunmi, Epson, Zjiang, etc.
 * Supports ESC/POS commands: Text, Alignment, Bold, Barcodes, Line Feeds, Paper Cut, and Cash Drawer Kick.
 */

import { Sale, Tenant, TenantSettings, CounterShift } from '../types';

// Common Bluetooth Printer Service UUIDs
const BLUETOOTH_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
  '0000e0ff-0000-1000-8000-00805f9b34fb', // ESC/POS Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common Thermal Printer Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent (Zjiang/MPT)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HMSoft / Feasycom
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Android Bluetooth POS Service
];

export interface BluetoothPrinterDevice {
  device: any;
  server?: any;
  characteristic?: any;
  name: string;
}

let activePrinterDevice: BluetoothPrinterDevice | null = null;

/**
 * Check if the current browser environment supports the Web Bluetooth API
 */
export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Get the currently connected Bluetooth printer, if any
 */
export function getConnectedBluetoothPrinter(): BluetoothPrinterDevice | null {
  if (activePrinterDevice && activePrinterDevice.device?.gatt?.connected) {
    return activePrinterDevice;
  }
  return null;
}

/**
 * Connect to a nearby Bluetooth Thermal Printer
 */
export async function connectBluetoothPrinter(): Promise<BluetoothPrinterDevice> {
  if (!isBluetoothSupported()) {
    throw new Error('Web Bluetooth is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a Chromium browser on Android/Windows/Mac.');
  }

  try {
    // Request device with printer service filters or accept all devices
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLUETOOTH_PRINTER_SERVICES,
    });

    if (!device) {
      throw new Error('No Bluetooth printer selected.');
    }

    // Connect to GATT Server
    const server = await device.gatt.connect();

    // Find writable characteristic for printing
    let characteristic: any = null;

    // Search through supported services
    const services = await server.getPrimaryServices().catch(() => []);
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            characteristic = char;
            break;
          }
        }
        if (characteristic) break;
      } catch {
        // continue search
      }
    }

    if (!characteristic) {
      // Fallback attempt with default thermal printer service
      for (const serviceUuid of BLUETOOTH_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              characteristic = c;
              break;
            }
          }
          if (characteristic) break;
        } catch {
          // ignore and try next
        }
      }
    }

    if (!characteristic) {
      throw new Error('Could not find a writable print channel on the selected Bluetooth printer.');
    }

    activePrinterDevice = {
      device,
      server,
      characteristic,
      name: device.name || 'Bluetooth POS Printer',
    };

    // Auto cleanup on disconnect
    device.addEventListener('gattserverdisconnected', () => {
      activePrinterDevice = null;
    });

    return activePrinterDevice;
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      throw new Error('Bluetooth device search was cancelled.');
    }
    throw err;
  }
}

/**
 * Disconnect active Bluetooth printer
 */
export function disconnectBluetoothPrinter(): void {
  if (activePrinterDevice?.device?.gatt?.connected) {
    activePrinterDevice.device.gatt.disconnect();
  }
  activePrinterDevice = null;
}

/**
 * Send raw binary chunks to Bluetooth characteristic
 */
export async function sendBluetoothBytes(bytes: Uint8Array): Promise<void> {
  let printer = getConnectedBluetoothPrinter();
  if (!printer) {
    printer = await connectBluetoothPrinter();
  }

  const char = printer.characteristic;
  if (!char) {
    throw new Error('Printer writable characteristic is unavailable.');
  }

  // Chunk transfer (typically 50-100 bytes per packet for Bluetooth LE)
  const CHUNK_SIZE = 80;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    if (char.writeValueWithoutResponse) {
      await char.writeValueWithoutResponse(chunk);
    } else {
      await char.writeValue(chunk);
    }
    // Small pacing delay between packets
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
}

/**
 * ESC/POS Command Builder helper
 */
export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  // Initialize printer
  init(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  // Kick / Pulse Cash Drawer (Pin 2: m=0, Pin 5: m=1)
  kickCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // Pulse pin 2
    this.buffer.push(0x1b, 0x70, 0x01, 0x19, 0xfa); // Pulse pin 5
    return this;
  }

  // Alignment: 0=Left, 1=Center, 2=Right
  align(mode: 'left' | 'center' | 'right'): this {
    const val = mode === 'center' ? 1 : mode === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, val);
    return this;
  }

  // Bold text
  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  // Double size (Width & Height)
  doubleSize(enable: boolean): this {
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  // Add text
  text(str: string): this {
    // Convert string to ASCII/Latin-1 bytes
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      if (code > 255) {
        code = 63; // '?' for unencodable characters
      }
      this.buffer.push(code);
    }
    return this;
  }

  // Line feed
  lineFeed(count = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  // Print single line of text
  println(str = ''): this {
    this.text(str);
    this.lineFeed();
    return this;
  }

  // Divider line
  divider(char = '-', width = 32): this {
    this.println(char.repeat(width));
    return this;
  }

  // Two-column text (Left aligned, Right aligned)
  twoColumn(left: string, right: string, width = 32): this {
    const spaceCount = Math.max(1, width - left.length - right.length);
    this.println(left + ' '.repeat(spaceCount) + right);
    return this;
  }

  // Cut Paper (Full or Partial)
  cut(): this {
    this.lineFeed(3);
    this.buffer.push(0x1d, 0x56, 0x41, 0x10);
    return this;
  }

  // Get raw binary buffer
  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Print a Sales Bill directly to Bluetooth Thermal Printer
 * Supports auto-kicking cash drawer prior to / with print
 */
export async function printSaleToBluetoothPrinter(options: {
  sale: Sale;
  tenant?: Tenant;
  settings?: TenantSettings;
  openCashDrawer?: boolean;
  width?: 32 | 48; // 32 for 58mm, 48 for 80mm
}): Promise<boolean> {
  const { sale, tenant, openCashDrawer = true, width = 32 } = options;

  const builder = new EscPosBuilder();

  // 1. Kick Cash Drawer if requested (or for cash sales)
  if (openCashDrawer || sale.payment_method === 'CASH' || sale.payment_method === 'SPLIT') {
    builder.kickCashDrawer();
  }

  const currency = tenant?.currency_symbol || 'Rs.';

  // 2. Header
  builder.align('center');
  builder.doubleSize(true).bold(true);
  builder.println(tenant?.shop_name || 'RETAIL STORE');
  builder.doubleSize(false).bold(false);

  if (tenant?.branch_name) {
    builder.println(tenant.branch_name);
  }
  if (tenant?.address) {
    builder.println(tenant.address);
  }
  if (tenant?.phone) {
    builder.println(`Tel: ${tenant.phone}`);
  }
  if (tenant?.vat_number) {
    builder.println(`VAT No: ${tenant.vat_number}`);
  }

  builder.divider('=', width);

  // 3. Invoice & Date
  builder.align('left');
  builder.twoColumn(`Inv: ${sale.invoice_no}`, new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), width);
  builder.twoColumn(`Date: ${new Date(sale.created_at).toISOString().slice(0, 10)}`, `Cashier: ${sale.cashier_name || 'Staff'}`, width);
  
  if (sale.customer_name && sale.customer_name !== 'Walk-in Customer') {
    builder.twoColumn('Customer:', sale.customer_name, width);
  }
  if (sale.sales_associate_name) {
    builder.twoColumn('Associate:', `${sale.sales_associate_name} (${sale.sales_associate_code || ''})`, width);
  }

  builder.divider('-', width);

  // 4. Cart Items
  builder.println('ITEM          QTY   PRICE   TOTAL');
  builder.divider('-', width);

  for (const item of sale.items || []) {
    const itemName = item.name.length > (width - 16) ? item.name.slice(0, width - 16) : item.name;
    const qtyPrice = `${item.quantity} x ${item.unit_price}`;
    const total = `${currency} ${item.total.toFixed(2)}`;
    
    builder.println(itemName);
    builder.twoColumn(`  ${qtyPrice}`, total, width);
  }

  builder.divider('-', width);

  // 5. Totals
  const subtotal = sale.subtotal ?? (sale as any).total_amount ?? 0;
  const discount = sale.discount_amount ?? (sale as any).discount_total ?? 0;
  const grandTotal = sale.grand_total ?? (sale as any).total_amount ?? 0;
  const paid = sale.paid_amount ?? grandTotal;
  const change = sale.change_amount ?? 0;

  builder.twoColumn('Sub Total:', `${currency} ${subtotal.toFixed(2)}`, width);
  if (discount > 0) {
    builder.twoColumn('Discount:', `-${currency} ${discount.toFixed(2)}`, width);
  }

  builder.bold(true);
  builder.twoColumn('GRAND TOTAL:', `${currency} ${grandTotal.toFixed(2)}`, width);
  builder.bold(false);

  builder.twoColumn(`Paid (${sale.payment_method}):`, `${currency} ${paid.toFixed(2)}`, width);
  if (change > 0) {
    builder.twoColumn('Change Due:', `${currency} ${change.toFixed(2)}`, width);
  }

  builder.divider('=', width);

  // 6. Footer
  builder.align('center');
  builder.println('Thank you for your purchase!');
  builder.println('Items once sold can be exchanged');
  builder.println('within 7 days with this bill.');
  builder.println(`*** ${sale.invoice_no} ***`);

  builder.cut();

  const bytes = builder.getBytes();
  await sendBluetoothBytes(bytes);
  return true;
}

/**
 * Print Shift Z-Report directly to Bluetooth Thermal Printer
 */
export async function printZReportToBluetoothPrinter(options: {
  shift: CounterShift;
  tenant?: Tenant;
  openCashDrawer?: boolean;
  width?: 32 | 48;
}): Promise<boolean> {
  const { shift, tenant, openCashDrawer = true, width = 32 } = options;

  const builder = new EscPosBuilder();

  if (openCashDrawer) {
    builder.kickCashDrawer();
  }

  const currency = tenant?.currency_symbol || 'Rs.';

  // Header
  builder.align('center');
  builder.doubleSize(true).bold(true);
  builder.println(tenant?.shop_name || 'RETAIL STORE');
  builder.doubleSize(false).bold(false);
  builder.println('DAY END Z-REPORT / SHIFT AUDIT');
  if (tenant?.phone) builder.println(`Tel: ${tenant.phone}`);
  builder.divider('=', width);

  // Meta
  builder.align('left');
  builder.twoColumn('Z-Report #:', shift.z_report_no || `Z-${shift.id}`, width);
  builder.twoColumn('Shift ID:', shift.id, width);
  builder.twoColumn('Counter:', shift.counter_name || 'Main Counter', width);
  builder.twoColumn('Cashier:', shift.cashier_name || 'Staff', width);
  builder.twoColumn('Opened:', new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), width);
  builder.twoColumn('Closed:', shift.closed_at ? new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE', width);
  builder.divider('-', width);

  // Financials
  builder.twoColumn('Opening Cash Float:', `${currency} ${shift.opening_float.toLocaleString()}`, width);
  builder.twoColumn(`Total Sales (${shift.total_bills_count} bills):`, `${currency} ${shift.total_sales_amount.toLocaleString()}`, width);
  builder.twoColumn('  - Cash Sales:', `${currency} ${shift.total_cash_sales.toLocaleString()}`, width);
  builder.twoColumn('  - Card Sales:', `${currency} ${shift.total_card_sales.toLocaleString()}`, width);
  builder.twoColumn('  - Credit (Udalu):', `${currency} ${shift.total_credit_sales.toLocaleString()}`, width);
  if (shift.total_refunds && shift.total_refunds > 0) {
    builder.twoColumn('  - Sales Refunds:', `-${currency} ${shift.total_refunds.toLocaleString()}`, width);
  }

  builder.divider('-', width);
  builder.twoColumn('Expected In Drawer:', `${currency} ${(shift.expected_cash_in_drawer || 0).toLocaleString()}`, width);
  builder.twoColumn('Actual Counted Cash:', `${currency} ${(shift.closing_cash_actual || 0).toLocaleString()}`, width);
  
  const variance = shift.cash_variance || 0;
  const varianceText = variance === 0 ? 'Rs. 0 (BALANCED)' : variance > 0 ? `+Rs. ${variance.toLocaleString()}` : `-Rs. ${Math.abs(variance).toLocaleString()}`;
  builder.bold(true);
  builder.twoColumn('Cash Variance:', varianceText, width);
  builder.bold(false);

  builder.divider('=', width);
  builder.twoColumn('Safe Cash Withdrawal:', `${currency} ${(shift.cash_withdrawal_amount || 0).toLocaleString()}`, width);
  builder.twoColumn('Retained Float Next Day:', `${currency} ${(shift.retained_float_for_next_day || 0).toLocaleString()}`, width);
  builder.divider('=', width);

  builder.align('center');
  builder.lineFeed(1);
  builder.println('Cashier Signature: __________________');
  builder.lineFeed(1);
  builder.println('Manager Signature: __________________');
  builder.lineFeed(1);
  builder.println('Official WCS Retail Cloud Document');

  builder.cut();

  const bytes = builder.getBytes();
  await sendBluetoothBytes(bytes);
  return true;
}

/**
 * Send an isolated Cash Drawer Kick signal over Bluetooth
 */
export async function kickDrawerViaBluetooth(): Promise<boolean> {
  const builder = new EscPosBuilder();
  builder.kickCashDrawer();
  const bytes = builder.getBytes();
  await sendBluetoothBytes(bytes);
  return true;
}
