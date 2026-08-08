import type { CurriculumCycle } from "../types";

// Grădiniță — „domenii de dezvoltare" (NU materii): Curriculum pentru educația
// timpurie (OMEN 4694/2019). Coduri: DLC = Limbă și Comunicare, DS = Științe
// (matematică + cunoașterea mediului), DEC = Estetic și Creativ, DOS = Om și
// Societate. Extras din Carla/Curricula/config_gradinita.json (sursa_nume = string exact).
// F4 (2026-08-08): 12 regulamente proprii per (grupă × domeniu) — sursate din
// regulamentele Carla ale lui Roland, ALINIATE la Curriculum pentru educația timpurie
// (verificare la sursă primară cu subagenți paraleli organizați PE DOMENIU, ca să prindă
// inconsistențe de progresie Mică→Mijlocie→Mare). Document oficial verificat: NU are
// tabele de conținuturi numerice per grupă (spre deosebire de Primar/Gimnaziu) — un
// singur nivel „preșcolar 3-6 ani" pe 5 domenii de dezvoltare comportamentale (A-E).
// Progresiile numerice/de conținut per grupă sunt concretizări pedagogice graduale,
// documentate explicit ca atare în fiecare regulament. Corecție critică: interdicție
// STRICTĂ (mai tare decât sursa Carla) pe scriere de ecuații „+/-/=" la toate grupele —
// pragul rămâne al Clasei Pregătitoare (Primar). Vezi docs/PLAN_SCOLARE_2026-08-07.md §7 (F4).

const gradinita: CurriculumCycle = {
  id: "gradinita",
  nume: "Grădiniță",
  sursa_url:
    "https://www.edu.ro/sites/default/files/Curriculum%20ET_2019_aug.pdf",
  data_extragere: "2026-08-08",
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
          regulament_ref: "gradinita/grupa-mica/comunicare",
          capitole: [
            "Recunoaștere vizuală litere mari de tipar (A, M, S, O)",
            "Cuvinte simple, familiare (MAMA, CASA, MAR)",
            "Identificarea sunetului inițial (cu sprijin vizual)",
            "Elemente grafice de pre-scriere (trasare contur mare)",
          ],
        },
        {
          id: "matematica",
          nume: "Matematică",
          cod: "DS",
          sursa_nume: "Matematica (DS)",
          regulament_ref: "gradinita/grupa-mica/matematica",
          capitole: [
            "Numerele 1-5 (recunoaștere, numărare, asociere cifră-cantitate)",
            "Comparare cantități (mult/puțin, mai multe/mai puține)",
            "Forme geometrice de bază (cerc, pătrat, opțional triunghi)",
          ],
        },
        {
          id: "educatie-plastica",
          nume: "Educație Plastică",
          cod: "DEC",
          sursa_nume: "Educatie Plastica (DEC)",
          regulament_ref: "gradinita/grupa-mica/educatie-plastica",
          capitole: [
            "Culori primare (recunoaștere și numire)",
            "Colorat în contur",
            "Completarea desenelor simple",
            "Trasare simplă (unire puncte rare)",
          ],
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
          regulament_ref: "gradinita/grupa-mijlocie/comunicare",
          capitole: [
            "Silabisire simplă (cuvinte de 2-3 silabe)",
            "Identificarea sunetului inițial (vocabular extins)",
            "Rime simple",
            "Vocabular uzual extins, asociere cuvânt-imagine",
          ],
        },
        {
          id: "matematica",
          nume: "Matematică",
          cod: "DS",
          sursa_nume: "Matematica (DS)",
          regulament_ref: "gradinita/grupa-mijlocie/matematica",
          capitole: [
            "Numerele 1-7, vecinii numerelor",
            "Ordonare crescătoare/descrescătoare",
            "Categorizare/sortare după un criteriu",
            "Forme geometrice extinse (+ dreptunghi), măsurare intuitivă (mare/mic)",
          ],
        },
        {
          id: "educatie-plastica",
          nume: "Educație Plastică",
          cod: "DEC",
          sursa_nume: "Educatie Plastica (DEC)",
          regulament_ref: "gradinita/grupa-mijlocie/educatie-plastica",
          capitole: [
            "Amestecul culorilor (culori secundare simple)",
            "Desen tematic",
            "Simetrie simplă (a doua jumătate a desenului)",
            "Colorare pe coduri",
          ],
        },
        {
          id: "practica",
          nume: "Practică",
          cod: "DOS",
          sursa_nume: "Practica (DOS)",
          regulament_ref: "gradinita/grupa-mijlocie/practica",
          capitole: [
            "Igienă personală și sănătate de bază",
            "Orientare spațială simplă (sus/jos/stânga/dreapta)",
            "Comportament civilizat, reguli sociale simple",
            "Siguranță personală de bază",
          ],
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
          regulament_ref: "gradinita/grupa-mare/comunicare",
          capitole: [
            "Silabisire complexă (cuvinte de 3-4 silabe)",
            "Sunet inițial și sunet final",
            "Propoziții scurte, analizate STRICT oral",
            "Rime, litere mari de tipar (set extins)",
          ],
        },
        {
          id: "matematica",
          nume: "Matematică",
          cod: "DS",
          sursa_nume: "Matematica (DS)",
          regulament_ref: "gradinita/grupa-mare/matematica",
          capitole: [
            "Numerele 1-10, vecinii numerelor",
            "Comparare cu semnele <, >, = (relație, nu calcul)",
            "Descompunerea numerelor (vizual, prin obiecte desenate)",
            "Probleme ilustrate simple, rezolvate prin numărare",
          ],
        },
        {
          id: "educatie-plastica",
          nume: "Educație Plastică",
          cod: "DEC",
          sursa_nume: "Educatie Plastica (DEC)",
          regulament_ref: "gradinita/grupa-mare/educatie-plastica",
          capitole: [
            "Compoziție cu mai multe elemente (3-4)",
            "Desen după observație (model)",
            "Tehnici mixte simple (colaj + desen)",
            "Simetrie extinsă (mai multe detalii)",
          ],
        },
        {
          id: "practica",
          nume: "Practică",
          cod: "DOS",
          sursa_nume: "Practica (DOS)",
          regulament_ref: "gradinita/grupa-mare/practica",
          capitole: [
            "Orientare spațială complexă (între, deasupra, oblic)",
            "Obiecte și situații periculoase vs. sigure",
            "Rutine complete (4-5 pași)",
            "Comportamente prosociale, reguli de grup",
          ],
        },
        {
          id: "cunoasterea-mediului",
          nume: "Cunoașterea Mediului",
          cod: "DS",
          sursa_nume: "Cunoasterea Mediului",
          regulament_ref: "gradinita/grupa-mare/cunoasterea-mediului",
          capitole: [
            "Animale și habitatele lor",
            "Anotimpurile (caracteristici vizibile)",
            "Corpul omenesc — DOAR părți vizibile + organe de simț",
            "Protejarea naturii (comportamente concrete)",
          ],
        },
      ],
    },
  ],
};

export default gradinita;
