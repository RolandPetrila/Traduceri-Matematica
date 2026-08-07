import type { CurriculumCycle } from "../types";

// Liceu (clasele IX-XII) — SUB REFORMĂ CURRICULARĂ ACTIVĂ. Verificat LIVE 2026-08-07
// (rocnee.eu): 175 programe noi „în transparență decizională", intră eșalonat de la
// clasa a IX-a în anul școlar 2026-2027. Skeleton-ul urmează config-ul Roland, dar
// conținutul e marcat `in_reforma` → UI afișează „programă în tranziție, verifică
// alinierea". RE-VERIFICĂ rocnee.eu la orice atingere de conținut. Vezi §4/§8 din plan.

const liceu: CurriculumCycle = {
  id: "liceu",
  nume: "Liceu",
  sursa_url:
    "https://rocnee.eu/index.php/dcee-oriz/curriculum-oriz/programe-scolare-front",
  data_extragere: "2026-08-07",
  in_reforma: true,
  nivele: [
    {
      id: "clasa-9",
      nume: "Clasa a IX-a",
      sursa_cheie: "Clasa_9",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
          in_reforma: true,
        },
        {
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          in_reforma: true,
        },
        {
          id: "informatica",
          nume: "Informatică",
          sursa_nume: "Informatica",
          in_reforma: true,
        },
        {
          id: "limba-engleza",
          nume: "Limba Engleză",
          sursa_nume: "Limba Engleza",
          in_reforma: true,
        },
        {
          id: "fizica",
          nume: "Fizică",
          sursa_nume: "Fizica",
          in_reforma: true,
        },
        {
          id: "chimie",
          nume: "Chimie",
          sursa_nume: "Chimie",
          in_reforma: true,
        },
        {
          id: "biologie",
          nume: "Biologie",
          sursa_nume: "Biologie",
          in_reforma: true,
        },
        {
          id: "istorie",
          nume: "Istorie",
          sursa_nume: "Istorie",
          in_reforma: true,
        },
        {
          id: "geografie",
          nume: "Geografie",
          sursa_nume: "Geografie",
          in_reforma: true,
        },
        {
          id: "logica",
          nume: "Logică și Argumentare",
          sursa_nume: "Logica",
          in_reforma: true,
        },
      ],
    },
    {
      id: "clasa-10",
      nume: "Clasa a X-a",
      sursa_cheie: "Clasa_10",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
          in_reforma: true,
        },
        {
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          in_reforma: true,
        },
        {
          id: "informatica",
          nume: "Informatică",
          sursa_nume: "Informatica",
          in_reforma: true,
        },
        {
          id: "limba-engleza",
          nume: "Limba Engleză",
          sursa_nume: "Limba Engleza",
          in_reforma: true,
        },
        {
          id: "fizica",
          nume: "Fizică",
          sursa_nume: "Fizica",
          in_reforma: true,
        },
        {
          id: "chimie",
          nume: "Chimie",
          sursa_nume: "Chimie",
          in_reforma: true,
        },
        {
          id: "biologie",
          nume: "Biologie",
          sursa_nume: "Biologie",
          in_reforma: true,
        },
        {
          id: "istorie",
          nume: "Istorie",
          sursa_nume: "Istorie",
          in_reforma: true,
        },
        {
          id: "geografie",
          nume: "Geografie",
          sursa_nume: "Geografie",
          in_reforma: true,
        },
        {
          id: "psihologie",
          nume: "Psihologie",
          sursa_nume: "Psihologie",
          in_reforma: true,
        },
      ],
    },
    {
      id: "clasa-11",
      nume: "Clasa a XI-a",
      sursa_cheie: "Clasa_11",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
          in_reforma: true,
        },
        {
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          in_reforma: true,
        },
        {
          id: "informatica",
          nume: "Informatică",
          sursa_nume: "Informatica",
          in_reforma: true,
        },
        {
          id: "limba-engleza",
          nume: "Limba Engleză",
          sursa_nume: "Limba Engleza",
          in_reforma: true,
        },
        {
          id: "fizica",
          nume: "Fizică",
          sursa_nume: "Fizica",
          in_reforma: true,
        },
        {
          id: "chimie",
          nume: "Chimie",
          sursa_nume: "Chimie",
          in_reforma: true,
        },
        {
          id: "biologie",
          nume: "Biologie",
          sursa_nume: "Biologie",
          in_reforma: true,
        },
        {
          id: "istorie",
          nume: "Istorie",
          sursa_nume: "Istorie",
          in_reforma: true,
        },
        {
          id: "geografie",
          nume: "Geografie",
          sursa_nume: "Geografie",
          in_reforma: true,
        },
        {
          id: "economie",
          nume: "Economie",
          sursa_nume: "Economie",
          in_reforma: true,
        },
      ],
    },
    {
      id: "clasa-12",
      nume: "Clasa a XII-a",
      sursa_cheie: "Clasa_12",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
          in_reforma: true,
        },
        {
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          in_reforma: true,
        },
        {
          id: "informatica",
          nume: "Informatică",
          sursa_nume: "Informatica",
          in_reforma: true,
        },
        {
          id: "limba-engleza",
          nume: "Limba Engleză",
          sursa_nume: "Limba Engleza",
          in_reforma: true,
        },
        {
          id: "fizica",
          nume: "Fizică",
          sursa_nume: "Fizica",
          in_reforma: true,
        },
        {
          id: "chimie",
          nume: "Chimie",
          sursa_nume: "Chimie",
          in_reforma: true,
        },
        {
          id: "biologie",
          nume: "Biologie",
          sursa_nume: "Biologie",
          in_reforma: true,
        },
        {
          id: "istorie",
          nume: "Istorie",
          sursa_nume: "Istorie",
          in_reforma: true,
        },
        {
          id: "geografie",
          nume: "Geografie",
          sursa_nume: "Geografie",
          in_reforma: true,
        },
        {
          id: "filosofie",
          nume: "Filosofie",
          sursa_nume: "Filosofie",
          in_reforma: true,
        },
      ],
    },
  ],
};

export default liceu;
