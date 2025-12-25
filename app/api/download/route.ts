import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import prisma from "@/lib/db/prisma-connect";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ✅ Preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, pdfId, orderId } = body;

    if (!variantId || !pdfId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        {
          status: 400,
          headers: corsHeaders, // ✅ FIX
        }
      );
    }
    const existing = await prisma.downloadToken.findFirst({
      where: { pdfId, orderId },
    });

    if (existing) {
      return NextResponse.json(
        { success: true, token: existing.token },
        { headers: corsHeaders }
      );
    }

    // 🔐 Generate secure token
    const token = crypto.randomBytes(24).toString("hex");

    // ⏳ Token expiry (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 📦 Create token entry
    await prisma.downloadToken.create({
      data: {
        token,
        pdfId,
        orderId: orderId || "unknown",
        productTitle: "Product Manual",
        pdfName: "manual.pdf",
        maxUses: 10,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        token,
      },
      {
        headers: corsHeaders, // ✅ FIX
      }
    );
  } catch (error) {
    console.error("Create download token error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create token" },
      {
        status: 500,
        headers: corsHeaders, // ✅ FIX
      }
    );
  }
}
