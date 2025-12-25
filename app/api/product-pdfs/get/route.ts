// api/product-pdfs/variants/get/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Missing productId" },
        { status: 400 }
      );
    }

    const product = await prisma.productPDF.findUnique({
      where: { productId },
      select: {
        productId: true,
        productTitle: true,
        productImage: true,
        productPrice: true,
        pdfs: true,
        variants: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pdfs: product.pdfs || [],
        variants: product.variants || [],
        product,
      },
    });

  } catch (err) {
    console.error("❌ Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch PDFs",  },
      { status: 500 }
    );
  }
}
