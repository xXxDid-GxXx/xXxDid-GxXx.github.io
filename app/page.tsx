import { getAllCases, casesToPickerItems } from "@/lib/cases";
import { Header } from "@/components/shell/Header";
import { ContactStrip } from "@/components/shell/ContactStrip";
import { HomeStage } from "@/components/shell/HomeStage";

export default function HomePage() {
  const cases = getAllCases();
  const pickerItems = casesToPickerItems(cases);

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[var(--color-bg-dark)]">

      {/* Section 3.6: skip link — first focusable element */}
      <a
        href="#case-list"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-bg)] focus:border focus:border-[var(--color-ink)] focus:rounded"
      >
        Skip to case list
      </a>

      {/* Picker + overlaid header/contact strip, with the slot-machine intro */}
      <HomeStage
        items={pickerItems}
        header={<Header />}
        contactStrip={<ContactStrip />}
      />

      {/* Section 3.6: always-rendered sr-only list — #case-list anchor target */}
      <ol id="case-list" className="sr-only">
        {cases.map((c) => (
          <li key={c.slug}>
            <a href={`/case/${c.slug}`}>{c.title}</a>
          </li>
        ))}
      </ol>

      {/* Section 3.7: no-JS fallback */}
      <noscript>
        <style>{`.picker-section { display: none !important; }`}</style>
        <ol className="no-js-case-list flex flex-col gap-4 py-8 px-[var(--space-gutter)]">
          {cases.map((c) => (
            <li key={c.slug}>
              <a href={`/case/${c.slug}`} className="text-lg font-body underline">
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      </noscript>
    </main>
  );
}
