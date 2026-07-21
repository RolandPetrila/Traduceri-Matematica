/* Modul „Planșe" — controller shell (Faza 0).
 *
 * Deocamdată doar bara de sub-taburi + placeholder „în construcție" per tip.
 * Generatoarele reale (JS portat din Python, cu selftest + oracol MT19937) se
 * adaugă în Faza 1+ (labirint întâi). Structura SUBTABS e sursa unică: a adăuga
 * un generator = o intrare aici + un modul în generators/. */

(function () {
  "use strict";

  // Ordinea sub-taburilor (per PLAN §6). `online:true` = AI/serverless (Faza 4),
  // experiență diferită de planșele instant/offline.
  var SUBTABS = [
    {
      id: "numere",
      label: "Numere",
      desc: "Careuri numerice încrucișate (3×3 multi-crossing).",
    },
    {
      id: "integrama",
      label: "Integramă",
      desc: "Integramă aritmetică cu soluție unică.",
    },
    {
      id: "labirint",
      label: "Labirint",
      desc: "Labirint perfect cu drum unic Start→Ieșire.",
    },
    {
      id: "uneste",
      label: "Unește",
      desc: "Unește punctele (connect-the-dots) din catalog de forme.",
    },
    { id: "dictare", label: "Dictare", desc: "Dictare grafică pe grilă." },
    {
      id: "cautare",
      label: "Căutare",
      desc: "Careu de căutare cuvinte pe teme.",
    },
    {
      id: "scolare",
      label: "Școlare",
      icon: "🌐",
      online: true,
      desc: "Fișe școlare generate de AI (online, Faza 4).",
    },
  ];

  var nav = document.getElementById("subtabs");
  var panel = document.getElementById("panel");
  var active = SUBTABS[0].id;

  function renderPanel(tab) {
    var badge = tab.online
      ? '<p class="note-online">🌐 Online / AI — va apărea în Faza 4 (materiale școlare). Restul planșelor sunt offline, instant.</p>'
      : "";
    panel.innerHTML =
      '<div class="wip">' +
      '<span class="emoji">' +
      (tab.icon || "🧩") +
      "</span>" +
      "<h2>" +
      tab.label +
      " — în construcție</h2>" +
      "<p>" +
      tab.desc +
      "</p>" +
      "<p>Scheletul modulului e gata. Generatorul va fi adăugat într-o fază următoare, " +
      "cu formular de parametri, previzualizare și Print/PDF A4.</p>" +
      badge +
      "</div>";
  }

  function setActive(id) {
    active = id;
    var buttons = nav.querySelectorAll(".subtab");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("active", buttons[i].dataset.id === id);
    }
    var tab = SUBTABS.filter(function (t) {
      return t.id === id;
    })[0];
    if (tab) renderPanel(tab);
  }

  SUBTABS.forEach(function (tab) {
    var btn = document.createElement("button");
    btn.className = "subtab";
    btn.type = "button";
    btn.dataset.id = tab.id;
    btn.innerHTML =
      (tab.icon ? tab.icon + " " : "") +
      tab.label +
      (tab.online ? '<span class="badge">🌐</span>' : "");
    btn.addEventListener("click", function () {
      setActive(tab.id);
    });
    nav.appendChild(btn);
  });

  setActive(active);
})();
