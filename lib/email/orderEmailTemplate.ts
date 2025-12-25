
interface PDFItem {
    name: string;
    productTitle: string;
    variantTitle: string;
    downloadLink: string;
  }
  
  interface LineItem {
    title: string;
    variant_title?: string;
    quantity: number;
    price: string;
  }
  
  interface OrderEmailParams {
    customerName: string;
    orderName: string;
    orderId: string;
    shop: string;
    currency: string;
    totalAmount: number;
    lineItems: LineItem[];
    pdfs: PDFItem[];
  }
  
  export function buildOrderEmailHTML({
    customerName,
    orderName,
    orderId,
    shop,
    currency,
    totalAmount,
    lineItems,
    pdfs,
  }: OrderEmailParams): string {
    const productListHTML = lineItems
      .map(
        (li) => `
        <li style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0;">
          <span>${li.title} ${li.variant_title ? `(${li.variant_title})` : ""}</span>
          <strong>${li.quantity} × ${currency}${parseFloat(li.price).toFixed(2)}</strong>
        </li>
      `
      )
      .join("");
  
    const pdfLinksHTML = pdfs
      .map(
        (pdf, index) => `
        <div style="margin-bottom:16px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;">
          <strong>${index + 1}. ${pdf.productTitle} ${pdf.variantTitle !== "Default" ? `(${pdf.variantTitle})` : ""}</strong>
          <p style="margin:6px 0;">📄 ${pdf.name}</p>
          <a href="${pdf.downloadLink}" 
             style="display:inline-block;padding:10px 18px;background:#007bff;color:#fff;
                    text-decoration:none;border-radius:6px;">
            Download PDF
          </a>
          <p style="font-size:12px;color:#888;margin-top:6px;">
            Link expires in 30 days
          </p>
        </div>
      `
      )
      .join("");
  
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body style="margin:0;padding:0;background:#f7fafc;font-family:Arial,sans-serif;">
    <div style="max-width:680px;margin:auto;padding:20px;">
      
      <h1 style="text-align:center;color:#007bff;">Thank you, ${customerName}!</h1>
      <p style="text-align:center;">
        Your order <strong>${orderName}</strong> is ready.
      </p>
  
      <div style="background:#fff;padding:20px;border-radius:10px;margin-top:20px;">
        <h2>Order Details</h2>
        <ul style="list-style:none;padding:0;margin:0;">
          ${productListHTML}
        </ul>
  
        <p style="margin-top:15px;font-size:18px;">
          <strong>Total:</strong> ${currency}${totalAmount.toFixed(2)}
        </p>
      </div>
  
      <div style="background:#fff;padding:20px;border-radius:10px;margin-top:20px;">
        <h2>Your Downloads</h2>
        ${pdfLinksHTML}
      </div>
  
      <p style="text-align:center;color:#999;font-size:12px;margin-top:30px;">
        © ${new Date().getFullYear()} ${shop.replace(".myshopify.com", "")}
      </p>
    </div>
  </body>
  </html>
  `;
  }
  