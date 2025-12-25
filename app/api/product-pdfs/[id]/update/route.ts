// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db/prisma-connect";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// export async function PUT(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const productPdfId = params.id;
//     const formData = await req.formData();

//     const pdfId = (formData.get("pdfId") as string) || "";
//     const name = (formData.get("name") as string) || "";
//     const variantId = (formData.get("variantId") as string) || "";
//     const variantTitle = (formData.get("variantTitle") as string) || "";
//     const variantPrice = (formData.get("variantPrice") as string) || "";
//     const allVariantsRaw = (formData.get("allVariants") as string) || "[]";
//     const newFile = formData.get("pdf") as File | null;

//     const allVariants = JSON.parse(allVariantsRaw);

//     /* 1️⃣ Load product record */
//     const targetRecord = await prisma.productPDF.findUnique({
//       where: { id: productPdfId },
//     });

//     if (!targetRecord) {
//       return NextResponse.json(
//         { success: false, message: "Product PDF record not found" },
//         { status: 404 }
//       );
//     }

//     const pdfsArray = Array.isArray(targetRecord.pdfs)
//       ? [...targetRecord.pdfs]
//       : [];

//     /* 2️⃣ Detect edit mode */
//     let isEditingExistingPdf = false;
//     let pdfToEditIndex = -1;

//     if (pdfId) {
//       pdfToEditIndex = pdfsArray.findIndex((p) => p.id === pdfId);
//       isEditingExistingPdf = pdfToEditIndex !== -1;
//     }

//     /* 3️⃣ Auto-replace if variant already has PDF */
//     if (!isEditingExistingPdf) {
//       const existingIndex = pdfsArray.findIndex(
//         (p) => p.variantId === variantId
//       );
//       if (existingIndex !== -1) {
//         isEditingExistingPdf = true;
//         pdfToEditIndex = existingIndex;
//       }
//     }

//     /* 4️⃣ HARD RULE — replacement requires file */
//     if (isEditingExistingPdf && !newFile) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "PDF replacement requires uploading a new file",
//         },
//         { status: 400 }
//       );
//     }

//     /* 5️⃣ Upload PDF FIRST */
//     let pdfData: any = {};
//     let newPath = "";

//     if (newFile) {
//       if (newFile.type !== "application/pdf") {
//         return NextResponse.json(
//           { success: false, message: "Only PDF files are allowed" },
//           { status: 400 }
//         );
//       }

//       const buffer = Buffer.from(await newFile.arrayBuffer());
//       const safeName = newFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
//       newPath = `product_${targetRecord.productId}/${Date.now()}_${safeName}`;

//       const upload = await supabase.storage
//         .from("product_pdfs")
//         .upload(newPath, buffer, { contentType: "application/pdf" });

//       if (upload.error) {
//         return NextResponse.json(
//           { success: false, message: "Failed to upload PDF file" },
//           { status: 500 }
//         );
//       }

//       /* delete old file ONLY after upload success */
//       if (isEditingExistingPdf && pdfToEditIndex !== -1) {
//         const oldPdf = pdfsArray[pdfToEditIndex];
//         if (oldPdf?.path) {
//           await supabase.storage.from("product_pdfs").remove([oldPdf.path]);
//         }
//       }

//       const { data } = supabase.storage
//         .from("product_pdfs")
//         .getPublicUrl(newPath);

//       pdfData = {
//         url: data.publicUrl,
//         path: newPath,
//         size: `${(newFile.size / (1024 * 1024)).toFixed(2)} MB`,
//       };
//     }

//     /* 6️⃣ Build PDF object */
//     const pdfObject = {
//       id:
//         isEditingExistingPdf && pdfToEditIndex !== -1
//           ? pdfsArray[pdfToEditIndex].id
//           : Date.now().toString(),
//       name: name || newFile?.name || "Untitled PDF",
//       uploadedAt: new Date(),
//       variantId,
//       variantTitle,
//       variantPrice,
//       ...pdfData,
//     };

//     /* 7️⃣ Update PDF array */
//     const updatedPdfs = [...pdfsArray];
//     if (isEditingExistingPdf && pdfToEditIndex !== -1) {
//       updatedPdfs[pdfToEditIndex] = pdfObject;
//     } else {
//       updatedPdfs.push(pdfObject);
//     }

//     /* 8️⃣ Sync variants */
//     const updatedVariants = allVariants.map((v: any) => ({
//       variantId: v.value,
//       variantTitle: v.label,
//       variantPrice: v.price || "",
//       hasPdf: updatedPdfs.some((p: any) => p.variantId === v.value),
//     }));

//     /* 9️⃣ Save to DB */
//     const updatedRecord = await prisma.productPDF.update({
//       where: { id: productPdfId },
//       data: {
//         pdfs: updatedPdfs,
//         variants: updatedVariants,
//         updatedAt: new Date(),
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       message: isEditingExistingPdf
//         ? "PDF replaced successfully"
//         : "PDF added successfully",
//       data: updatedRecord,
//     });
//   } catch (err: any) {
//     console.error("PUT PDF error:", err);
//     return NextResponse.json(
//       { success: false, message: "Failed to process PDF", error: err.message },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productPdfId = params.id;
    const formData = await req.formData();

    const pdfId = (formData.get("pdfId") as string) || "";
    const name = (formData.get("name") as string) || "";
    const variantId = (formData.get("variantId") as string) || "";
    const variantTitle = (formData.get("variantTitle") as string) || "";
    const variantPrice = (formData.get("variantPrice") as string) || "";
    const allVariantsRaw = (formData.get("allVariants") as string) || "[]";
    const newFile = formData.get("pdf") as File | null;

    const allVariants = JSON.parse(allVariantsRaw);

    /* 1️⃣ Load product record */
    const targetRecord = await prisma.productPDF.findUnique({
      where: { id: productPdfId },
    });

    if (!targetRecord) {
      return NextResponse.json(
        { success: false, message: "Product PDF record not found" },
        { status: 404 }
      );
    }

    const pdfsArray = Array.isArray(targetRecord.pdfs)
      ? [...targetRecord.pdfs]
      : [];

    /* 2️⃣ Detect edit mode */
    let isEditingExistingPdf = false;
    let pdfToEditIndex = -1;

    if (pdfId) {
      pdfToEditIndex = pdfsArray.findIndex((p) => p.id === pdfId);
      isEditingExistingPdf = pdfToEditIndex !== -1;
    }

    /* 3️⃣ Auto-replace if variant already has PDF */
    if (!isEditingExistingPdf) {
      const existingIndex = pdfsArray.findIndex(
        (p) => p.variantId === variantId
      );
      if (existingIndex !== -1) {
        isEditingExistingPdf = true;
        pdfToEditIndex = existingIndex;
      }
    }

    /* 4️⃣ HARD RULE — replacement requires file */
    if (isEditingExistingPdf && !newFile) {
      return NextResponse.json(
        {
          success: false,
          message: "PDF replacement requires uploading a new file",
        },
        { status: 400 }
      );
    }

    /* 5️⃣ Upload PDF FIRST */
    let uploadedData: { url?: string; path?: string; size?: string } = {};

    if (newFile) {
      if (newFile.type !== "application/pdf") {
        return NextResponse.json(
          { success: false, message: "Only PDF files are allowed" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await newFile.arrayBuffer());
      const safeName = newFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const newPath = `product_${targetRecord.productId}/${Date.now()}_${safeName}`;

      const upload = await supabase.storage
        .from("product_pdfs")
        .upload(newPath, buffer, { contentType: "application/pdf" });

      if (upload.error) {
        return NextResponse.json(
          { success: false, message: "Failed to upload PDF file" },
          { status: 500 }
        );
      }

      /* delete old file ONLY after upload success */
      if (isEditingExistingPdf && pdfToEditIndex !== -1) {
        const oldPdf = pdfsArray[pdfToEditIndex];
        if (oldPdf?.path) {
          await supabase.storage.from("product_pdfs").remove([oldPdf.path]);
        }
      }

      const { data } = supabase.storage
        .from("product_pdfs")
        .getPublicUrl(newPath);

      uploadedData = {
        url: data.publicUrl,
        path: newPath,
        size: `${(newFile.size / (1024 * 1024)).toFixed(2)} MB`,
      };
    }

    /* 6️⃣ Preserve old PDF data if editing */
    const previousPdf =
      isEditingExistingPdf && pdfToEditIndex !== -1
        ? pdfsArray[pdfToEditIndex]
        : null;

    /* 7️⃣ Build FINAL PDF object (🔥 FIX) */
    const pdfObject = {
      id: previousPdf?.id || Date.now().toString(),
      name: name || newFile?.name || "Untitled PDF",
      uploadedAt: new Date(),
      variantId,
      variantTitle,
      variantPrice: variantPrice || null,
    
      // 🔒 REQUIRED FIELDS — NEVER UNDEFINED
      size: uploadedData.size ?? previousPdf?.size ?? "0 MB",
      url: uploadedData.url ?? previousPdf?.url ?? "",
      path: uploadedData.path ?? previousPdf?.path ?? "",
    };
    
    /* 8️⃣ Update PDF array */
    const updatedPdfs = [...pdfsArray];
    if (isEditingExistingPdf && pdfToEditIndex !== -1) {
      updatedPdfs[pdfToEditIndex] = pdfObject;
    } else {
      updatedPdfs.push(pdfObject);
    }

    /* 9️⃣ Sync variants */
    const updatedVariants = allVariants.map((v: any) => ({
      variantId: v.value,
      variantTitle: v.label,
      variantPrice: v.price || "",
      hasPdf: updatedPdfs.some((p: any) => p.variantId === v.value),
    }));

    /* 🔟 Save to DB */
    const updatedRecord = await prisma.productPDF.update({
      where: { id: productPdfId },
      data: {
        pdfs: updatedPdfs,
        variants: updatedVariants,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: isEditingExistingPdf
        ? "PDF replaced successfully"
        : "PDF added successfully",
      data: updatedRecord,
    });
  } catch (err: any) {
    console.error("PUT PDF error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to process PDF", error: err.message },
      { status: 500 }
    );
  }
}
