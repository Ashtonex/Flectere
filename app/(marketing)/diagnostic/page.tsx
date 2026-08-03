import type { Metadata } from "next";
import DiagnosticTool from "@/components/diagnostic/DiagnosticTool";

export const metadata: Metadata = {
  title: "Diagnostic — Business Flexibility Score",
  description:
    "Answer 8 quick questions and get your Business Flexibility Score — plus your strongest area, weakest area, and a recommended next step.",
};

export default function DiagnosticPage() {
  return <DiagnosticTool />;
}
