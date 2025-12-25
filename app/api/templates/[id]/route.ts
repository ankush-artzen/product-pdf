import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

// GET a single template
// export async function GET(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const template = await prisma.template.findUnique({
//       where: { id: params.id },
//     });

//     if (!template) {
//       return NextResponse.json({ error: "Template not found" }, { status: 404 });
//     }

//     return NextResponse.json({ template }, { status: 200 });
//   } catch (error) {
//     console.error("GET /templates/:id error:", error);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }
// GET /templates?shop=xxx&language=Anglais
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const language = searchParams.get("language");

    if (!shop || !language) {
      return NextResponse.json(
        { error: "shop and language are required" },
        { status: 400 }
      );
    }

    const template = await prisma.template.findUnique({
      where: {
        shop_language: { shop, language },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template }, { status: 200 });
  } catch (error) {
    console.error("GET /templates error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// UPDATE template
// PUT /templates?shop=xxx&language=Anglais
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const language = searchParams.get("language");

    if (!shop || !language) {
      return NextResponse.json(
        { error: "shop and language are required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { subject, template } = body;

    const result = await prisma.template.upsert({
      where: {
        shop_language: { shop, language },
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

    return NextResponse.json({
      status: true,
      message: "Template saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("UPSERT /templates error:", error);
    return NextResponse.json(
      { status: false, message: "Server error" },
      { status: 500 }
    );
  }
}


// DELETE template
// DELETE /templates?shop=xxx&language=Anglais
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const language = searchParams.get("language");

    if (!shop || !language) {
      return NextResponse.json(
        { error: "shop and language are required" },
        { status: 400 }
      );
    }

    await prisma.template.delete({
      where: {
        shop_language: { shop, language },
      },
    });

    return NextResponse.json({
      status: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /templates error:", error);
    return NextResponse.json(
      { status: false, message: "Server error" },
      { status: 500 }
    );
  }
}

