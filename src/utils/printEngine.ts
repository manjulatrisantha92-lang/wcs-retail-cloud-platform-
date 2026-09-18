import { Sale, Tenant, TenantSettings, Language, CounterShift } from '../types';

/**
 * Generates pure SVG barcode string (Code128-like / readable lines)
 */
export function generateBarcodeSvg(value: string, width = 180, height = 45): string {
  if (!value) return '';
  // Generate distinct bars based on ASCII characters
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  
  // Start guard
  bars.push({ x: currentX, w: 2 });
  currentX += 4;
  bars.push({ x: currentX, w: 1 });
  currentX += 3;

  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    const pattern = [
      (charCode % 3) + 1,
      ((charCode >> 1) % 3) + 1,
      ((charCode >> 2) % 3) + 1,
      ((charCode >> 3) % 2) + 1,
    ];
    for (let p = 0; p < pattern.length; p++) {
      const w = pattern[p];
      if (p % 2 === 0) {
        bars.push({ x: currentX, w });
      }
      currentX += w + 1;
    }
  }

  // End guard
  bars.push({ x: currentX, w: 2 });
  currentX += 3;
  bars.push({ x: currentX, w: 2 });
  currentX += 10;

  const totalWidth = Math.max(width, currentX);

  const rects = bars
    .map((b) => `<rect x="${b.x}" y="0" width="${b.w}" height="${height}" fill="#000000" />`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height + 15}" width="${totalWidth}" height="${height + 15}">
    ${rects}
    <text x="${totalWidth / 2}" y="${height + 12}" font-family="monospace" font-size="10" text-anchor="middle" fill="#000000">${value}</text>
  </svg>`;
}

/**
 * Generate full HTML for standalone Print Page (Blob URL / New Tab)
 */
export function generatePrintDocumentHtml(options: {
  sale: Sale;
  tenant?: Tenant;
  settings?: TenantSettings;
  receiptFormat: '80mm' | '58mm' | 'a4';
  showBarcode?: boolean;
  showAssociate?: boolean;
  associateOverride?: {
    name?: string;
    code?: string;
    designation?: string;
    phone?: string;
  };
  lang?: Language;
}): string {
  const {
    sale,
    tenant,
    settings,
    receiptFormat,
    showBarcode = true,
    showAssociate = settings?.show_associate_on_bill ?? true,
    associateOverride,
    lang = 'en',
  } = options;

  const currencySymbol = tenant?.currency_symbol || 'Rs.';
  const shopName = tenant?.shop_name || 'RETAIL STORE';
  const companyName = tenant?.company_name || '';
  const address = tenant?.address || '';
  const phone = tenant?.phone || '';
  const vatNumber = tenant?.vat_number || '';
  const brNumber = tenant?.br_number || '';
  const branchName = tenant?.branch_name || 'Store 1';
  const logoUrl = (settings?.show_logo_on_bill ?? true) ? tenant?.logo_url : '';

  const discountVal = (sale as any).discount_amount ?? (sale as any).discount_total ?? 0;
  const taxVal = (sale as any).tax_amount ?? (sale as any).tax_total ?? 0;
  const grandTotalVal = (sale as any).grand_total ?? (sale as any).total_amount ?? 0;
  const subtotalVal = (sale as any).subtotal ?? grandTotalVal;
  const paidAmountVal = (sale as any).paid_amount ?? (sale as any).amount_paid ?? grandTotalVal;
  const changeAmountVal = (sale as any).change_amount ?? (sale as any).balance_amount ?? 0;
  const balanceDueVal = (sale as any).balance_due ?? 0;
  const loyaltyRedeemedVal = (sale as any).loyalty_points_redeemed ?? (sale as any).loyalty_points_amount ?? 0;
  const loyaltyEarnedVal = (sale as any).loyalty_points_earned ?? 0;
  const customerLoyaltyBalanceVal = (sale as any).customer_loyalty_balance;
  const netAfterLoyaltyVal = Math.max(0, grandTotalVal - loyaltyRedeemedVal);

  const isSi = lang === 'si';
  const isTa = lang === 'ta';

  const dateStr = new Date(sale.created_at).toLocaleDateString();
  const timeStr = new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fullDateTime = `${dateStr} ${timeStr}`;

  // Associate information resolution
  const assocName = associateOverride?.name !== undefined ? associateOverride.name : sale.sales_associate_name;
  const assocCode = associateOverride?.code !== undefined ? associateOverride.code : sale.sales_associate_code;
  const assocDesig = associateOverride?.designation !== undefined ? associateOverride.designation : sale.sales_associate_designation;
  const assocTitle = settings?.associate_title_label || (isSi ? 'විකුණුම් නියෝජිත (Associate)' : isTa ? 'விற்பனை பிரதிநிதி' : 'Sales Associate');
  const hasAssociate = Boolean(showAssociate && assocName && assocName.trim());

  const barcodeSvg = showBarcode ? generateBarcodeSvg(sale.invoice_no, 200, 36) : '';

  // Items table HTML
  const itemsHtml = (sale.items || [])
    .map((item, idx) => {
      const itemName = (item as any).product_name || item.name || 'Item';
      const itemPrice = (item.unit_price || 0).toFixed(2);
      const itemQty = item.quantity || 1;
      const itemTotal = ((item as any).total_price ?? (item.unit_price || 0) * itemQty).toFixed(2);
      const customF = (item as any).custom_fields || (item as any).custom_fields_snapshot;

      let customDetails = '';
      if (customF && Object.keys(customF).length > 0) {
        const parts = [];
        if (customF.imei_number) parts.push(`IMEI: <strong>${customF.imei_number}</strong>`);
        if (customF.warranty_duration) parts.push(`Warranty: <strong>${customF.warranty_duration}</strong>`);
        if (customF.vehicle_number) parts.push(`Vehicle: <strong>${customF.vehicle_number}</strong>`);
        if (customF.ram_specs) parts.push(`Specs: ${customF.ram_specs}/${customF.storage_capacity || ''}`);
        if (customF.size_gauge) parts.push(`Size: ${customF.size_gauge}`);
        if (parts.length > 0) {
          customDetails = `<div style="font-size: 9px; color: #555; margin-top: 1px;">${parts.join(' | ')}</div>`;
        }
      }

      if (receiptFormat === 'a4') {
        return `
          <tr>
            <td style="padding: 6px 4px; border-bottom: 1px solid #e2e8f0; font-family: monospace; color: #64748b;">${idx + 1}</td>
            <td style="padding: 6px 4px; border-bottom: 1px solid #e2e8f0;">
              <strong>${itemName}</strong>
              ${customDetails}
            </td>
            <td style="padding: 6px 4px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${itemQty} ${item.unit || ''}</td>
            <td style="padding: 6px 4px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${currencySymbol} ${itemPrice}</td>
            <td style="padding: 6px 4px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold;">${currencySymbol} ${itemTotal}</td>
          </tr>
        `;
      }

      return `
        <div style="margin-bottom: 4px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="flex: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${itemName}</span>
            <span style="flex: 1; text-align: center;">${itemQty}</span>
            <span style="flex: 1; text-align: right;">${itemPrice}</span>
            <span style="flex: 1.2; text-align: right; font-weight: bold;">${itemTotal}</span>
          </div>
          ${customDetails}
        </div>
      `;
    })
    .join('');

  if (receiptFormat === 'a4') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${sale.invoice_no}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .shop-title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
    .meta-box { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    th { text-align: left; background: #0f172a; color: #fff; padding: 8px 4px; text-transform: uppercase; font-size: 10px; }
    .totals-box { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .totals-inner { width: 280px; border-top: 2px solid #0f172a; padding-top: 8px; font-size: 12px; }
    .totals-row { display: flex; justify-content: space-between; padding: 2px 0; }
    .totals-grand { font-size: 15px; font-weight: 900; border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 4px; }
    .footer { display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 30px; font-size: 10px; color: #64748b; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" style="height: 50px; margin-bottom: 6px; object-fit: contain;" />` : ''}
      <h1 class="shop-title">${shopName}</h1>
      ${companyName ? `<div style="color: #475569; font-weight: 600;">${companyName}</div>` : ''}
      <div>${address}</div>
      <div>Tel: ${phone}</div>
      ${brNumber ? `<div>BR: <strong>${brNumber}</strong> ${vatNumber ? `| VAT: <strong>${vatNumber}</strong>` : ''}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div style="background: #0f172a; color: #fff; display: inline-block; padding: 4px 10px; font-weight: 900; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px;">
        ${isSi ? 'බදු ඉන්වොයිසිය' : 'TAX INVOICE'}
      </div>
      <div><strong>Invoice #:</strong> ${sale.invoice_no}</div>
      <div><strong>Date:</strong> ${dateStr}</div>
      <div><strong>Time:</strong> ${timeStr}</div>
      <div><strong>Payment:</strong> ${sale.payment_method}</div>
    </div>
  </div>

  <div class="meta-box">
    <div>
      <div style="color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 9px;">Customer Details:</div>
      <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${sale.customer_name || 'Walk-in Customer'}</div>
      ${sale.customer_phone ? `<div>Phone: ${sale.customer_phone}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div><strong>Cashier:</strong> ${sale.cashier_name}</div>
      ${hasAssociate ? `
        <div style="margin-top: 2px;">
          <strong>${assocTitle}:</strong>
          <span>${assocCode ? `[${assocCode}] ` : ''}${assocName}</span>
          ${assocDesig ? `<span style="color: #64748b; font-size: 11px;"> (${assocDesig})</span>` : ''}
        </div>
      ` : ''}
      <div><strong>Branch:</strong> ${branchName}</div>
      ${sale.table_no ? `<div><strong>Table:</strong> ${sale.table_no}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Item Description</th>
        <th style="text-align: center; width: 60px;">Qty</th>
        <th style="text-align: right; width: 100px;">Unit Price</th>
        <th style="text-align: right; width: 100px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="totals-inner">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span style="font-family: monospace;">${currencySymbol} ${subtotalVal.toFixed(2)}</span>
      </div>
      ${discountVal > 0 ? `
        <div class="totals-row" style="color: #059669;">
          <span>Discount:</span>
          <span style="font-family: monospace;">-${currencySymbol} ${discountVal.toFixed(2)}</span>
        </div>
      ` : ''}
      ${taxVal > 0 ? `
        <div class="totals-row">
          <span>VAT / Tax:</span>
          <span style="font-family: monospace;">+${currencySymbol} ${taxVal.toFixed(2)}</span>
        </div>
      ` : ''}
      ${loyaltyRedeemedVal > 0 ? `
        <div class="totals-row">
          <span>Gross Total:</span>
          <span style="font-family: monospace;">${currencySymbol} ${grandTotalVal.toFixed(2)}</span>
        </div>
        <div class="totals-row" style="color: #475569;">
          <span>Loyalty Points Discount:</span>
          <span style="font-family: monospace;">-${currencySymbol} ${loyaltyRedeemedVal.toFixed(2)}</span>
        </div>
        <div class="totals-row totals-grand" style="border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a; padding: 4px 0; margin: 4px 0;">
          <span>RECEIPT TOTAL:</span>
          <span style="font-family: monospace;">${currencySymbol} ${netAfterLoyaltyVal.toFixed(2)}</span>
        </div>
      ` : `
        <div class="totals-row totals-grand" style="border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a; padding: 4px 0; margin: 4px 0;">
          <span>RECEIPT TOTAL:</span>
          <span style="font-family: monospace;">${currencySymbol} ${grandTotalVal.toFixed(2)}</span>
        </div>
      `}
      <div class="totals-row" style="color: #64748b; font-size: 11px;">
        <span>Amount Paid:</span>
        <span style="font-family: monospace;">${currencySymbol} ${paidAmountVal.toFixed(2)}</span>
      </div>
      ${changeAmountVal > 0 ? `
        <div class="totals-row" style="color: #64748b; font-size: 11px;">
          <span>Change Balance:</span>
          <span style="font-family: monospace;">${currencySymbol} ${changeAmountVal.toFixed(2)}</span>
        </div>
      ` : ''}
      ${balanceDueVal > 0 ? `
        <div class="totals-row" style="color: #be123c; font-weight: bold; font-size: 11px;">
          <span>Credit Ledger Balance:</span>
          <span style="font-family: monospace;">${currencySymbol} ${balanceDueVal.toFixed(2)}</span>
        </div>
      ` : ''}
      ${(loyaltyRedeemedVal > 0 || loyaltyEarnedVal > 0 || customerLoyaltyBalanceVal !== undefined) ? `
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 6px; font-size: 10px;">
          <div style="font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">⭐ Loyalty Points Details (1 pt = ${currencySymbol} 1.00)</div>
          ${loyaltyRedeemedVal > 0 ? `<div style="display: flex; justify-content: space-between; color: #334155;"><span>Loyalty Points Redeemed:</span><span>${loyaltyRedeemedVal.toLocaleString()} pts (${currencySymbol} ${loyaltyRedeemedVal.toFixed(2)})</span></div>` : ''}
          ${loyaltyEarnedVal > 0 ? `<div style="display: flex; justify-content: space-between; color: #0f172a; font-weight: 600; margin-top: 2px;"><span>Points Earned This Bill:</span><span>+${loyaltyEarnedVal.toLocaleString()} pts</span></div>` : ''}
          ${customerLoyaltyBalanceVal !== undefined ? `<div style="display: flex; justify-content: space-between; font-weight: bold; color: #0f172a; margin-top: 2px;"><span>Customer Loyalty Balance:</span><span>${customerLoyaltyBalanceVal.toLocaleString()} pts</span></div>` : ''}
        </div>
      ` : ''}
    </div>
  </div>

  <div class="footer">
    <div style="max-width: 350px;">
      <p style="margin: 0 0 40px 0;">${settings?.terms_conditions || 'Goods once sold can be exchanged within 7 days with original bill.'}</p>
      <div style="border-top: 1px dashed #94a3b8; text-align: center; padding-top: 4px;">Customer Acceptance Signature</div>
    </div>
    <div style="text-align: right;">
      <div style="margin-bottom: 10px;">${barcodeSvg}</div>
      <div style="border-top: 1px dashed #94a3b8; text-align: center; padding-top: 4px; width: 220px; margin-left: auto;">Authorized Store Stamp</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
  }

  // 80mm or 58mm Thermal Receipt Layout (Exact match to Screenshot 2 & 3)
  const is58mm = receiptFormat === '58mm';
  const paperWidth = is58mm ? '58mm' : '80mm';
  const containerWidth = is58mm ? '260px' : '340px';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill - ${sale.invoice_no}</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0mm;
    }
    body {
      font-family: 'Courier New', Courier, monospace, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 6px 8px;
      color: #000;
      background: #fff;
      font-size: ${is58mm ? '10px' : '11px'};
      line-height: 1.25;
      width: ${containerWidth};
      box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .shop-header {
      text-align: center;
      padding-bottom: 4px;
      margin-bottom: 4px;
    }
    .shop-name {
      font-size: ${is58mm ? '13px' : '15px'};
      font-weight: 900;
      text-transform: uppercase;
      margin: 0 0 2px 0;
    }
    .shop-sub {
      font-size: 10px;
      margin: 1px 0;
      font-family: sans-serif;
    }
    .divider-solid {
      border-top: 1px solid #000;
      margin: 4px 0;
    }
    .divider-dashed {
      border-top: 1px dashed #444;
      margin: 4px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 1px 0;
      font-size: 10px;
    }
    .table-head {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    .receipt-total {
      font-size: 13px;
      font-weight: 900;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 3px 0;
      margin: 3px 0;
    }
    .barcode-container {
      text-align: center;
      margin: 6px 0 3px 0;
    }
    .footer-msg {
      text-align: center;
      font-size: 9px;
      margin-top: 6px;
      font-family: sans-serif;
    }
    @media print {
      body { width: 100%; padding: 2mm 3mm; }
    }
  </style>
</head>
<body>
  <div class="shop-header">
    ${logoUrl ? `<div style="text-align: center; margin-bottom: 4px;"><img src="${logoUrl}" style="height: 40px; max-width: 140px; object-fit: contain;" /></div>` : ''}
    <div class="shop-name">${shopName}</div>
    ${address ? `<div class="shop-sub">${address}</div>` : ''}
    ${phone ? `<div class="shop-sub">Tel: ${phone}</div>` : ''}
    ${vatNumber ? `<div class="shop-sub">VAT Reg: ${vatNumber}</div>` : ''}
    ${brNumber ? `<div class="shop-sub">BR: ${brNumber}</div>` : ''}
  </div>

  <div class="divider-solid"></div>

  <div class="meta-row">
    <span>${fullDateTime}</span>
    <span class="bold">Store: 1</span>
  </div>
  <div class="meta-row bold">
    <span>Sales Receipt ${sale.invoice_no}</span>
  </div>

  <div class="divider-solid"></div>

  <div class="meta-row">
    <span>Cashier: <strong>${sale.cashier_name}</strong></span>
    <span><strong>${sale.counter_name || (sale as any).counter_id || 'Counter 01'}</strong></span>
  </div>
  ${hasAssociate ? `
  <div class="meta-row">
    <span>${assocTitle}: <strong>${assocCode ? `[${assocCode}] ` : ''}${assocName}</strong></span>
  </div>
  ${assocDesig ? `
  <div class="meta-row" style="font-size: 9px; color: #333;">
    <span>Role / Desig:</span>
    <span><strong>${assocDesig}</strong></span>
  </div>
  ` : ''}
  ` : ''}
  <div class="meta-row">
    <span>Customer: ${sale.customer_name || 'Walk-in Customer'}</span>
  </div>
  ${sale.table_no ? `<div class="meta-row bold"><span>Table: ${sale.table_no}</span></div>` : ''}

  <div class="divider-solid"></div>

  <div class="table-head">
    <span style="flex: 2;">Item Name</span>
    <span style="flex: 1; text-align: center;">Qty</span>
    <span style="flex: 1; text-align: right;">U/Price</span>
    <span style="flex: 1.2; text-align: right;">Total</span>
  </div>

  <div style="margin-bottom: 4px;">
    ${itemsHtml}
  </div>

  <div class="divider-dashed"></div>

  <div class="totals-row">
    <span>Subtotal:</span>
    <span>${subtotalVal.toFixed(2)}</span>
  </div>
  ${discountVal > 0 ? `
    <div class="totals-row" style="color: #000;">
      <span>Discount:</span>
      <span>-${discountVal.toFixed(2)}</span>
    </div>
  ` : ''}
  ${taxVal > 0 ? `
    <div class="totals-row">
      <span>Tax / VAT:</span>
      <span>+${taxVal.toFixed(2)}</span>
    </div>
  ` : ''}

  ${loyaltyRedeemedVal > 0 ? `
    <div class="totals-row">
      <span>Gross Total:</span>
      <span>${grandTotalVal.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Loyalty Points Discount:</span>
      <span>-${loyaltyRedeemedVal.toFixed(2)}</span>
    </div>
    <div class="totals-row receipt-total">
      <span>RECEIPT TOTAL:</span>
      <span>${netAfterLoyaltyVal.toFixed(2)}</span>
    </div>
  ` : `
    <div class="totals-row receipt-total">
      <span>RECEIPT TOTAL:</span>
      <span>${grandTotalVal.toFixed(2)}</span>
    </div>
  `}

  <div class="totals-row">
    <span>Amount Tendered:</span>
    <span>${paidAmountVal.toFixed(2)}</span>
  </div>
  <div class="totals-row">
    <span>Change Given:</span>
    <span>${changeAmountVal.toFixed(2)}</span>
  </div>
  <div class="totals-row">
    <span>Payment: ${sale.payment_method === 'LOYALTY_POINTS' ? 'Loyalty Points Pay' : sale.payment_method}</span>
  </div>

  ${(loyaltyRedeemedVal > 0 || loyaltyEarnedVal > 0 || customerLoyaltyBalanceVal !== undefined) ? `
    <div class="divider-dashed"></div>
    <div style="font-size: 9px; margin: 2px 0;">
      <div class="bold uppercase" style="display: flex; justify-content: space-between;">
        <span>LOYALTY POINTS DETAILS</span>
        <span>1 pt = ${currencySymbol} 1.00</span>
      </div>
      ${loyaltyRedeemedVal > 0 ? `
        <div class="totals-row">
          <span>Loyalty Points Redeemed:</span>
          <span>${loyaltyRedeemedVal.toLocaleString()} pts (${currencySymbol} ${loyaltyRedeemedVal.toFixed(2)})</span>
        </div>
      ` : ''}
      ${loyaltyEarnedVal > 0 ? `
        <div class="totals-row bold" style="margin-top: 2px;">
          <span>Points Earned This Bill:</span>
          <span>+${loyaltyEarnedVal.toLocaleString()} pts</span>
        </div>
      ` : ''}
      ${customerLoyaltyBalanceVal !== undefined ? `
        <div class="totals-row bold" style="margin-top: 2px;">
          <span>Customer Loyalty Balance:</span>
          <span>${customerLoyaltyBalanceVal.toLocaleString()} pts</span>
        </div>
      ` : ''}
    </div>
  ` : ''}
  ${balanceDueVal > 0 ? `
    <div class="totals-row bold" style="margin-top: 2px;">
      <span>CREDIT DUE:</span>
      <span>${balanceDueVal.toFixed(2)}</span>
    </div>
  ` : ''}

  <div class="divider-solid"></div>

  ${showBarcode ? `
    <div class="barcode-container">
      ${barcodeSvg}
    </div>
  ` : ''}

  <div class="footer-msg">
    <div class="bold">${isSi ? 'අප සමඟ ගනුදෙනු කළ ඔබට ස්තුතියි!' : 'Thank You For Dining With Us!'}</div>
    <div>${isSi ? 'නැවත එන්න.' : 'Come Again.'}</div>
    <div style="margin-top: 4px; color: #555; font-size: 8px;">System by WCS POS</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
}

/**
 * Open a clean standalone Blob print tab for Kitchen Order Ticket (KOT)
 */
export function openCleanKotPrintTab(options: {
  tenant?: Tenant;
  tableNumber?: string;
  orderType?: string;
  cashierName?: string;
  customerName?: string;
  notes?: string;
  items: Array<{ product_name: string; quantity: number; unit?: string; notes?: string; custom_fields?: any }>;
  kotNumber?: string | number;
}): Window | null {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const shopName = options.tenant?.shop_name || 'RESTAURANT';
  const table = options.tableNumber || 'Takeaway';
  const kotNo = options.kotNumber || `KOT-${Math.floor(100 + Math.random() * 900)}`;

  const itemsListHtml = options.items
    .map(
      (item, idx) => `
    <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; font-weight: bold; padding: 4px 0; border-bottom: 1px dashed #666;">
      <span style="width: 32px; font-size: 15px; font-family: monospace;">[${item.quantity}]</span>
      <span style="flex: 1; padding: 0 4px; text-transform: uppercase;">${item.product_name}</span>
    </div>
    ${item.notes ? `<div style="font-size: 10px; color: #333; padding-left: 36px;">⚠️ Note: ${item.notes}</div>` : ''}
  `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KOT - ${kotNo}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
      padding: 6px 10px;
      width: 320px;
      color: #000;
      background: #fff;
      font-size: 11px;
      box-sizing: border-box;
    }
    .center { text-align: center; }
    .bold { font-weight: 900; }
    .divider { border-top: 2px solid #000; margin: 5px 0; }
    .divider-dash { border-top: 1px dashed #000; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="center">
    <div style="font-size: 15px;" class="bold">*** KITCHEN ORDER TICKET (KOT) ***</div>
    <div style="font-size: 11px; text-transform: uppercase;">${shopName}</div>
  </div>
  <div class="divider"></div>
  <div class="row" style="font-size: 14px;">
    <span class="bold">TABLE: ${table}</span>
    <span class="bold">${options.orderType || 'DINE IN'}</span>
  </div>
  <div class="row">
    <span>Token / Ticket: <strong>${kotNo}</strong></span>
    <span>${timeStr}</span>
  </div>
  <div class="row">
    <span>Server / Cashier: ${options.cashierName || 'Staff'}</span>
    <span>${dateStr}</span>
  </div>
  ${options.customerName ? `<div class="row"><span>Customer: ${options.customerName}</span></div>` : ''}
  <div class="divider"></div>
  <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">
    <span>ORDERED ITEMS:</span>
  </div>
  <div>
    ${itemsListHtml}
  </div>
  ${options.notes ? `<div class="divider-dash"></div><div class="bold" style="font-size: 11px;">SPECIAL INSTRUCTIONS: ${options.notes}</div>` : ''}
  <div class="divider"></div>
  <div class="center bold" style="font-size: 10px; margin-top: 6px;">
    --- SEND TO KITCHEN CHEF ---
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 200);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  return window.open(blobUrl, '_blank');
}

/**
 * Generate full HTML for standalone Barcode Label Printing Page (Blob URL / New Tab)
 */
export function generateBarcodeLabelsHtml(options: {
  items: Array<{
    storeName?: string;
    productName: string;
    price?: number;
    currencySymbol?: string;
    barcode: string;
    sku?: string;
    expiryDate?: string;
    customBadge?: string;
  }>;
  columns: number;
  widthMm: number;
  heightMm: number;
  colGapMm: number;
  rowGapMm: number;
  outerMarginMm: number;
  fields: {
    showStoreName: boolean;
    showProductName: boolean;
    showPrice: boolean;
    showBarcodeText: boolean;
    showExpiryDate: boolean;
    showCustomBadge: boolean;
    showSku?: boolean;
  };
}): string {
  const {
    items,
    columns,
    widthMm,
    heightMm,
    colGapMm,
    rowGapMm,
    outerMarginMm,
    fields,
  } = options;

  const labelsHtml = items
    .map((item) => {
      const barcodeSvg = generateBarcodeSvg(item.barcode || '4790000000000', 160, 30);
      const formattedPrice = item.price !== undefined ? `${item.currencySymbol || 'Rs.'} ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';

      return `
      <div class="sticker-label">
        ${fields.showStoreName && item.storeName ? `
          <div class="store-name">${item.storeName}</div>
        ` : ''}

        ${fields.showProductName ? `
          <div class="product-name">${item.productName}</div>
        ` : ''}

        ${fields.showPrice && formattedPrice ? `
          <div class="price-tag">${formattedPrice}</div>
        ` : ''}

        <div class="barcode-wrapper">
          ${barcodeSvg}
        </div>

        <div class="footer-row">
          ${(fields.showSku !== false) && item.sku ? `<span class="sku-code">SKU: ${item.sku}</span>` : '<span></span>'}
          ${fields.showExpiryDate && item.expiryDate ? `<span class="exp-date">EXP: ${item.expiryDate}</span>` : ''}
          ${fields.showCustomBadge && item.customBadge ? `<span class="custom-badge">${item.customBadge}</span>` : ''}
        </div>
      </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Thermal Barcode Labels - WCS POS</title>
  <style>
    @page {
      size: auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      padding: ${outerMarginMm}mm;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .sheet-grid {
      display: grid;
      grid-template-columns: repeat(${columns}, ${widthMm}mm);
      column-gap: ${colGapMm}mm;
      row-gap: ${rowGapMm}mm;
      width: fit-content;
    }
    .sticker-label {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      max-height: ${heightMm}mm;
      padding: 1.5mm 2mm;
      background: #ffffff;
      border: 1px dashed #dddddd;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .store-name {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.1;
    }
    .product-name {
      font-size: 9.5px;
      font-weight: 800;
      color: #000000;
      line-height: 1.15;
      max-height: 2.3em;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0.5mm 0;
    }
    .price-tag {
      font-size: 11px;
      font-weight: 900;
      color: #000000;
      line-height: 1.1;
    }
    .barcode-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0.5mm 0;
      max-height: 11mm;
      overflow: hidden;
    }
    .barcode-wrapper svg {
      max-width: 96%;
      height: auto;
      max-height: 11mm;
    }
    .footer-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7px;
      font-family: monospace;
      color: #374151;
      font-weight: 700;
      line-height: 1;
      padding-top: 0.5mm;
      border-top: 0.5px solid #e5e7eb;
    }
    .sku-code {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 55%;
    }
    .exp-date {
      color: #1f2937;
      white-space: nowrap;
    }
    .custom-badge {
      background: #000;
      color: #fff;
      padding: 0 2px;
      border-radius: 2px;
    }
    @media print {
      body {
        padding: ${outerMarginMm}mm;
      }
      .sticker-label {
        border: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="sheet-grid">
    ${labelsHtml}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
}

/**
 * Open a clean standalone Blob print tab for Barcode Labels (Matches Screenshot 3)
 */
export function openCleanBarcodePrintTab(options: Parameters<typeof generateBarcodeLabelsHtml>[0]): Window | null {
  const htmlContent = generateBarcodeLabelsHtml(options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  return window.open(blobUrl, '_blank');
}

/**
 * Generate full HTML for standalone Report Print Page (A4 Portrait, A4 Landscape, or 80mm Slip)
 */
export function generateReportDocumentHtml(options: {
  title: string;
  subtitle?: string;
  category?: string;
  dateRangeText?: string;
  tenant?: Tenant;
  settings?: TenantSettings;
  kpis?: Array<{ label: string; value: string; sublabel?: string; color?: string }>;
  headers: string[];
  rows: (string | number)[][];
  summaryRows?: Array<{ label: string; value: string; isBold?: boolean; isGrandTotal?: boolean }>;
  footerNotes?: string;
  isLandscape?: boolean;
  format?: 'a4_portrait' | 'a4_landscape' | '80mm';
  showSignatures?: boolean;
  showLogo?: boolean;
  printedBy?: string;
}): string {
  const {
    title,
    subtitle,
    category = 'BUSINESS INTELLIGENCE REPORT',
    dateRangeText,
    tenant,
    kpis = [],
    headers,
    rows,
    summaryRows = [],
    footerNotes,
    isLandscape = false,
    format,
    showSignatures = true,
    showLogo = true,
    printedBy = 'Authorized Manager',
  } = options;

  const actualFormat = format || (isLandscape ? 'a4_landscape' : 'a4_portrait');
  const is80mm = actualFormat === '80mm';
  const isLand = actualFormat === 'a4_landscape';
  const currencySymbol = tenant?.currency_symbol || 'Rs.';

  const kpisHtml =
    kpis.length > 0
      ? `<div class="kpi-grid" style="grid-template-columns: repeat(${Math.min(kpis.length, isLand ? 4 : 4)}, 1fr);">
      ${kpis
        .map(
          (k) => `<div class="kpi-card">
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-value">${k.value}</div>
            ${k.sublabel ? `<div class="kpi-sub">${k.sublabel}</div>` : ''}
          </div>`
        )
        .join('')}
    </div>`
      : '';

  const tableHeaderHtml = headers
    .map((h) => {
      const isNum =
        h.toLowerCase().includes('price') ||
        h.toLowerCase().includes('cost') ||
        h.toLowerCase().includes('total') ||
        h.toLowerCase().includes('amount') ||
        h.toLowerCase().includes('balance') ||
        h.toLowerCase().includes('value') ||
        h.toLowerCase().includes('margin') ||
        h.toLowerCase().includes('qty') ||
        h.toLowerCase().includes('count');
      return `<th class="${isNum ? 'text-right' : 'text-left'}">${h}</th>`;
    })
    .join('');

  const tableRowsHtml = rows
    .map(
      (r, rowIdx) =>
        `<tr class="${rowIdx % 2 === 1 ? 'even-row' : 'odd-row'}">${r
          .map((c) => {
            const strCell = String(c);
            const isRight =
              typeof c === 'number' ||
              strCell.startsWith(currencySymbol) ||
              strCell.startsWith('$') ||
              strCell.startsWith('Rs.') ||
              strCell.endsWith('%') ||
              (!isNaN(Number(strCell)) && strCell.trim() !== '');
            return `<td class="${isRight ? 'text-right' : 'text-left'}">${c}</td>`;
          })
          .join('')}</tr>`
    )
    .join('');

  const summaryHtml =
    summaryRows.length > 0
      ? `<div class="summary-box">
      ${summaryRows
        .map(
          (s) =>
            `<div class="summary-row ${s.isGrandTotal ? 'grand-total' : s.isBold ? 'bold' : ''}">
              <span>${s.label}</span>
              <span class="font-mono">${s.value}</span>
            </div>`
        )
        .join('')}
    </div>`
      : '';

  const signaturesHtml = showSignatures
    ? `<div class="signatures-grid">
        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-title">Prepared By</div>
          <div class="sig-sub">${printedBy}</div>
        </div>
        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-title">Checked & Verified By</div>
          <div class="sig-sub">Store Supervisor</div>
        </div>
        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-title">Authorized Signatory</div>
          <div class="sig-sub">Managing Director</div>
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} - ${tenant?.shop_name || 'POS Report'}</title>
  <style>
    @page {
      size: ${is80mm ? '80mm auto' : isLand ? 'A4 landscape' : 'A4 portrait'};
      margin: ${is80mm ? '4mm' : '10mm 12mm 10mm 12mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: ${is80mm ? '4px' : '0'};
      color: #0f172a;
      background: #ffffff;
      font-size: ${is80mm ? '9.5px' : '10.5px'};
      line-height: 1.35;
      width: ${is80mm ? '300px' : '100%'};
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      gap: 12px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .shop-logo {
      height: 48px;
      width: auto;
      max-width: 110px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      padding: 2px;
      border-radius: 4px;
    }
    .shop-title {
      font-size: ${is80mm ? '13px' : '16px'};
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.15;
    }
    .shop-sub {
      font-size: ${is80mm ? '8.5px' : '9.5px'};
      color: #475569;
      margin-top: 1.5px;
    }
    .report-meta {
      text-align: right;
    }
    .report-badge {
      font-size: 8.5px;
      font-weight: 800;
      color: #3730a3;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      padding: 1px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 3px;
    }
    .report-name {
      font-size: ${is80mm ? '12px' : '14px'};
      font-weight: 900;
      color: #1e3a8a;
      text-transform: uppercase;
      line-height: 1.15;
    }
    .report-date {
      font-size: ${is80mm ? '8px' : '9px'};
      color: #64748b;
      margin-top: 2px;
    }
    .kpi-grid {
      display: grid;
      gap: 6px;
      margin-bottom: 12px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 8px;
    }
    .kpi-label {
      font-size: 8px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .kpi-value {
      font-size: ${is80mm ? '11px' : '13px'};
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
      margin-top: 1px;
    }
    .kpi-sub {
      font-size: 8px;
      color: #64748b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 4px 6px;
      font-size: 9.5px;
      color: #1e293b;
    }
    .even-row td {
      background: #f8fafc;
    }
    .odd-row td {
      background: #ffffff;
    }
    .text-right {
      text-align: right;
      font-family: monospace;
      font-weight: 600;
    }
    .text-left {
      text-align: left;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 10px;
      margin-bottom: 14px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding: 2px 0;
      color: #334155;
    }
    .summary-row.bold {
      font-weight: 800;
      color: #0f172a;
    }
    .summary-row.grand-total {
      font-size: 11.5px;
      font-weight: 900;
      color: #1e1b4b;
      border-top: 1.5px solid #cbd5e1;
      padding-top: 4px;
      margin-top: 3px;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 4px;
      height: 28px;
    }
    .sig-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e293b;
    }
    .sig-sub {
      font-size: 8px;
      color: #64748b;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #94a3b8;
      page-break-inside: avoid;
    }
    @media print {
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="header-left">
      ${showLogo && tenant?.logo_url ? `<img src="${tenant.logo_url}" class="shop-logo" alt="${tenant.shop_name}" />` : ''}
      <div>
        <div class="shop-title">${tenant?.shop_name || 'Retail Point of Sale'}</div>
        ${tenant?.company_name ? `<div class="shop-sub" style="font-weight: 700;">${tenant.company_name}</div>` : ''}
        <div class="shop-sub">${tenant?.address || ''} ${tenant?.phone ? `• Tel: ${tenant.phone}` : ''}</div>
        ${tenant?.br_number ? `<div class="shop-sub">BR Reg: ${tenant.br_number} ${tenant.vat_number ? `• VAT: ${tenant.vat_number}` : ''}</div>` : ''}
      </div>
    </div>
    <div class="report-meta">
      <div class="report-badge">${category}</div>
      <div class="report-name">${title}</div>
      ${subtitle ? `<div class="shop-sub">${subtitle}</div>` : ''}
      ${dateRangeText ? `<div class="shop-sub" style="font-weight: 600;">Period: ${dateRangeText}</div>` : ''}
      <div class="report-date">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  ${kpisHtml}

  <table>
    <thead>
      <tr>${tableHeaderHtml}</tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  ${summaryHtml}

  ${signaturesHtml}

  <div class="footer">
    <div>${footerNotes || 'Official WCS Retail Cloud Document • All figures verified'}</div>
    <div>Page 1 of 1</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
}

/**
 * Open a clean standalone Blob print tab for Table Reports (A4 Landscape / Portrait / 80mm)
 */
export function openCleanReportPrintTab(options: Parameters<typeof generateReportDocumentHtml>[0]): Window | null {
  const html = generateReportDocumentHtml(options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  return window.open(blobUrl, '_blank');
}

/**
 * Open a clean standalone Blob print tab in browser (Matches Screenshot 3)
 */
export function openCleanPrintTab(options: {
  sale: Sale;
  tenant?: Tenant;
  settings?: TenantSettings;
  receiptFormat: '80mm' | '58mm' | 'a4';
  showBarcode?: boolean;
  showAssociate?: boolean;
  associateOverride?: {
    name?: string;
    code?: string;
    designation?: string;
    phone?: string;
  };
  lang?: Language;
}): Window | null {
  const htmlContent = generatePrintDocumentHtml(options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const printWindow = window.open(blobUrl, '_blank');
  return printWindow;
}

/**
 * Generate full HTML for Day End Shift Z-Report (Matches Bill Printout step: 80mm, 58mm, A4)
 */
export function generateZReportDocumentHtml(options: {
  shift: CounterShift;
  tenant?: Tenant;
  settings?: TenantSettings;
  receiptFormat: '80mm' | '58mm' | 'a4';
  lang?: Language;
}): string {
  const { shift, tenant, settings, receiptFormat, lang = 'en' } = options;

  const currencySymbol = tenant?.currency_symbol || 'Rs.';
  const shopName = tenant?.shop_name || 'RETAIL STORE';
  const companyName = tenant?.company_name || '';
  const address = tenant?.address || '';
  const phone = tenant?.phone || '';
  const vatNumber = tenant?.vat_number || '';
  const brNumber = tenant?.br_number || '';
  const branchName = tenant?.branch_name || 'Counter 1';
  const logoUrl = (settings?.show_logo_on_bill ?? true) ? tenant?.logo_url : '';

  const is58 = receiptFormat === '58mm';
  const isA4 = receiptFormat === 'a4';

  const zReportBarcodeSvg = generateBarcodeSvg(shift.z_report_no || `ZREP-${shift.id}`, is58 ? 140 : 180, 38);

  const openedStr = new Date(shift.opened_at).toLocaleDateString() + ' ' +
    new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const closedStr = shift.closed_at
    ? new Date(shift.closed_at).toLocaleDateString() + ' ' +
      new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'SHIFT STILL OPEN';

  const variance = shift.cash_variance ?? 0;
  const varianceClass = variance === 0 ? 'color: #059669;' : variance > 0 ? 'color: #0d9488;' : 'color: #e11d48;';
  const varianceLabel = variance === 0 ? 'BALANCED (Rs. 0)' : variance > 0 ? `SURPLUS (+${currencySymbol} ${variance.toLocaleString()})` : `SHORTAGE (-${currencySymbol} ${Math.abs(variance).toLocaleString()})`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Z-Report - ${shift.z_report_no || shift.id}</title>
  <style>
    @page {
      margin: ${isA4 ? '15mm' : '0'};
      size: ${isA4 ? 'A4 portrait' : is58 ? '58mm auto' : '80mm auto'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
      font-size: ${is58 ? '10px' : isA4 ? '13px' : '11px'};
      line-height: 1.35;
      color: #000;
      background: #fff;
      padding: ${isA4 ? '20px' : is58 ? '5px 4px' : '10px 8px'};
      width: ${isA4 ? '100%' : is58 ? '58mm' : '80mm'};
      margin: 0 auto;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .extra-bold { font-weight: 900; }
    .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
    .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
    .shop-title {
      font-size: ${is58 ? '13px' : isA4 ? '20px' : '16px'};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-z {
      display: inline-block;
      border: 1px solid #000;
      padding: 2px 6px;
      font-weight: 800;
      font-size: ${is58 ? '9px' : '11px'};
      text-transform: uppercase;
      margin: 3px 0;
    }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .section-title {
      font-weight: 800;
      text-transform: uppercase;
      font-size: ${is58 ? '10px' : '11px'};
      background: #f1f5f9;
      padding: 2px 4px;
      margin: 6px 0 3px 0;
    }
    .kpi-box {
      border: 1px solid #cbd5e1;
      padding: 6px;
      margin: 6px 0;
      background: #f8fafc;
    }
    .kpi-main-val {
      font-size: ${is58 ? '13px' : '16px'};
      font-weight: 900;
    }
    .barcode-wrap {
      text-align: center;
      margin: 6px 0;
    }
    .signatures {
      margin-top: 15px;
      padding-top: 10px;
    }
    .sign-line {
      border-top: 1px dashed #64748b;
      margin-top: 25px;
      padding-top: 2px;
      font-size: 9px;
      text-align: center;
    }
    @media print {
      body {
        width: 100% !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="center">
    ${logoUrl ? `<img src="${logoUrl}" alt="logo" style="max-height: 40px; margin-bottom: 4px;" />` : ''}
    <div class="shop-title">${shopName}</div>
    ${companyName ? `<div>${companyName}</div>` : ''}
    ${branchName ? `<div style="font-weight: 600;">${branchName}</div>` : ''}
    ${address ? `<div>${address}</div>` : ''}
    ${phone ? `<div>Tel: ${phone}</div>` : ''}
    ${vatNumber ? `<div>VAT: ${vatNumber}</div>` : ''}
    ${brNumber ? `<div>BR: ${brNumber}</div>` : ''}
    <div class="badge-z">DAY END Z-REPORT & AUDIT</div>
  </div>

  <div class="double-divider"></div>

  <!-- Meta Info -->
  <div class="row"><span class="bold">Z-Report No:</span><span class="bold">${shift.z_report_no || `Z-${shift.id}`}</span></div>
  <div class="row"><span>Shift ID:</span><span>${shift.id}</span></div>
  <div class="row"><span>Counter:</span><span>${shift.counter_name}</span></div>
  <div class="row"><span class="bold">Cashier:</span><span class="bold">${shift.cashier_name}</span></div>
  <div class="row"><span>Opened At:</span><span>${openedStr}</span></div>
  <div class="row"><span>Closed At:</span><span>${closedStr}</span></div>

  <div class="divider"></div>

  <!-- Cash Float & Sales Breakdown -->
  <div class="section-title">Sales Revenue & Collections</div>
  <div class="row"><span>Opening Cash Float:</span><span class="bold">${currencySymbol} ${shift.opening_float.toLocaleString()}</span></div>
  <div class="row"><span>Total Bills Processed:</span><span class="bold">${shift.total_bills_count} bills</span></div>
  <div class="row"><span class="bold">GROSS SALES REVENUE:</span><span class="bold extra-bold">${currencySymbol} ${shift.total_sales_amount.toLocaleString()}</span></div>
  <div class="divider"></div>
  <div class="row" style="padding-left: 8px;"><span>• Cash In Drawer:</span><span class="bold">${currencySymbol} ${shift.total_cash_sales.toLocaleString()}</span></div>
  <div class="row" style="padding-left: 8px;"><span>• Card / POS Terminal:</span><span class="bold">${currencySymbol} ${shift.total_card_sales.toLocaleString()}</span></div>
  <div class="row" style="padding-left: 8px;"><span>• Customer Credit (Udalu):</span><span class="bold">${currencySymbol} ${shift.total_credit_sales.toLocaleString()}</span></div>
  ${(shift.total_refunds || 0) > 0 ? `<div class="row" style="padding-left: 8px; color: #e11d48;"><span>• Sales Returns / Refunds:</span><span class="bold">-${currencySymbol} ${(shift.total_refunds || 0).toLocaleString()}</span></div>` : ''}

  <div class="double-divider"></div>

  <!-- Cash Drawer Audit -->
  <div class="section-title">Physical Cash Drawer Audit</div>
  <div class="row"><span>Expected Cash in Drawer:</span><span class="bold">${currencySymbol} ${(shift.expected_cash_in_drawer || 0).toLocaleString()}</span></div>
  <div class="row"><span>Actual Counted Cash:</span><span class="bold">${currencySymbol} ${(shift.closing_cash_actual || 0).toLocaleString()}</span></div>
  
  <div class="kpi-box center">
    <div style="font-size: 10px; font-weight: 800; text-transform: uppercase;">Cash Drawer Variance</div>
    <div class="kpi-main-val" style="${varianceClass}">${varianceLabel}</div>
    <div style="font-size: 9px; color: #64748b;">(Opening Float + Cash Sales - Payouts)</div>
  </div>

  <div class="divider"></div>

  <!-- Safe Settlement & Next Day Retained Float -->
  <div class="section-title">End of Day Settlement & Safe Deposit</div>
  <div class="row"><span class="bold">Safe Cash Drop / Withdrawal:</span><span class="bold extra-bold" style="color: #e11d48;">${currencySymbol} ${(shift.cash_withdrawal_amount || 0).toLocaleString()}</span></div>
  <div class="row"><span class="bold">Retained Float for Tomorrow:</span><span class="bold" style="color: #0d9488;">${currencySymbol} ${(shift.retained_float_for_next_day || 0).toLocaleString()}</span></div>

  ${shift.notes ? `<div class="divider"></div><div style="font-size: 10px;"><strong>Notes:</strong> ${shift.notes}</div>` : ''}

  <!-- Barcode -->
  <div class="barcode-wrap">
    ${zReportBarcodeSvg}
  </div>

  <!-- Signatures -->
  <div class="signatures">
    <table style="width: 100%;">
      <tr>
        <td style="width: 48%; vertical-align: bottom;">
          <div class="sign-line">Cashier Signature<br /><strong>${shift.cashier_name}</strong></div>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; vertical-align: bottom;">
          <div class="sign-line">Manager / Auditor Signature<br /><strong>Store Supervisor</strong></div>
        </td>
      </tr>
    </table>
  </div>

  <div class="center" style="margin-top: 12px; font-size: 9px; color: #64748b;">
    <div>Official WCS Retail Cloud System Document</div>
    <div>Printed: ${new Date().toLocaleString()}</div>
    <div>*** END OF SHIFT REPORT ***</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;
}

/**
 * Open a clean standalone Blob print tab for Day End Shift Z-Report
 */
export function openCleanZReportPrintTab(options: Parameters<typeof generateZReportDocumentHtml>[0]): Window | null {
  const html = generateZReportDocumentHtml(options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  return window.open(blobUrl, '_blank');
}




