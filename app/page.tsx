type ModuleItem = {
  title: string;
  description: string;
};

const modules: ModuleItem[] = [

  {
    title: "Klijenti",
    description:
      "Karton klijenta, napomene, historija dolazaka, izvoz/uvoz podataka (Excel/PDF), personalizovani podsjetnici i evidencija recenzija.",
  },
  {
    title: "Poruke",
    description:
      "Automatski i personalizovani email podsjetnici (3/2/1 dan), cestitke, promocije i ankete o zadovoljstvu.",
  },
  {
    title: "Cjenovnik",
    description:
      "Usluge sa cijenom, minutazom i bojom; obracun cijena prema definisanom cjenovniku i promocijama.",
  },
  {
    title: "Promocije",
    description:
      "Definisanje trajanja, uslova i usluga u promociji, uz automatski prenos u karton klijenta.",
  },
  {
    title: "Uposlenici",
    description:
      "Dodavanje radnika, rasporedi rada, boja radnika i statistike performansi za bonuse.",
  },
  {
    title: "Stanje robe",
    description:
      "Pregled zaliha po artiklu, orijentacioni alarmi i minimalne kolicine za neometan rad.",
  },
  {
    title: "Narudzbenice",
    description:
      "Generalna i profesionalna narudzbenica sa artiklima, kolicinama i procjenom/realnim troskovima.",
  },
  {
    title: "Izvjestaji",
    description:
      "Poslovna statistika po periodu, klijentima i uposlenicima, ukljucujuci zakazane i otkazane termine.",
  },
  {
    title: "Poslovni profil i pretplata",
    description:
      "Uredjivanje profila salona i jednostavan nastavak pretplate kada model naplate bude aktivan.",
  },
];

const topBarHighlights = [
  "Generalni dnevnik i dnevnik po uposleniku",
  "Dodavanje neogranicenog broja uposlenika",
  "Datum, dan, sat i minut za svaki termin",
  "Timeline zauzetosti i praznih slotova po minutazi usluge",
];

const functionalRequirements = [
  "Rad na desktopu, tabletu i mobitelu",
  "Automatski podsjetnici: email, Viber, WhatsApp, SMS",
  "Integracije: Google Calendar i Maps",
  "Napredni poslovni izvjestaji i pregled zauzetosti",
  "Mogucnost automatskog kreiranja rasporeda",
  "Online rezervacije 24/7 (naknadno)",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Salon App - plan stranice
          </p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">
            Upravljanje terminima i poslovanjem salona
          </h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Stranica je pripremljena prema specifikaciji u `requirements.md`,
            sa fokusom na dnevnik termina, klijente, uposlenike i izvjestavanje.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Gornja linija (dnevnik dana)</h2>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {topBarHighlights.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 rounded-lg bg-indigo-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
                Logo / Naziv
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Ovaj prostor je rezervisan za brending salona.
              </p>
            </div>
            <h2 className="text-lg font-semibold">Navigacija (lijeva strana)</h2>
            <nav className="mt-3 space-y-2 text-sm">
              {modules.map((module) => (
                <div
                  key={module.title}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                >
                  <p className="font-medium">{module.title}</p>
                  <p className="mt-1 text-slate-600">{module.description}</p>
                </div>
              ))}
            </nav>
          </aside>

          <section className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Kljucevi rezervacije</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>
                  Nakon rezervacije salje se potvrda i podsjetnik klijentu na
                  email, sa adresom i kontakt podacima.
                </li>
                <li>
                  Za vise usluga jednog klijenta svaka usluga ide u poseban red
                  radi preglednosti i boja.
                </li>
                <li>
                  Padajuci meniji za uposlenika, napomene, nacin placanja i
                  ostale kolone koje imaju vise opcija.
                </li>
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Privacy i sigurnost</h2>
              <p className="mt-3 text-sm text-slate-700">
                Za pristup iz nepoznate IP adrese uposlenik vidi samo slobodne
                termine za zakazivanje, bez osjetljivih podataka o klijentima i
                poslovanju.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Funkcionalnosti</h2>
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {functionalRequirements.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}