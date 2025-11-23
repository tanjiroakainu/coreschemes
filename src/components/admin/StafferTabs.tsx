import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Staffer = {
  id: string;
  name: string;
  role: string;
  group: 'scribes' | 'creatives' | 'managerial' | 'executives' | 'clients';
  image?: string; // For image support
};

type StafferTabsProps = {
  staffers: Staffer[];
};

const categories = [
  { key: 'executives', label: 'Executives' },
  { key: 'scribes', label: 'Scribes' },
  { key: 'creatives', label: 'Creatives' },
  { key: 'managerial', label: 'Managerial' },
  { key: 'clients', label: 'Clients' },
];

export default function StafferTabs({ staffers }: StafferTabsProps) {
  return (
    <div className="w-full">
      <Tabs defaultValue="executives" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 sm:gap-4 overflow-x-auto">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.key}
              value={cat.key}
              className="text-sm sm:text-md py-2 sm:py-4 font-semibold rounded border-b-2 border-transparent data-[state=active]:border-amber-200 data-[state=active]:text-amber-200 transition-colors whitespace-nowrap"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.key} value={cat.key}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {staffers
                .filter((s) => s.group === cat.key)
                .map((staffer) => (
                  <div
                    key={staffer.id}
                    className="bg-white p-4 rounded-md shadow hover:shadow-md transition"
                  >
                    {/* 👉 Add image here if available */}
                    {staffer.image && (
                      <img
                        src={staffer.image}
                        alt={staffer.name}
                        className="w-full h-48 object-cover rounded-md mb-4"
                      />
                    )}
                    <h3 className="text-md ">{staffer.name}</h3>
                    <p className="text-gray-600">{staffer.role}</p>
                  </div>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
