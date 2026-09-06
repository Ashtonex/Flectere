import type { Metadata } from "next";
import ProductHero from "@/components/products/ProductHero";
import ProductArmsSection from "@/components/products/ProductArmsSection";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Products",
  description:
    "The Flectēre portfolio: private sector platforms connected through one command, capital, workflow, billing, CRM, and intelligence layer.",
};

export default function ProductsPage() {
  return (
    <>
      <ProductHero />
      <ProductArmsSection />
      <FinalCTA />
    </>
  );
}
