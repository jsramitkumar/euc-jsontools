import { CompareWorkspace } from "@/components/compare/compare-workspace";
import { Navbar } from "@/components/layout/navbar";

export default function ComparePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <CompareWorkspace />
      </main>
    </div>
  );
}
