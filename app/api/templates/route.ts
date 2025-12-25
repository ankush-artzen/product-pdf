import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

// GET all templates for a store
// GET all templates for a store
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json({ error: "shop is required" }, { status: 400 });
    }

    const templates = await prisma.template.findMany({
      where: { shop },
      orderBy: { language: "asc" },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("GET /templates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// CREATE or UPDATE template (one per shop + language)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shop, language, subject, template } = body;

    if (!shop || !language || !subject || !template) {
      return NextResponse.json(
        { error: "shop, language, subject, template are required" },
        { status: 400 }
      );
    }

    const result = await prisma.template.upsert({
      where: {
        shop_language: {
          shop,
          language,
        },
      },
      update: {
        subject,
        template,
      },
      create: {
        shop,
        language,
        subject,
        template,
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Template saved successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /templates error:", error);

    // Unique constraint safety (extra protection)
    if (error.code === "P2002") {
      return NextResponse.json(
        { status: false, message: "Template already exists for this language" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { status: false, message: "Server error" },
      { status: 500 }
    );
  }
}
