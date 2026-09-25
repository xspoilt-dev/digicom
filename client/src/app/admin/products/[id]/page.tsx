"use client";

import { use } from "react";
import ProductFormFullPage from "@/components/admin/ProductFormFullPage";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <ProductFormFullPage mode="edit" productId={resolvedParams.id} />;
}
