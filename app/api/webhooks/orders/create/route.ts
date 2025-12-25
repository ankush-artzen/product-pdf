import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_LANGUAGES = [
  "Français",
  "Anglais",
  "Espagnol",
  "Deutsch",
  "Italiano",
  "日本語",
];

async function getBestTemplate(shop: string, lineItems: any[]) {
  const variantTitles = lineItems
    .map((item: any) => item.variant_title)
    .filter(Boolean);

  if (variantTitles.length > 0) {
    const languageCount: Record<string, number> = {};
    variantTitles.forEach((lang: string) => {
      languageCount[lang] = (languageCount[lang] || 0) + 1;
    });

    const sortedLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    // Try each language in order until we find a template
    for (const lang of sortedLanguages) {
      if (SUPPORTED_LANGUAGES.includes(lang)) {
        const template = await prisma.template.findUnique({
          where: {
            shop_language: {
              shop,
              language: lang,
            },
          },
        });
        if (template) {
          console.log(`📧 Found template for language: ${lang}`);
          return template;
        }
      }
    }
  }

  // Fallback 1: Try Anglais (default)
  const anglaisTemplate = await prisma.template.findUnique({
    where: {
      shop_language: {
        shop,
        language: "Anglais",
      },
    },
  });
  if (anglaisTemplate) {
    console.log("📧 Using Anglais template (fallback 1)");
    return anglaisTemplate;
  }

  // Fallback 2: Try any template for the shop
  const anyTemplate = await prisma.template.findFirst({
    where: { shop },
  });
  if (anyTemplate) {
    console.log(`📧 Using any available template: ${anyTemplate.language}`);
    return anyTemplate;
  }

  // No template found
  return null;
}

export async function POST(req: NextRequest) {
  console.log("📦 Orders webhook hit:", new Date().toISOString());

  try {
    const rawShop =
      req.headers.get("x-shopify-shop-domain") ||
      new URL(req.url).searchParams.get("shop");

    if (!rawShop) throw new Error("Missing shop");

    const shop = rawShop.replace(/^https?:\/\//, "");

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const orderId = body.id?.toString();
    const orderName = body.name;
    const customerEmail =
      body.contact_email ||
      body.customer?.email ||
      body.email ||
      body.billing_address?.email ||
      "customer";

    console.log("orderId", orderId);
    console.log("customerEmail", customerEmail);

    const customerName =
      `${body.customer?.first_name || ""} ${body.customer?.last_name || ""}`.trim() ||
      "Customer";
    const currency = body.currency || body.presentment_currency || "USD";

    // Check if order already exists
    let order = await prisma.order.findFirst({
      where: {
        shop,
        orderId,
      },
    });

    // Create or update order
    const orderData = {
      shop,
      orderId,
      orderName,
      customerEmail,
      customerName,
      currency,
      Amount: parseFloat(body.total_price || body.current_total_price || "0"),
      variantId: body.line_items[0]?.variant_id?.toString(),
      emailSent: false,
    };

    if (order) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: orderData,
      });
    } else {
      order = await prisma.order.create({
        data: orderData,
      });
    }

    // If email already sent, skip
    if (order.emailSent) {
      console.log("ℹ️ Email already sent for order:", orderId);
      return NextResponse.json({
        success: true,
        message: "Email already sent",
      });
    }

    // Get all product PDFs for this order
    const productIds: string[] = Array.from(
      new Set(
        body.line_items
          .map((li: any) => {
            if (li.product_id) {
              return `gid://shopify/Product/${li.product_id}`;
            }
            return null;
          })
          .filter((id: string | null): id is string => id !== null)
      )
    );

    console.log("productIds---------------", productIds);

    const productPDFs = await prisma.productPDF.findMany({
      where: {
        shop,
        productId: { in: productIds },
      },
    });
    console.log(`Found ${productPDFs.length} product PDF records`);

    if (productPDFs.length === 0) {
      console.log("⚠️ No PDFs found for products in order");
      return NextResponse.json({ success: true });
    }

    // Store tokens for download links in database
    const downloadTokens: Array<{
      token: string;
      pdfId: string;
      productTitle: string;
      pdfName: string;
    }> = [];

    // Collect all PDFs for this order
    const allPDFs: Array<{
      name: string;
      url: string;
      productTitle: string;
      variantTitle: string;
      downloadLink: string;
    }> = [];

    for (const item of body.line_items) {
      const productGid = item.product_id
        ? `gid://shopify/Product/${item.product_id}`
        : null;
      const variantId = item.variant_id?.toString();

      // Find PDF by the full GID
      const productPDF = productPDFs.find((p) => p.productId === productGid);
      if (!productPDF) continue;

      console.log("------------------------------------");
      console.log("🧾 Processing line item:", {
        title: item.title,
        product_id: item.product_id,
        variant_id: item.variant_id,
        variant_title: item.variant_title,
      });

      const normalizeVariantId = (id?: string) => {
        if (!id) return null;
        return id.includes("gid://") ? id.split("/").pop() : id;
      };

      const variantPDFs = productPDF.pdfs.filter((pdf) => {
        if (!pdf.variantId || pdf.variantId === "all") return true;

        return (
          normalizeVariantId(pdf.variantId) ===
          normalizeVariantId(item.variant_id?.toString())
        );
      });

      variantPDFs.forEach((pdf) => {
        const token = crypto.randomBytes(32).toString("hex");
        const downloadLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/download/${token}`;

        // Store token in array for database
        downloadTokens.push({
          token,
          pdfId: pdf.id,
          productTitle: productPDF.productTitle,
          pdfName: pdf.name,
        });

        allPDFs.push({
          name: pdf.name,
          url: pdf.url,
          productTitle: productPDF.productTitle,
          variantTitle: item.variant_title || pdf.variantTitle || "Default",
          downloadLink,
        });
      });
    }

    if (allPDFs.length === 0) {
      console.log("⚠️ No PDFs matched for variants in order");
      return NextResponse.json({ success: true });
    }

    // Store download tokens in database
    for (const tokenData of downloadTokens) {
      await prisma.downloadToken.create({
        data: {
          token: tokenData.token,
          pdfId: tokenData.pdfId,
          orderId: order.id,
          productTitle: tokenData.productTitle,
          pdfName: tokenData.pdfName,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }

    // Get email template - use smart selection
    const template = await getBestTemplate(shop, body.line_items);
    console.log("template-----------", template);

    // Generate PDF links HTML
    const pdfLinksHTML = allPDFs
      .map(
        (pdf, index) => `
      <div style="margin-bottom: 20px; padding: 18px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); 
                  border: 1px solid #e2e8f0; border-radius: 10px; border-left: 5px solid #007bff;
                  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.08); transition: transform 0.2s ease, box-shadow 0.2s ease;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="display: inline-flex; align-items: center; justify-content: center; 
                           width: 24px; height: 24px; background: #007bff; color: white; 
                           border-radius: 50%; font-size: 12px; font-weight: 600;">
                ${index + 1}
              </span>
              <h4 style="margin: 0; color: #1a202c; font-size: 16px; font-weight: 600;">
                ${pdf.productTitle}
                ${pdf.variantTitle !== "Default" ? `<span style="color: #4a5568; font-weight: 500;">(${pdf.variantTitle})</span>` : ""}
              </h4>
            </div>
            <p style="margin: 0 0 12px 0; color: #718096; font-size: 14px; padding-left: 32px;">
              📄 <strong style="color: #2d3748;">${pdf.name}</strong>
            </p>
          </div>
        </div>
        <div style="padding-left: 32px;">
          <a href="${pdf.downloadLink}" 
             style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; 
                    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; 
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;
                    border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(0, 123, 255, 0.25);">
             Download PDF
          </a>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 8px;">
            <span style="font-size: 12px; color: #a0aec0;">
              ⏳ This link expires in <strong style="color: #e53e3e;">30 days</strong>
            </span>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Generate product list HTML
    const productListHTML = body.line_items
      .map(
        (li: any) => `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; 
                padding: 16px 0; border-bottom: 1px solid #f1f5f9;">
      <div style="flex: 1;">
        <p style="margin: 0 0 4px 0; color: #1e293b; font-size: 15px; font-weight: 500; line-height: 1.4;">
          ${li.title}
        </p>
        ${
          li.variant_title
            ? `
          <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.3;">
            ${li.variant_title}
          </p>
        `
            : ""
        }
      </div>
      <div style="text-align: right; min-width: 120px;">
        <p style="margin: 0 0 4px 0; color: #475569; font-size: 13px; font-weight: 500;">
          ${li.quantity} × ${currency}${parseFloat(li.price).toFixed(2)}
        </p>
        <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 600;">
          ${currency}${(parseFloat(li.price) * li.quantity).toFixed(2)}
        </p>
      </div>
    </div>`
      )
      .join("");

    const shopName = shop.replace(".myshopify.com", "");
    const defaultSubject = `Your PDF is ready from ${shopName}!`;

    let emailSubject = defaultSubject;
    let emailHTML: string;

    // If template exists, use it with variable replacement
    if (template) {
      // Replace variables in subject
      emailSubject = template.subject?.trim()
        ? template.subject
            .replace(/{{\s*SHOP\s*}}/g, shopName)
            .replace(/{{\s*customer_name\s*}}/g, customerName)
            .replace(/{{\s*order_name\s*}}/g, orderName)
            .replace(/{{\s*order_id\s*}}/g, orderId)
            .replace(
              /{{\s*total_amount\s*}}/g,
              `${currency} ${parseFloat(body.total_price || "0").toFixed(2)}`
            )
            .replace(/{{\s*pdf_count\s*}}/g, allPDFs.length.toString())
        : defaultSubject;

      // Replace variables in template HTML and insert PDF links
      emailHTML = template.template
        .replace(/{{\s*SHOP\s*}}/g, shopName)
        .replace(/{{\s*customer_name\s*}}/g, customerName)
        .replace(/{{\s*order_name\s*}}/g, orderName)
        .replace(/{{\s*order_id\s*}}/g, orderId)
        .replace(
          /{{\s*total_amount\s*}}/g,
          `${currency} ${parseFloat(body.total_price || "0").toFixed(2)}`
        )
        .replace(/{{\s*pdf_count\s*}}/g, allPDFs.length.toString())
        .replace(/{{\s*pdf_links\s*}}/g, pdfLinksHTML);
    } else {
      // Use default HTML template if no template found
      console.log("📧 No template found, using default email template");
      emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; color: #334155; line-height: 1.5;">
  
  <!-- Main Container -->
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 16px; padding: 32px 24px; text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); border-radius: 50%; margin-bottom: 20px;">
        <span style="font-size: 28px; color: white;">✓</span>
      </div>
      <h1 style="margin: 0 0 8px 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.01em;">
        Thank You, ${customerName}!
      </h1>
      <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">
        Order <strong>${orderName}</strong> has been confirmed
      </p>
    </div>
    
    <!-- Order Summary Card -->
    <div style="background: white; border-radius: 12px; padding: 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; overflow: hidden;">
      <div style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 24px; height: 24px; border-radius: 6px; background: #6366f1; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 14px;"></span>
          </div>
          <h2 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600;">
            Order Summary
          </h2>
        </div>
      </div>
      
      <div style="padding: 8px 24px;">
        ${productListHTML}
      </div>
      
      <!-- Total -->
      <div style="padding: 20px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #475569; font-size: 15px; font-weight: 500;">Total Amount</span>
          <div style="text-align: right;">
            <p style="margin: 0; margin-left: 12px; margin-right: 12px; color: #0f172a; font-size: 18px; font-weight: 600; line-height: 1.4;">
              ${currency} ${parseFloat(body.total_price || body.current_total_price || "0").toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- PDF Downloads Card -->
    <div style="background: white; border-radius: 12px; padding: 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; overflow: hidden;">
      <div style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 24px; height: 24px; border-radius: 6px; background: #10b981; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 14px;">📄</span>
            </div>
            <h2 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600;">
              Your Downloads
            </h2>
          </div>
          <span style="background: #dcfce7; color: #059669; padding: 4px 12px; border-radius: 16px; font-size: 13px; font-weight: 600;">
            ${allPDFs.length} file${allPDFs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div style="padding: 20px 24px;">
        ${pdfLinksHTML}
      </div>
    </div>
    
    <!-- Information Section -->
    <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 20px;">
        <div>
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Shop
          </p>
          <p style="margin: 0; color: #1e293b; font-weight: 600; font-size: 15px;">
            ${shopName}
          </p>
        </div>
        <div>
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Order ID
          </p>
          <p style="margin: 0; color: #1e293b; font-weight: 600; font-size: 15px;">
            ${orderId}
          </p>
        </div>
      </div>
      
      <!-- Important Notice -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 16px; margin-top: 20px; border-left: 4px solid #f59e0b;">
        <div style="display: flex; gap: 12px;">
          <div style="flex-shrink: 0; width: 20px; height: 20px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 12px; font-weight: bold;">!</span>
          </div>
          <div>
            <p style="margin: 0 0 6px 0; color: #92400e; font-size: 14px; font-weight: 600;">
              Important Information
            </p>
            <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.4;">
              • Download links expire in <strong>30 days</strong><br>
              • Save files to a secure location<br>
              • Contact support for assistance
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;">
        © ${new Date().getFullYear()} ${shopName}
      </p>
      <p style="margin: 0; color: #cbd5e1; font-size: 12px;">
        This is an automated email. Please do not reply.
      </p>
    </div>
    
  </div>
  
</body>
</html>`;
    }

    await resend.emails.send({
      from: `Products <${process.env.EMAIL_FROM || "downloads@" + shop}>`,
      to: customerEmail,
      subject: emailSubject,
      html: emailHTML,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        emailSent: true,
        sentAt: new Date(),
      },
    });

    console.log("✅ Email sent successfully for order:", orderId);
    console.log("📎 PDFs included as download links:", allPDFs.length);
    console.log("📎 Download tokens created:", downloadTokens.length);

    return NextResponse.json({
      success: true,
      message: "Email sent with PDF download links",
      pdfCount: allPDFs.length,
      templateUsed: template ? template.language : "default",
    });
  } catch (error: any) {
    console.error("❌ Order webhook failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Webhook error",
      },
      { status: 500 }
    );
  }
}
