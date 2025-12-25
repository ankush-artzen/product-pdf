import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { exists: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.productPDF.findUnique({
      where: { productId },
    });

    if (existing) {
      return NextResponse.json({
        exists: true,
        message: "Product already has PDFs attached",
        product: existing,
      });
    }

    return NextResponse.json({
      exists: false,
      message: "Product not found in database",
    });

  } catch (err: any) {
    return NextResponse.json(
      { exists: false, error: err.message },
      { status: 500 }
    );
  }
}
