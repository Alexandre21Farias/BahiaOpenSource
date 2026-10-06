import { useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";

const users = [
  { id: 1, name: "Alexandre" },
  { id: 2, name: "Beatriz" },
  { id: 3, name: "Carlos" },
  { id: 4, name: "Daniela" },
];

export function MentionCombobox() {
  const [query, setQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);

  const filteredPeople =
    query === ""
      ? users
      : users.filter((person) => {
          return person.name.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <div className="relative w-64">
      <Combobox
        value={selectedPerson}
        onChange={setSelectedPerson}
        onClose={() => setQuery("")}
      >
        <div className="relative">
          <ComboboxInput
            aria-label="Buscar usuário"
            displayValue={(person: any) => person?.name}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            placeholder="Mencionar alguém..."
          />
        </div>
        <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border">
          {filteredPeople.map((person) => (
            <ComboboxOption
              key={person.id}
              value={person}
              className="group flex cursor-default select-none items-center gap-2 rounded-md py-2 px-3 data-[focus]:bg-primary/10"
            >
              <div className="text-sm">{person.name}</div>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
