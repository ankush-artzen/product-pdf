import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    console.log("Fetching products with variant IDs and PDF URLs...");

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const productId = searchParams.get("productId") || "";
    const variantId = searchParams.get("variantId") || "";

    const where: any = {};

    if (search) {
      where.productTitle = { contains: search, mode: "insensitive" };
    }

    if (productId) {
      where.productId = productId;
    }

    console.log("Applied filters:", where);

    // Fetch with URL + variantId
    const products = await prisma.productPDF.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        productId: true,
        productTitle: true,
        createdAt: true,
        updatedAt: true,
        pdfs: {
          select: {
            variantId: true,
            url: true,          // ⭐ FIX: include pdf URL
          },
        },
      },
    });

    console.log(`Found ${products.length} products`);

    // Flatten rows
    let rows = products.flatMap((product) =>
      (product.pdfs || []).map((pdf) => ({
        productId: product.productId,
        productTitle: product.productTitle || "No Title",
        pdfUrl: pdf.url || "",           // ⭐ FIX: return correct field name
        variantId: pdf.variantId || "",
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      }))
    );

    // Optional filter by variantId
    if (variantId) {
      rows = rows.filter((row) => row.variantId === variantId);
    }

    console.log(`Extracted ${rows.length} rows after filtering`);

    const allVariantIds = rows.map((row) => row.variantId).filter(Boolean);
    const uniqueVariantIds = Array.from(new Set(allVariantIds));

    return NextResponse.json({
      success: true,
      data: rows,
      meta: {
        totalProducts: products.length,
        totalVariants: rows.length,
        uniqueVariants: uniqueVariantIds.length,
        uniqueVariantIds,
      },
    });

  } catch (error) {
    console.error("Error in GET endpoint:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch variant data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
