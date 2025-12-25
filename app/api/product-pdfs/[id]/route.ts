import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma-connect';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`Fetching PDF with ID: ${id}`);
    
    // First, find which product contains this PDF
    const allProducts = await prisma.productPDF.findMany();
    
    let foundPdf: any = null;
    let foundProduct: any = null;
    
    // Search through all products to find the PDF
    for (const product of allProducts) {
      if (product.pdfs && Array.isArray(product.pdfs)) {
        const pdf = product.pdfs.find((p: any) => p.id === id);
        if (pdf) {
          foundPdf = pdf;
          foundProduct = product;
          break;
        }
      }
    }
    
    if (!foundPdf || !foundProduct) {
      console.log(`PDF with ID ${id} not found`);
      return NextResponse.json(
        { 
          success: false, 
          error: "PDF not found",
          hint: "The PDF ID might be incorrect or the PDF was deleted"
        },
        { status: 404 }
      );
    }
    
    // Construct the response
    const pdfData = {
      id: foundPdf.id,
      name: foundPdf.name || "Unnamed PDF",
      size: foundPdf.size || "0 MB",
      url: foundPdf.url || "",
      path: foundPdf.path || "",
      uploadedAt: foundPdf.uploadedAt 
        ? new Date(foundPdf.uploadedAt).toISOString()
        : new Date().toISOString(),
      variantId: foundPdf.variantId || "",
      variantTitle: foundPdf.variantTitle || "",
      variantPrice: foundPdf.variantPrice || "",
      productId: foundProduct.productId,
      productTitle: foundProduct.productTitle || "No Title",
      productImage: foundProduct.productImage || "",
      productPrice: foundProduct.productPrice || "0.00"
    };
    
    console.log(`Found PDF: ${pdfData.name}`);
    
    return NextResponse.json({ 
      success: true, 
      pdf: pdfData 
    });
    
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch PDF details',
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}