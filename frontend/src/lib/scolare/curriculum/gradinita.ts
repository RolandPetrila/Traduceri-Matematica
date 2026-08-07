import type { CurriculumCycle } from "../types";

// Grădiniță — „domenii de dezvoltare" (NU materii): Curriculum pentru educația
// timpurie (OMEN 4694/2019). Coduri: DLC = Limbă și Comunicare, DS = Științe
// (matematică + cunoașterea mediului), DEC = Estetic și Creativ, DOS = Om și
// Societate. Extras din Carla/Curricula/config_gradinita.json (sursa_nume = string exact).

const gradinita: CurriculumCycle = {
  id: "gradinita",
  nume: "Grădiniță",
  sursa_url:
    "https://www.ise.ro/wp-content/uploads/2019/06/Curriculum-pentru-educatia-timpurie-2019.pdf",
  data_extragere: "2026-08-07",
  nivele: [
    {
      id: "grupa-mica",
      nume: "Grupa Mică",
      sursa_cheie: "Grupa_Mica",
      tip: "domeniu",
      noduri: [
        {
          id: "comunicare",
          nume: "Comunicare",
          cod: "DLC",
          sursa_nume: "Comunicare (DLC)",
        },
        {
          id: "matematica",
          nume: "Matematică",
          cod: "DS",
          sursa_nume: "Matematica (DS)",
        },
        {
          id: "educatie-plastica",
          nume: "Educație Plastică",
          cod: "DEC",
          sursa_nume: "Educatie Plastica (DEC)",
        },
      ],
    },
    {
      id: "grupa-mijlocie",
      nume: "Grupa Mijlocie",
      sursa_cheie: "Grupa_Mijlocie",
      tip: "domeniu",
      noduri: [
        {
          id: "comunicare",
          nume: "Comunicare",
          cod: "DLC",
          sursa_nume: "Comunicare (DLC)",
        },
        {
          id: "matematica",
          nume: "Matematică",
          cod: "DS",
          sursa_nume: "Matematica (DS)",
        },
        {
          id: "educatie-plastica",
          nume: "Educație Plastică",
          cod: "DEC",
          sursa_nume: "Educatie Plastica (DEC)",
        },
        {
          id: "practica",
          nume: "Practică",
          cod: "DOS",
          sursa_nume: "Practica (DOS)",
        },
      ],
    },
    {
      id: "grupa-mare",
      nume: "Grupa Mare",
      sursa_cheie: "Grupa_Mare",
      tip: "domeniu",
      noduri: [
        {
          id: "comunicare",
          nume: "Comunicare",
          cod: "DLC",
          sursa_nume: "Comunicare (DLC)",
        },
        {
          id: "matematica",
          nume: "Matematică",
          cod: "DS",
          sursa_nume: "Matematica (DS)",
        },
        {
          id: "educatie-plastica",
          nume: "Educație Plastică",
          cod: "DEC",
          sursa_nume: "Educatie Plastica (DEC)",
        },
        {
          id: "practica",
          nume: "Practică",
          cod: "DOS",
          sursa_nume: "Practica (DOS)",
        },
        {
          id: "cunoasterea-mediului",
          nume: "Cunoașterea Mediului",
          cod: "DS",
          sursa_nume: "Cunoasterea Mediului",
        },
      ],
    },
  ],
};

export default gradinita;
