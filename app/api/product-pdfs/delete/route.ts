import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
  try {
    const { shop, productId, pdfId } = await req.json();

    if (!shop || !productId || !pdfId) {
      return NextResponse.json(
        { success: false, message: "Missing shop, productId or pdfId" },
        { status: 400 }
      );
    }

    /* 1️⃣ Fetch product record */
    const product = await prisma.productPDF.findFirst({
      where: { productId, shop },
    });

    if (!product || !Array.isArray(product.pdfs)) {
      return NextResponse.json(
        { success: false, message: "Product PDFs not found" },
        { status: 404 }
      );
    }

    /* 2️⃣ Find PDF to delete */
    const pdfToDelete = product.pdfs.find((p: any) => p.id === pdfId);

    if (!pdfToDelete) {
      return NextResponse.json(
        { success: false, message: "PDF not found" },
        { status: 404 }
      );
    }

    /* 3️⃣ Delete from Supabase storage */
    if (pdfToDelete.path) {
      const { error } = await supabase.storage
        .from("product_pdfs")
        .remove([pdfToDelete.path]);

      if (error) {
        console.error("Supabase delete error:", error);
        return NextResponse.json(
          { success: false, message: "Failed to delete file from storage" },
          { status: 500 }
        );
      }
    }

    /* 4️⃣ Remove PDF from DB array */
    const updatedPdfs = product.pdfs.filter((p: any) => p.id !== pdfId);
    const variantsArray = Array.isArray(product.variants)
      ? product.variants
      : [];

    /* 5️⃣ Update variants hasPdf flag */
    const updatedVariants = variantsArray.map((variant: any) => {
      const hasPdf = updatedPdfs.some(
        (pdf: any) => pdf.variantId === variant.variantId
      );

      return {
        ...variant,
        hasPdf,
      };
    });

    /* 6️⃣ Save updated product */
    const updatedProduct = await prisma.productPDF.update({
      where: { id: product.id },
      data: {
        pdfs: updatedPdfs,
        variants: updatedVariants,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "PDF deleted successfully",
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error("Delete PDF error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
