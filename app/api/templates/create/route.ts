import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

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
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("GET /templates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// CREATE new template
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

    const created = await prisma.template.create({
      data: { shop, language, subject, template },
    });

    return NextResponse.json(
      {
        status: true,
        message: "Template created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /templates error:", error);
    return NextResponse.json({ status: false, message: "Server error" }, { status: 500 });
  }
}
