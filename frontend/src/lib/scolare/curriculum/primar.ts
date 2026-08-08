import type { CurriculumCycle } from "../types";

// Primar (clasele pregătitoare/0 → IV) — programe aprobate OMEN 3418/2013 (0-II),
// OMEN 5003/2014 (III-IV). Extras din Carla/Curricula/config_primar.json.
// F3 (2026-08-08): regulamente proprii per (clasă × materie) — sursate din regulamentele
// Carla ale lui Roland, ALINIATE la programa oficială (verificare la sursă primară cu
// subagenți; corecții baked, ex. MEM CP 0-31 nu 0-20, Științe FĂRĂ sisteme corp uman,
// LR fără „numeral", Istorie tematică fără ani). Vezi docs/PLAN_SCOLARE_2026-08-07.md §7 (F3).

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
          regulament_ref: "primar/clasa-0/comunicare-lb-romana",
          capitole: [
            "Sunete, silabe, cuvinte, propoziții (fără teoretizări)",
            "Literele mici și mari de tipar",
            "Elemente grafice pregătitoare pentru scris",
            "Dialog (întrebări și răspunsuri)",
            "Despărțirea cuvintelor în silabe",
          ],
        },
        {
          id: "matematica-explorare",
          nume: "Matematică și Explorarea Mediului",
          sursa_nume: "Matematica si Explorarea Mediului",
          regulament_ref: "primar/clasa-0/matematica-explorare",
          capitole: [
            "Numerele naturale 0–31 (formare, comparare, ordonare)",
            "Adunarea și scăderea în concentrul 0–31 (cu suport intuitiv)",
            "Figuri (pătrat, dreptunghi, triunghi, cerc) și corpuri (cub, sferă)",
            "Orientare spațială",
            "Explorarea mediului (anotimpuri, plante, animale)",
          ],
        },
        {
          id: "arte-vizuale",
          nume: "Arte Vizuale",
          sursa_nume: "Arte Vizuale",
          regulament_ref: "primar/clasa-0/arte-vizuale",
          capitole: [
            "Desen (linie, punct, formă)",
            "Pictură (pata, acuarele)",
            "Colaj și confecții simple",
            "Modelaj (plastilină)",
          ],
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
          regulament_ref: "primar/clasa-1/comunicare-lb-romana",
          capitole: [
            "Literele de tipar și de mână; alfabetul",
            "Grupurile de litere ce, ci, ge, gi, che, chi, ghe, ghi",
            "Citirea propozițiilor și a textelor scurte (≤75 cuvinte)",
            "Punctuație (punctul, semnul întrebării, linia de dialog)",
            "Scriere imaginativă (3–5 enunțuri)",
          ],
        },
        {
          id: "matematica-explorare",
          nume: "Matematică și Explorarea Mediului",
          sursa_nume: "Matematica si Explorarea Mediului",
          regulament_ref: "primar/clasa-1/matematica-explorare",
          capitole: [
            "Numerele naturale 0–100 (pare/impare)",
            "Adunarea și scăderea 0–100 (cu și fără trecere peste ordin)",
            "Probleme cu 1–2 operații",
            "Figuri și corpuri geometrice",
            "Măsurări (cm, litru, ora fixă/jumătate, leul)",
          ],
        },
        {
          id: "arte-vizuale-abilitati",
          nume: "Arte Vizuale și Abilități Practice",
          sursa_nume: "Arte Vizuale si Abilitati Practice",
          regulament_ref: "primar/clasa-1/arte-vizuale-abilitati",
          capitole: [
            "Desen (linie modulată, hașurare, decorații pentru scris)",
            "Confecții (cusut, țesut)",
            "Colaj și modelaj",
            "Simetrie",
          ],
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
          regulament_ref: "primar/clasa-2/comunicare-lb-romana",
          capitole: [
            "Grupurile de litere (continuare); alfabetul",
            "Textul (≤120 cuvinte): literar și nonliterar",
            "Punctuație (semnul exclamării, virgula, două puncte)",
            "Scriere imaginativă (3–7 enunțuri)",
            "Despărțirea în silabe la capăt de rând",
          ],
        },
        {
          id: "matematica-explorare",
          nume: "Matematică și Explorarea Mediului",
          sursa_nume: "Matematica si Explorarea Mediului",
          regulament_ref: "primar/clasa-2/matematica-explorare",
          capitole: [
            "Numerele naturale 0–1000",
            "Adunarea și scăderea 0–1000 (cu trecere peste ordin)",
            "Înmulțirea și împărțirea în concentrul 0–100 (tabla)",
            "Fracții: ½ și ¼",
            "Măsurări (m/cm/mm, litru/ml, kg/g, ceasul, euro)",
          ],
        },
        {
          id: "arte-vizuale",
          nume: "Arte Vizuale",
          sursa_nume: "Arte Vizuale",
          regulament_ref: "primar/clasa-2/arte-vizuale",
          capitole: [
            "Desen (hașurare, stilizare, gravură)",
            "Pictură (pata plată/vibrată, culori calde/reci)",
            "Modelaj și confecții",
            "Colaj (origami, tangram); simetrie",
          ],
        },
        {
          id: "dezvoltare-personala",
          nume: "Dezvoltare Personală",
          sursa_nume: "Dezvoltare Personala",
          regulament_ref: "primar/clasa-2/dezvoltare-personala",
          capitole: [
            "Autocunoaștere și igienă personală",
            "Emoții și ascultare activă; respectul",
            "Organizarea timpului și a învățării",
            "Utilitatea socială a meseriilor",
          ],
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
          regulament_ref: "primar/clasa-3/limba-romana",
          capitole: [
            "Acte de vorbire (relatare, descriere, întrebări/răspunsuri)",
            "Textul literar (narativ) și de informare",
            "Intuirea claselor morfologice: substantiv, adjectiv, pronume, verb",
            "Număr și gen (intuitiv, fără metalimbaj)",
            "Redactare de text imaginativ după plan",
          ],
        },
        {
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          regulament_ref: "primar/clasa-3/matematica",
          capitole: [
            "Numerele naturale 0–10.000",
            "Adunarea, scăderea, înmulțirea; împărțirea în 0–100",
            "Ordinea operațiilor (paranteze rotunde)",
            "Aflarea numărului necunoscut (mersul invers)",
            "Fracții subunitare/echiunitare (numitor ≤ 10)",
            "Perimetrul; unități de măsură",
          ],
        },
        {
          id: "stiinte",
          nume: "Științe ale Naturii",
          sursa_nume: "Stiinte ale Naturii",
          regulament_ref: "primar/clasa-3/stiinte",
          capitole: [
            "Științele vieții (viețuitoare, grupe de animale)",
            "Pământul — mediu de viață (apa, circuitul apei, fenomene)",
            "Corpuri și proprietăți; stări de agregare",
            "Interacțiuni, magneți, busola",
            "Forțe și transformări (topire, vaporizare)",
          ],
        },
        {
          id: "educatie-civica",
          nume: "Educație Civică",
          sursa_nume: "Educatie Civica",
          regulament_ref: "primar/clasa-3/educatie-civica",
          capitole: [
            "Persoana și trăsături morale",
            "Raporturile cu lucrurile",
            "Raporturile cu animalele și plantele",
            "Grupuri mici: drepturi și îndatoriri",
          ],
        },
        {
          id: "joc-miscare",
          nume: "Joc și Mișcare",
          sursa_nume: "Joc si miscare",
          regulament_ref: "primar/clasa-3/joc-miscare",
          capitole: [
            "Capacitate psiho-motrică (mers, alergare, sărituri, aruncare)",
            "Deprinderi de comunicare și lucru în echipă",
            "Stil de viață activ; fair-play",
          ],
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
          regulament_ref: "primar/clasa-4/limba-romana",
          capitole: [
            "Acte de vorbire (relatare, descriere, argumentare)",
            "Text literar narativ și descriptiv (portret); ≥ 800 cuvinte",
            "Recunoașterea părților de vorbire cunoscute + persoană/timp",
            "Intuirea subiectului și predicatului; dezacordul",
            "Redactare (5–7 enunțuri)",
          ],
        },
        {
          id: "matematica",
          nume: "Matematică",
          sursa_nume: "Matematica",
          regulament_ref: "primar/clasa-4/matematica",
          capitole: [
            "Numerele naturale 0–1.000.000",
            "Cele patru operații; ordinea operațiilor (paranteze rotunde și pătrate)",
            "Aflarea numărului necunoscut (mersul invers)",
            "Fracții (numitor ≤ 100, sutimi); procente 25/50/75%",
            "Perimetrul și aria (rețea de pătrate); volume",
            "Măsurări cu transformări",
          ],
        },
        {
          id: "stiinte",
          nume: "Științe ale Naturii",
          sursa_nume: "Stiinte ale Naturii",
          regulament_ref: "primar/clasa-4/stiinte",
          capitole: [
            "Cicluri de viață; lanțuri trofice",
            "Pământul în Sistemul Solar",
            "Corpuri (plutire, proprietățile apei)",
            "Amestecuri, dizolvare, ardere/ruginire",
            "Energie, căldură; circuite electrice și lumină",
          ],
        },
        {
          id: "istorie",
          nume: "Istorie",
          sursa_nume: "Istorie",
          regulament_ref: "primar/clasa-4/istorie",
          capitole: [
            "Trecutul și prezentul; surse istorice",
            "Noțiuni de timp (secol, mileniu, epocă)",
            "Epoca modernă: Cuza, Carol I, Ferdinand, Marea Unire",
            "Cultură și patrimoniu; legende (exemple recomandate)",
          ],
        },
        {
          id: "geografie",
          nume: "Geografie",
          sursa_nume: "Geografie",
          regulament_ref: "primar/clasa-4/geografie",
          capitole: [
            "Orizontul local (puncte cardinale, hartă, plan)",
            "Relieful, apele, clima și vegetația României",
            "Marile unități: Carpații, dealuri/podișuri, câmpii (Delta)",
            "România în Europa (UE); Terra (continente, oceane)",
          ],
        },
        {
          id: "educatie-civica",
          nume: "Educație Civică",
          sursa_nume: "Educatie Civica",
          regulament_ref: "primar/clasa-4/educatie-civica",
          capitole: [
            "Apartenența locală, națională (însemnele țării) și europeană (UE)",
            "Valori și norme morale",
            "Comportamente moral-civice (prosociale/antisociale)",
            "Drepturile universale ale copilului",
          ],
        },
      ],
    },
  ],
};

export default primar;
