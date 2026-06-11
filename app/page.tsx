import { getAllCases, casesToPickerItems } from "@/lib/cases";
import { Header } from "@/components/shell/Header";
import { ContactStrip } from "@/components/shell/ContactStrip";
import { Picker } from "@/components/picker/Picker";

export default function HomePage() {
  const cases = getAllCases();
  const pickerItems = casesToPickerItems(cases);

  return (
    <main className="min-h-screen bg-[var(--color-paper)] flex flex-col px-[var(--space-gutter)]">
      <div className="flex flex-col md:flex-row flex-1 items-start justify-between py-12 gap-8">
        <div className="flex flex-col justify-between h-full gap-8">
          <Header />
          <ContactStrip />
        </div>
        <div className="flex-1 max-w-lg">
          <Picker items={pickerItems} initialSlug="glazd" />
        </div>
      </div>
    </main>
  );
}
