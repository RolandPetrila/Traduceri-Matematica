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
        {
          // F1 — regulament propriu (era copie Clasa 5, bug „7 regulamente").
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          regulament_ref: "gimnaziu/clasa-6/matematica",
          capitole: [
            "Mulțimi și divizibilitate (operații cu mulțimi, descompunere în factori primi, c.m.m.d.c./c.m.m.m.c.)",
            "Rapoarte și proporții (regula de trei simplă, mărimi direct/invers proporționale)",
            "Mulțimea numerelor întregi (operații, ecuații/inecuații)",
            "Mulțimea numerelor raționale (operații, ecuații liniare simple)",
            "Noțiuni geometrice fundamentale (unghiuri, drepte paralele/perpendiculare, cercul)",
            "Triunghiul (construcție, congruență, linii importante, teorema lui Pitagora)",
          ],
        },
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
        {
          // F1 — regulament propriu (era copie Clasa 5, bug „7 regulamente").
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          regulament_ref: "gimnaziu/clasa-7/matematica",
          capitole: [
            "Mulțimea numerelor reale (radicali, numere iraționale, ℕ⊂ℤ⊂ℚ⊂ℝ)",
            "Ecuații și sisteme de ecuații liniare",
            "Elemente de organizare a datelor (sistem de axe ortogonale)",
            "Patrulaterul (paralelogram, dreptunghi, romb, pătrat, trapez)",
            "Cercul (unghi înscris, coarde, arce, tangente, poligoane regulate)",
            "Asemănarea triunghiurilor (teorema lui Thales)",
            "Relații metrice în triunghiul dreptunghic (Pitagora, trigonometrie)",
          ],
        },
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
        {
          // F1 — regulament propriu (era copie Clasa 5, bug „7 regulamente").
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          regulament_ref: "gimnaziu/clasa-8/matematica",
          capitole: [
            "Intervale de numere reale. Inecuații în ℝ",
            "Calcul algebric în ℝ (formule de calcul prescurtat, descompuneri în factori, ecuații de gradul II)",
            "Funcții (f(x)=ax+b, elemente de statistică)",
            "Elemente ale geometriei în spațiu (corpuri geometrice, paralelism, perpendicularitate)",
            "Arii și volume ale corpurilor geometrice (prismă, piramidă, cilindru, con, sferă)",
          ],
        },
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
