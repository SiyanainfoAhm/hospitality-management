import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requirePermission, setDbRequestContext } from "@/lib/auth/permissions-server";

async function resolveCategoryId(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  categoryName: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("hotel_management_fnb_categories")
    .select("id")
    .eq("name", categoryName)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("hotel_management_fnb_categories")
    .insert({ name: categoryName, sort_order: 99 })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}

export async function GET() {
  const sessionOrDeny = await requirePermission("settings", "view");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;
  await setDbRequestContext(sessionOrDeny.sub, sessionOrDeny.role);

  const supabase = createServerSupabaseClient();

  const [{ data: categories, error: catErr }, { data: items, error: itemsErr }] =
    await Promise.all([
      supabase
        .from("hotel_management_fnb_categories")
        .select("id, name, sort_order")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("hotel_management_fnb_items")
        .select(`
          id,
          name,
          description,
          price,
          is_veg,
          is_available,
          category_id,
          hotel_management_fnb_categories!category_id ( id, name )
        `)
        .order("name"),
    ]);

  if (catErr || itemsErr) {
    return NextResponse.json(
      { error: catErr?.message || itemsErr?.message },
      { status: 500 }
    );
  }

  const formatted = (items ?? []).map((item: Record<string, unknown>) => {
    const cat = item.hotel_management_fnb_categories as { id?: string; name?: string } | null;
    return {
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: Number(item.price),
      category: cat?.name ?? "Other",
      category_id: item.category_id,
      veg: item.is_veg,
      available: item.is_available,
    };
  });

  return NextResponse.json({
    items: formatted,
    categories: (categories ?? []).map((c) => c.name),
  });
}

export async function POST(request: NextRequest) {
  const sessionOrDeny = await requirePermission("settings", "update");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;
  await setDbRequestContext(sessionOrDeny.sub, sessionOrDeny.role);

  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const { name, price, category, veg, description } = body as {
    name?: string;
    price?: number;
    category?: string;
    veg?: boolean;
    description?: string;
  };

  if (!name?.trim() || price == null || !category) {
    return NextResponse.json(
      { error: "name, price, and category are required" },
      { status: 400 }
    );
  }

  const categoryId = await resolveCategoryId(supabase, category);
  if (!categoryId) {
    return NextResponse.json({ error: "Failed to resolve category" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("hotel_management_fnb_items")
    .insert({
      name: name.trim(),
      price: Number(price),
      category_id: categoryId,
      is_veg: veg !== false,
      is_available: true,
      description: description?.trim() || null,
    })
    .select(`
      id,
      name,
      description,
      price,
      is_veg,
      is_available,
      hotel_management_fnb_categories!category_id ( name )
    `)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create item" }, { status: 500 });
  }

  const cat = data.hotel_management_fnb_categories as { name?: string } | null;

  return NextResponse.json(
    {
      item: {
        id: data.id,
        name: data.name,
        description: data.description ?? "",
        price: Number(data.price),
        category: cat?.name ?? category,
        veg: data.is_veg,
        available: data.is_available,
      },
    },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const sessionOrDeny = await requirePermission("settings", "update");
  if (sessionOrDeny instanceof NextResponse) return sessionOrDeny;
  await setDbRequestContext(sessionOrDeny.sub, sessionOrDeny.role);

  const supabase = createServerSupabaseClient();
  const body = await request.json();
  const { id, name, price, category, veg, description, available } = body as {
    id?: string;
    name?: string;
    price?: number;
    category?: string;
    veg?: boolean;
    description?: string;
    available?: boolean;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) updates.name = name.trim();
  if (price !== undefined) updates.price = Number(price);
  if (veg !== undefined) updates.is_veg = veg;
  if (description !== undefined) updates.description = description?.trim() || null;
  if (available !== undefined) updates.is_available = available;

  if (category) {
    const categoryId = await resolveCategoryId(supabase, category);
    if (!categoryId) {
      return NextResponse.json({ error: "Failed to resolve category" }, { status: 400 });
    }
    updates.category_id = categoryId;
  }

  const { data, error } = await supabase
    .from("hotel_management_fnb_items")
    .update(updates)
    .eq("id", id)
    .select(`
      id,
      name,
      description,
      price,
      is_veg,
      is_available,
      hotel_management_fnb_categories!category_id ( name )
    `)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update item" }, { status: 500 });
  }

  const cat = data.hotel_management_fnb_categories as { name?: string } | null;

  return NextResponse.json({
    item: {
      id: data.id,
      name: data.name,
      description: data.description ?? "",
      price: Number(data.price),
      category: cat?.name ?? category ?? "Other",
      veg: data.is_veg,
      available: data.is_available,
    },
  });
}
