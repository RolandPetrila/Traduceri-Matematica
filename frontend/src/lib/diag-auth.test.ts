/**
 * @jest-environment node
 */
import { checkDiagToken } from "./diag-auth";

describe("checkDiagToken — citirea logurilor cere cod de acces", () => {
  it("fail-closed când serverul nu are token configurat", () => {
    expect(checkDiagToken("orice", "")).toBe("not_configured");
    expect(checkDiagToken("orice", undefined)).toBe("not_configured");
    expect(checkDiagToken(null, "   ")).toBe("not_configured");
  });

  it("refuză cererea fără cod", () => {
    expect(checkDiagToken(null, "secret-corect")).toBe("denied");
    expect(checkDiagToken("", "secret-corect")).toBe("denied");
  });

  it("refuză codul greșit, inclusiv prefix sau lungime diferită", () => {
    expect(checkDiagToken("secret-gresit", "secret-corect")).toBe("denied");
    expect(checkDiagToken("secret", "secret-corect")).toBe("denied");
    expect(checkDiagToken("secret-corect-x", "secret-corect")).toBe("denied");
  });

  it("acceptă codul corect (spațiile de la capete ignorate)", () => {
    expect(checkDiagToken("secret-corect", "secret-corect")).toBe("ok");
    expect(checkDiagToken(" secret-corect ", "secret-corect\n")).toBe("ok");
  });
});
