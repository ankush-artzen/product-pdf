import PDFDocument from "pdfkit";
import { pdfText } from "./pdfText";

export async function generateOrderPdf(order: any): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    // Title
    doc.fontSize(20).text(pdfText.title, { align: "center" });
    doc.moveDown();

    // Order info (adjust fields according to your Shopify payload)
    doc.fontSize(12).text(`Order ID: ${order.id}`);
    if (order.name) doc.text(`Order Number: ${order.name}`);
    if (order.customer) {
      doc.text(
        `Customer: ${order.customer.first_name ?? ""} ${
          order.customer.last_name ?? ""
        }`.trim()
      );
      if (order.email) doc.text(`Email: ${order.email}`);
    }

    if (order.total_price && order.currency) {
      doc.text(`Total: ${order.total_price} ${order.currency}`);
    }

    doc.moveDown();
    doc.text("Items:");
    if (order.line_items) {
      order.line_items.forEach((item: any, index: number) => {
        doc.text(`${index + 1}. ${item.name} × ${item.quantity}`);
      });
    }

    doc.moveDown().moveDown();
    doc.text(pdfText.thanks, { align: "center" });

    doc.end();
  });
}
