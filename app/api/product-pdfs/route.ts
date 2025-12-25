import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    console.log("Fetching products from database...");

    const products = await prisma.productPDF.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`Found ${products.length} products`);

    const rows = products.flatMap((product) => {
      if (!product.pdfs || !Array.isArray(product.pdfs)) {
        console.warn(`Product ${product.productId} has no valid pdfs array`);
        return [];
      }

      return product.pdfs.map((pdf: any) => ({
        productId: product.productId,
        productTitle: product.productTitle || "No Title",
        productImage: product.productImage || "",
        productPrice: product.productPrice || "0.00",

        variantId: pdf.variantId || "",
        variantTitle: pdf.variantTitle || "",
        variantPrice: pdf.variantPrice || "",

        pdfId: pdf.id || "",
        pdfName: pdf.name || "Unnamed PDF",
        pdfSize: pdf.size || "0 MB",
        pdfUrl: pdf.url || "",
        uploadedAt: pdf.uploadedAt
          ? new Date(pdf.uploadedAt).toISOString()
          : new Date().toISOString(),
        path: pdf.path || "",

        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      }));
    });

    console.log(`Transformed into ${rows.length} variant rows`);

    return NextResponse.json(
      {
        success: true,

        data: rows,
        meta: {
          totalProducts: products.length,
          totalVariants: rows.length,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in GET endpoint:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch variants",
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Ensure PDF uploadedAt value is always ISO string",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
