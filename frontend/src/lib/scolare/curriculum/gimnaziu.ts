import type { CurriculumCycle } from "../types";

// Gimnaziu (clasele V-VIII) — programe aprobate OMEN 3393/2017 (matematică și
// științe), 3393/2017 (limbă etc.). Extras din Carla/Curricula/config_gimnaziu.json.
// NOTĂ: config-ul e sursa autoritativă pt LISTA de materii (skeleton). Regulamentul
// Carla acoperă doar 7/9 la Clasa 5 (lipsesc Engleză + Ed. Socială) — gol de CONȚINUT
// (F1+), nu de skeleton. Vezi docs/PLAN_SCOLARE_2026-08-07.md §8.

const gimnaziu: CurriculumCycle = {
  id: "gimnaziu",
  nume: "Gimnaziu",
  sursa_url: "https://www.ise.ro/wp-content/uploads/2017/01/Matematica.pdf",
  data_extragere: "2026-08-07",
  nivele: [
    {
      id: "clasa-5",
      nume: "Clasa a V-a",
      sursa_cheie: "Clasa_5",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
        },
        {
          // PILOT F0 — îmbogățit cu capitolele din programa oficială OMEN 3393/2017.
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          regulament_ref: "gimnaziu/clasa-5/matematica",
          capitole: [
            "Numere naturale (operații, puteri cu exponent natural, ordinea operațiilor)",
            "Divizibilitate (divizori, multipli, criterii)",
            "Metode aritmetice de rezolvare a problemelor",
            "Mulțimi (notații, operații cu mulțimi)",
            "Fracții ordinare (operații, compararea)",
            "Fracții zecimale (operații, aproximări)",
            "Unități de măsură (lungime, arie, volum, masă, timp)",
            "Elemente de geometrie (unghiuri, triunghi, patrulater, perimetru, arie)",
          ],
        },
        {
          id: "limba-engleza",
          nume: "Limba Engleză",
          sursa_nume: "Limba Engleza",
        },
        { id: "istorie", nume: "Istorie", sursa_nume: "Istorie" },
        { id: "geografie", nume: "Geografie", sursa_nume: "Geografie" },
        { id: "biologie", nume: "Biologie", sursa_nume: "Biologie" },
        {
          id: "educatie-tehnologica",
          nume: "Educație Tehnologică",
          sursa_nume: "Educatie Tehnologica",
        },
        {
          id: "informatica-tic",
          nume: "Informatică și TIC",
          sursa_nume: "Informatica si TIC",
        },
        {
          id: "educatie-sociala",
          nume: "Educație Socială",
          sursa_nume: "Educatie Sociala",
        },
      ],
    },
    {
      id: "clasa-6",
      nume: "Clasa a VI-a",
      sursa_cheie: "Clasa_6",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
        },
        { id: "matematica", nume: "Matematică", sursa_nume: "Matematica" },
        {
          id: "limba-engleza",
          nume: "Limba Engleză",
          sursa_nume: "Limba Engleza",
        },
        { id: "fizica", nume: "Fizică", sursa_nume: "Fizica" },
        { id: "istorie", nume: "Istorie", sursa_nume: "Istorie" },
        { id: "geografie", nume: "Geografie", sursa_nume: "Geografie" },
        { id: "biologie", nume: "Biologie", sursa_nume: "Biologie" },
        {
          id: "educatie-tehnologica",
          nume: "Educație Tehnologică",
          sursa_nume: "Educatie Tehnologica",
        },
        {
          id: "informatica-tic",
          nume: "Informatică și TIC",
          sursa_nume: "Informatica si TIC",
        },
        {
          id: "educatie-sociala",
          nume: "Educație Socială",
          sursa_nume: "Educatie Sociala",
        },
      ],
    },
    {
      id: "clasa-7",
      nume: "Clasa a VII-a",
      sursa_cheie: "Clasa_7",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
        },
        { id: "matematica", nume: "Matematică", sursa_nume: "Matematica" },
        {
          id: "limba-engleza",
          nume: "Limba Engleză",
          sursa_nume: "Limba Engleza",
        },
        { id: "fizica", nume: "Fizică", sursa_nume: "Fizica" },
        { id: "chimie", nume: "Chimie", sursa_nume: "Chimie" },
        { id: "istorie", nume: "Istorie", sursa_nume: "Istorie" },
        { id: "geografie", nume: "Geografie", sursa_nume: "Geografie" },
        { id: "biologie", nume: "Biologie", sursa_nume: "Biologie" },
        {
          id: "educatie-tehnologica",
          nume: "Educație Tehnologică",
          sursa_nume: "Educatie Tehnologica",
        },
        {
          id: "informatica-tic",
          nume: "Informatică și TIC",
          sursa_nume: "Informatica si TIC",
        },
        {
          id: "educatie-sociala",
          nume: "Educație Socială",
          sursa_nume: "Educatie Sociala",
        },
      ],
    },
    {
      id: "clasa-8",
      nume: "Clasa a VIII-a",
      sursa_cheie: "Clasa_8",
      tip: "materie",
      noduri: [
        {
          id: "limba-romana",
          nume: "Limba și Literatura Română",
          sursa_nume: "Limba si Literatura Romana",
        },
        { id: "matematica", nume: "Matematică", sursa_nume: "Matematica" },
        {
          id: "limba-engleza",
          nume: "Limba Engleză",
          sursa_nume: "Limba Engleza",
        },
        { id: "fizica", nume: "Fizică", sursa_nume: "Fizica" },
        { id: "chimie", nume: "Chimie", sursa_nume: "Chimie" },
        { id: "istorie", nume: "Istorie", sursa_nume: "Istorie" },
        { id: "geografie", nume: "Geografie", sursa_nume: "Geografie" },
        { id: "biologie", nume: "Biologie", sursa_nume: "Biologie" },
        {
          id: "educatie-sociala",
          nume: "Educație Socială",
          sursa_nume: "Educatie Sociala",
        },
      ],
    },
  ],
};

export default gimnaziu;
