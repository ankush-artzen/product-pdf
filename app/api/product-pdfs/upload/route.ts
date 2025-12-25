import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { createClient } from "@supabase/supabase-js";
import { ObjectId } from "mongodb";

const FALLBACK_IMAGE =
  "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const shop = formData.get("shop") as string;

    const productId = formData.get("productId") as string;
    const productTitle = (formData.get("productTitle") as string) || "Untitled Product";
    const productImage = (formData.get("productImage") as string) || FALLBACK_IMAGE;
    const variantDataRaw = formData.get("variantData") as string;
    const allVariantsRaw = formData.get("allVariants") as string; // NEW: Get all variants
    const files = formData.getAll("pdfs") as File[];

    if (!productId || files.length === 0 || !variantDataRaw) {
      return NextResponse.json(
        { success: false, message: "Missing product, variant info or files" },
        { status: 400 }
      );
    }

    const variantData = JSON.parse(variantDataRaw);
    const allVariants = allVariantsRaw ? JSON.parse(allVariantsRaw) : [];
    const productPrice = variantData[0]?.variantPrice || "0.00";

    const newPdfs: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const variant = variantData[i];

      if (!variant || !file) continue;
      if (file.type !== "application/pdf") continue;

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const cleanProductId = productId.replace(/[^a-zA-Z0-9]/g, "_");
      const path = `product_${cleanProductId}/${Date.now()}_${sanitizedName}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await supabase.storage
        .from("product_pdfs")
        .upload(path, buffer, { contentType: file.type });

      if (uploadRes.error) {
        console.error("Supabase upload error:", uploadRes.error);
        continue;
      }

      const publicUrl = supabase.storage.from("product_pdfs").getPublicUrl(path)
        .data.publicUrl;
        const formattedPdfName = `${productTitle} - ${variant.variantTitle} `;

        newPdfs.push({
          id: new ObjectId().toString(),
          name: formattedPdfName,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          url: publicUrl,
          uploadedAt: new Date(),
          path,
          variantId: variant.variantId,
          variantTitle: variant.variantTitle,
          variantPrice: variant.variantPrice || "",
        });
      }
    //   newPdfs.push({
    //     id: new ObjectId().toString(),
    //     name: file.name,
    //     size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    //     url: publicUrl,
    //     uploadedAt: new Date(),
    //     path,
    //     variantId: variant.variantId,
    //     variantTitle: variant.variantTitle,
    //     variantPrice: variant.variantPrice || "",
    //   });
    // }

    if (newPdfs.length === 0) {
      return NextResponse.json(
        { success: false, message: "No PDF files were successfully uploaded" },
        { status: 400 }
      );
    }

    // const existing = await prisma.productPDF.findUnique({
    //   where: { productId },
    // });
    const existing = await prisma.productPDF.findFirst({
      where: {
        productId,
        shop,
      },
    });
    // Handle PDFs to replace (from edit context)
    const pdfsToReplaceRaw = formData.get("pdfsToReplace") as string;
    const pdfsToReplace = pdfsToReplaceRaw ? JSON.parse(pdfsToReplaceRaw) : [];
    const replacePdfIds = new Set(pdfsToReplace.map((p: any) => p.id || p.pdfId));

    // Filter out PDFs that are being replaced
    let existingPdfsFiltered = existing && Array.isArray(existing.pdfs) 
      ? existing.pdfs.filter((p: any) => !replacePdfIds.has(p.id))
      : [];

    // Check for duplicates (excluding PDFs being replaced)
    if (existingPdfsFiltered.length > 0) {
      for (let newPdf of newPdfs) {
        const duplicate = existingPdfsFiltered.find(
          (p: any) => p.variantId === newPdf.variantId
        );
        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              exists: true,
              message: `PDF already exists for variant "${newPdf.variantTitle}". Remove the old PDF before uploading a new one.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Delete old PDF files from storage if replacing
    if (pdfsToReplace.length > 0) {
      for (const pdfToDelete of pdfsToReplace) {
        if (pdfToDelete.path) {
          try {
            await supabase.storage.from("product_pdfs").remove([pdfToDelete.path]);
          } catch (err) {
            console.error("Error deleting old PDF from storage:", err);
          }
        }
      }
    }

    // Append NEW PDFs to filtered existing PDFs
    const finalPdfList = [...existingPdfsFiltered, ...newPdfs];

    // Prepare variants data - store ALL variants (with and without PDFs)
    const variantsData = allVariants.map((variant: any) => {
      // Check if this variant has a PDF
      const hasPdf = finalPdfList.some((pdf: any) => pdf.variantId === variant.value);
      
      return {
        variantId: variant.value,
        variantTitle: variant.label,
        variantPrice: variant.price || "",
        hasPdf, // Flag to indicate if PDF is assigned
        // You can add more variant properties here
      };
    });

    const result = await prisma.productPDF.upsert({
      where: { productId },
      update: {
        shop, 
        productTitle,
        productImage,
        productPrice,
        pdfs: finalPdfList,
        variants: variantsData,
        updatedAt: new Date(),
      },
      create: {
        productId,
        shop, 
        productTitle,
        productImage,
        productPrice,
        pdfs: finalPdfList,
        variants: variantsData,
      },
    });
    

    return NextResponse.json({
      success: true,
      message: "PDF(s) uploaded successfully",
      data: result,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}