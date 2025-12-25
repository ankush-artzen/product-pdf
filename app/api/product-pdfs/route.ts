import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    /* 1️⃣ Params */
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() || "";

    const rawShop =
      req.headers.get("x-shopify-shop-domain") ||
      searchParams.get("shop");

    const shop = rawShop
      ? rawShop.replace(/^https?:\/\//, "")
      : null;

    /* 2️⃣ Dynamic WHERE clause */
    const whereCondition = shop ? { shop } : {};

    /* 3️⃣ Fetch data */
    const products = await prisma.productPDF.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });

    /* 4️⃣ Flatten PDFs */
    let rows = products.flatMap((product) => {
      if (!Array.isArray(product.pdfs)) return [];

      return product.pdfs.map((pdf: any) => ({
        shop: product.shop,

        productId: product.productId,
        productTitle: product.productTitle || "",
        productImage: product.productImage || "",
        productPrice: product.productPrice || "0.00",

        variantId: pdf.variantId || "",
        variantTitle: pdf.variantTitle || "",
        variantPrice: pdf.variantPrice || "",

        pdfId: pdf.id || "",
        pdfName: pdf.name || "",
        pdfUrl: pdf.url || "",
        pdfSize: pdf.size || "0 MB",
        path: pdf.path || "",

        uploadedAt: pdf.uploadedAt
          ? new Date(pdf.uploadedAt).toISOString()
          : new Date().toISOString(),
      }));
    });

    /* 5️⃣ Search filter (safe for both modes) */
    if (search) {
      rows = rows.filter((row) =>
        row.productTitle.toLowerCase().includes(search) ||
        row.variantTitle.toLowerCase().includes(search) ||
        row.pdfName.toLowerCase().includes(search) ||
        row.productId.toLowerCase().includes(search) ||
        row.variantId.toLowerCase().includes(search)
      );
    }

    /* 6️⃣ Response */
    return NextResponse.json(
      {
        success: true,
        data: rows,
        meta: {
          shop: shop ?? "ALL",
          search,
          totalResults: rows.length,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Search error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to search data",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

