import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let rawId = searchParams.get("id");

    // If no ?id → return all products
    if (!rawId) {
      const allProducts = await prisma.productPDF.findMany({
        select: {
          id: true,
          productId: true,
          productTitle: true,
          productImage: true,
          productPrice: true,
          variants: true,
          pdfs: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(
        { success: true, products: allProducts },
        { status: 200 }
      );
    }

    // If ?id exists → normalize Shopify GID
    const productId = rawId.includes("gid://")
      ? rawId.split("/").pop()
      : rawId;

    console.log("Incoming ID:", rawId);
    console.log("Normalized productId:", productId);

    const product = await prisma.productPDF.findUnique({
      where: { productId },
      select: {
        id: true,
        productId: true,
        productTitle: true,
        productImage: true,
        productPrice: true,
        variants: true,
        pdfs: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: `Product not found for ID ${productId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product details",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
