import { Sale, Tenant, Language } from '../types';

/**
 * Format phone number to international WhatsApp format (especially Sri Lanka +94)
 */
export function formatSriLankanPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove spaces, hyphens, parentheses, plus
  let cleaned = rawPhone.replace(/[\s\-\(\)\+]/g, '');

  // If starts with 0 (e.g. 0771234567 or 0712345678 or 0112345678)
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.substring(1);
  }

  // If 9 digits without leading 0 (e.g. 771234567)
  if (cleaned.length === 9 && !cleaned.startsWith('94')) {
    cleaned = '94' + cleaned;
  }

  return cleaned;
}

/**
 * Formats a comprehensive, professional WhatsApp text receipt
 */
export function generateWhatsAppReceiptText(
  sale: Sale,
  tenant?: Tenant,
  lang: Language = 'en'
): string {
  const shopName = tenant?.shop_name || 'Retail Store';
  const address = tenant?.address || '';
  const phone = tenant?.phone || '';
  const currency = tenant?.currency_symbol || 'Rs.';

  const isSinhala = lang === 'si';
  const isTamil = lang === 'ta';

  const title = isSinhala
    ? '🧾 *විකුණුම් ඉන්වොයිසිය / බිල්පත*'
    : isTamil
    ? '🧾 *விற்பனை ரசீது / INVOICE*'
    : '🧾 *SALES INVOICE / RECEIPT*';

  const dateStr = new Date(sale.created_at).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const divider = '━━━━━━━━━━━━━━━━━━━━━━';

  const invNo = sale.invoice_no || (sale as any).invoice_number || 'INV';
  const grandTotal = sale.grand_total ?? (sale as any).total_amount ?? 0;
  const paidVal = sale.paid_amount ?? (sale as any).amount_paid ?? grandTotal;
  const changeVal = sale.change_amount ?? 0;
  const balanceVal = sale.balance_due ?? 0;

  let text = `🏪 *${shopName.toUpperCase()}*\n`;
  if (address) text += `📍 ${address}\n`;
  if (phone) text += `📞 ${phone}\n`;
  text += `${divider}\n`;
  text += `${title}\n`;
  text += `*Bill No / ඉන්වොයිස්:* #${invNo}\n`;
  text += `*Date / දිනය:* ${dateStr}\n`;
  text += `*Cashier / කැෂියර්:* ${sale.cashier_name || 'Counter'}\n`;
  if (sale.sales_associate_name) {
    const assocCodePrefix = sale.sales_associate_code ? `[${sale.sales_associate_code}] ` : '';
    const assocDesig = sale.sales_associate_designation ? ` (${sale.sales_associate_designation})` : '';
    text += `*${isSinhala ? 'විකුණුම් නියෝජිත (Associate)' : isTamil ? 'விற்பனை பிரதிநிதி' : 'Sales Associate'}:* ${assocCodePrefix}${sale.sales_associate_name}${assocDesig}\n`;
  }
  if (sale.customer_name && sale.customer_name !== 'Walk-in Customer') {
    text += `*Customer / ගනුදෙනුකරු:* ${sale.customer_name}${sale.customer_phone ? ` (${sale.customer_phone})` : ''}\n`;
  }
  text += `${divider}\n`;
  text += `📦 *${isSinhala ? 'භාණ්ඩ විස්තරය (ITEMS)' : isTamil ? 'பொருட்கள் (ITEMS)' : 'ITEMS / DESCRIPTION'}:*\n\n`;

  (sale.items || []).forEach((item, index) => {
    const itemName = item.name || (item as any).product_name || 'Item';
    const unitPrice = (item.unit_price || 0).toFixed(2);
    const itemTotal = (item.total ?? (item as any).total_price ?? (item.unit_price * item.quantity)).toFixed(2);
    text += `${index + 1}. *${itemName}*\n`;
    text += `   ${item.quantity} ${item.unit || 'pcs'} × ${currency} ${unitPrice} = *${currency} ${itemTotal}*\n`;
  });

  text += `\n${divider}\n`;
  text += `*Subtotal / උප එකතුව:* ${currency} ${(sale.subtotal || grandTotal).toFixed(2)}\n`;

  if (sale.discount_amount && sale.discount_amount > 0) {
    text += `*Discount / වට්ටම්:* -${currency} ${sale.discount_amount.toFixed(2)}\n`;
  }

  if (sale.tax_amount && sale.tax_amount > 0) {
    text += `*Tax / VAT:* +${currency} ${sale.tax_amount.toFixed(2)}\n`;
  }

  text += `*TOTAL / මුළු එකතුව:* *${currency} ${grandTotal.toFixed(2)}*\n`;
  const loyaltyRedeemed = (sale as any).loyalty_points_redeemed || 0;
  const loyaltyEarned = (sale as any).loyalty_points_earned || 0;
  const custPointsBal = (sale as any).customer_loyalty_balance;
  const netAfterLoyalty = Math.max(0, grandTotal - loyaltyRedeemed);

  if (loyaltyRedeemed > 0) {
    text += `*(-) Loyalty Points / ලෝයල්ටි:* -${currency} ${loyaltyRedeemed.toFixed(2)} (${loyaltyRedeemed} pts)\n`;
    text += `*(=) BALANCE (Total - Loyalty):* *${currency} ${netAfterLoyalty.toFixed(2)}*\n`;
  }
  if (loyaltyEarned > 0) {
    text += `*⭐ Points Earned / ලත් ලකුණු:* +${loyaltyEarned.toLocaleString()} pts\n`;
  }
  if (custPointsBal !== undefined) {
    text += `*Customer Points Balance:* ${custPointsBal.toLocaleString()} pts\n`;
  }
  text += `${divider}\n`;

  text += `*Payment / ගෙවීම් ක්‍රමය:* ${sale.payment_method}\n`;
  if (paidVal > 0) {
    text += `*Paid Amount / ලැබුණු මුදල:* ${currency} ${paidVal.toFixed(2)}\n`;
  }
  if (changeVal > 0) {
    text += `*Change / ඉතිරි මුදල:* ${currency} ${changeVal.toFixed(2)}\n`;
  }

  if (sale.payment_method === 'CREDIT' || balanceVal > 0) {
    text += `*Due Balance / මුළු ණය ශේෂය:* ${currency} ${balanceVal.toFixed(2)}\n`;
  }

  text += `${divider}\n`;
  text += `🙏 *${isSinhala ? 'අප සමඟ ගනුදෙනු කළ ඔබට ස්තුතියි! නැවත එන්න.' : isTamil ? 'எங்களுடன் வணிகம் செய்தமைக்கு நன்றி! மீண்டும் வருக.' : 'Thank you for your business! Please visit again.'}*\n`;

  return text;
}

/**
 * Directly trigger opening WhatsApp Web / App with formatted invoice
 */
export function sendReceiptViaWhatsApp(
  sale: Sale,
  phoneInput: string,
  tenant?: Tenant,
  lang: Language = 'en'
): boolean {
  const phone = formatSriLankanPhoneNumber(phoneInput || sale.customer_phone || '');
  const message = generateWhatsAppReceiptText(sale, tenant, lang);
  const encoded = encodeURIComponent(message);

  let url = '';
  if (phone) {
    url = `https://wa.me/${phone}?text=${encoded}`;
  } else {
    // Open WhatsApp generic share if no phone
    url = `https://api.whatsapp.com/send?text=${encoded}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Open WhatsApp with custom promotional text
 */
export function sharePromotionViaWhatsApp(
  promoMessage: string,
  targetPhone?: string
): void {
  const phone = targetPhone ? formatSriLankanPhoneNumber(targetPhone) : '';
  const encoded = encodeURIComponent(promoMessage);

  let url = '';
  if (phone) {
    url = `https://wa.me/${phone}?text=${encoded}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encoded}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Open Facebook Share Dialog
 */
export function sharePromotionViaFacebook(
  promoUrl: string,
  quoteText?: string
): void {
  const targetUrl = encodeURIComponent(promoUrl || window.location.href);
  const quote = quoteText ? `&quote=${encodeURIComponent(quoteText)}` : '';
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${targetUrl}${quote}`;

  window.open(fbUrl, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
}
