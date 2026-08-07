import type { CurriculumCycle } from "../types";

// Primar (clasele pregătitoare/0 → IV) — programe aprobate OMEN 3418/2013 (0-II),
// OMEN 5003/2014 (III-IV). Extras din Carla/Curricula/config_primar.json.

const primar: CurriculumCycle = {
  id: "primar",
  nume: "Primar",
  sursa_url:
    "https://rocnee.eu/index.php/dcee-oriz/curriculum-oriz/programe-scolare-front/programe-scolare-in-vigoare",
  data_extragere: "2026-08-07",
  nivele: [
    {
      id: "clasa-0",
      nume: "Clasa Pregătitoare",
      sursa_cheie: "Clasa_0",
      tip: "materie",
      noduri: [
        {
          id: "comunicare-lb-romana",
          nume: "Comunicare în Limba Română",
          sursa_nume: "Comunicare in Limba Romana",
        },
        {
          id: "matematica-explorare",
          nume: "Matematică și Explorarea Mediului",
          sursa_nume: "Matematica si Explorarea Mediului",
        },
        {
          id: "arte-vizuale",
          nume: "Arte Vizuale",
          sursa_nume: "Arte Vizuale",
        },
      ],
    },
    {
      id: "clasa-1",
      nume: "Clasa I",
      sursa_cheie: "Clasa_1",
      tip: "materie",
      noduri: [
        {
          id: "comunicare-lb-romana",
          nume: "Comunicare în Limba Română",
          sursa_nume: "Comunicare in Limba Romana",
        },
        {
          id: "matematica-explorare",
          nume: "Matematică și Explorarea Mediului",
          sursa_nume: "Matematica si Explorarea Mediului",
        },
        {
          id: "arte-vizuale-abilitati",
          nume: "Arte Vizuale și Abilități Practice",
          sursa_nume: "Arte Vizuale si Abilitati Practice",
        },
      ],
    },
    {
      id: "clasa-2",
      nume: "Clasa a II-a",
      sursa_cheie: "Clasa_2",
      tip: "materie",
      noduri: [
        {
          id: "comunicare-lb-romana",
          nume: "Comunicare în Limba Română",
          sursa_nume: "Comunicare in Limba Romana",
        },
        {
          id: "matematica-explorare",
          nume: "Matematică și Explorarea Mediului",
          sursa_nume: "Matematica si Explorarea Mediului",
        },
        {
          id: "arte-vizuale",
          nume: "Arte Vizuale",
          sursa_nume: "Arte Vizuale",
        },
        {
          id: "dezvoltare-personala",
          nume: "Dezvoltare Personală",
          sursa_nume: "Dezvoltare Personala",
        },
      ],
    },
    {
      id: "clasa-3",
      nume: "Clasa a III-a",
      sursa_cheie: "Clasa_3",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
        },
        { id: "matematica", nume: "Matematică", sursa_nume: "Matematica" },
        {
          id: "stiinte",
          nume: "Științe ale Naturii",
          sursa_nume: "Stiinte ale Naturii",
        },
        {
          id: "educatie-civica",
          nume: "Educație Civică",
          sursa_nume: "Educatie Civica",
        },
        {
          id: "joc-miscare",
          nume: "Joc și Mișcare",
          sursa_nume: "Joc si miscare",
        },
      ],
    },
    {
      id: "clasa-4",
      nume: "Clasa a IV-a",
      sursa_cheie: "Clasa_4",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
        },
        { id: "matematica", nume: "Matematică", sursa_nume: "Matematica" },
        {
          id: "stiinte",
          nume: "Științe ale Naturii",
          sursa_nume: "Stiinte ale Naturii",
        },
        { id: "istorie", nume: "Istorie", sursa_nume: "Istorie" },
        { id: "geografie", nume: "Geografie", sursa_nume: "Geografie" },
        {
          id: "educatie-civica",
          nume: "Educație Civică",
          sursa_nume: "Educatie Civica",
        },
      ],
    },
  ],
};

export default primar;
