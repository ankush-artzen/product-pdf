// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db/prisma-connect";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { token: string } }
// ) {
//   try {
//     const { token } = params;

//     // 1️⃣ Fetch token
//     const downloadToken = await prisma.downloadToken.findUnique({
//       where: { token },
//     });

//     if (!downloadToken) {
//       return NextResponse.json(
//         { error: "Invalid download link" },
//         { status: 404 }
//       );
//     }

//     if (downloadToken.expiresAt < new Date()) {
//       return NextResponse.json(
//         { error: "Download link expired" },
//         { status: 410 }
//       );
//     }

//     if (downloadToken.used) {
//       return NextResponse.json(
//         { error: "Download link already used" },
//         { status: 410 }
//       );
//     }

//     // 2️⃣ Find PDF using stored pdfId
//     const productPDF = await prisma.productPDF.findFirst({
//       where: {
//         pdfs: {
//           some: { id: downloadToken.pdfId },
//         },
//       },
//     });

//     if (!productPDF) {
//       return NextResponse.json(
//         { error: "PDF not found" },
//         { status: 404 }
//       );
//     }

//     const pdf = productPDF.pdfs.find(
//       (p) => p.id === downloadToken.pdfId
//     );

//     if (!pdf || !pdf.url) {
//       return NextResponse.json(
//         { error: "Invalid PDF" },
//         { status: 404 }
//       );
//     }

//     // 3️⃣ Mark token as used
//     await prisma.downloadToken.update({
//       where: { id: downloadToken.id },
//       data: {
//         used: true,
//         usedAt: new Date(),
//       },
//     });

//     // 4️⃣ Redirect to file
//     return NextResponse.redirect(pdf.url, { status: 307 });

//   } catch (error) {
//     console.error("Download error:", error);
//     return NextResponse.json(
//       { error: "Download failed" },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  

// ✅ Preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // 1️⃣ Fetch token
    const downloadToken = await prisma.downloadToken.findUnique({
      where: { token },
    });

    if (!downloadToken) {
      return NextResponse.json(
        { error: "Invalid download link" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (downloadToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Download link expired" },
        { status: 410, headers: corsHeaders }
      );
    }

    if (downloadToken.usedCount >= downloadToken.maxUses) {
      return NextResponse.json(
        { error: "Download limit reached" },
        { status: 410, headers: corsHeaders }
      );
    }

    // 2️⃣ Find PDF using stored pdfId
    const productPDF = await prisma.productPDF.findFirst({
      where: {
        pdfs: {
          some: { id: downloadToken.pdfId },
        },
      },
    });

    if (!productPDF) {
      return NextResponse.json(
        { error: "PDF not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const pdf = productPDF.pdfs.find((p) => p.id === downloadToken.pdfId);

    if (!pdf || !pdf.url) {
      return NextResponse.json(
        { error: "Invalid PDF" },
        { status: 404, headers: corsHeaders }
      );
    }

    // 3️⃣ Increment usage counter (NOT single-use anymore)
    await prisma.downloadToken.update({
      where: { id: downloadToken.id },
      data: {
        usedCount: { increment: 1 },
      },
    });

    // 4️⃣ Redirect to file
    return NextResponse.redirect(pdf.url, {
      status: 307,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
