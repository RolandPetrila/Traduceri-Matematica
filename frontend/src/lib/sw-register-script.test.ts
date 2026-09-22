import {
  SW_REGISTER_SCRIPT,
  SW_UPDATE_FAIL_THRESHOLD,
} from "./sw-register-script";

/**
 * Rulează scriptul REAL (același șir injectat în <head>) peste un
 * `navigator.serviceWorker` simulat și numără câte respingeri lasă intenționat
 * netratate (= câte rânduri ar ajunge în Supabase prin monitoring.ts).
 */
type Outcome = "fail" | "ok";

function setup(outcomes: Outcome[], online = true) {
  let call = 0;
  const update = jest.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        const o = outcomes[Math.min(call, outcomes.length - 1)];
        call++;
        if (o === "ok") resolve();
        else reject(new TypeError("Failed to update a ServiceWorker"));
      }),
  );
  const reg = { update, addEventListener: jest.fn(), installing: null };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      controller: null,
      addEventListener: jest.fn(),
      register: jest.fn(() => Promise.resolve(reg)),
    },
  });
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => online,
  });
  // Doar respingerile create de script trec prin Promise.reject (mock-ul de
  // update folosește `new Promise`) → spionul le numără exact pe ale lui.
  const origReject = Promise.reject.bind(Promise);
  const rejectSpy = jest.spyOn(Promise, "reject").mockImplementation((e) => {
    const p = origReject(e);
    p.catch(() => {}); // nu lăsăm testul să emită un unhandled real
    return p;
  });
  // Capturăm handler-ul `load` în loc să-l lăsăm pe window: altfel s-ar
  // acumula între teste și fiecare test ar rula toate înregistrările vechi.
  let onLoad: (() => void) | undefined;
  jest
    .spyOn(window, "addEventListener")
    .mockImplementation((type: string, fn: unknown) => {
      if (type === "load") onLoad = fn as () => void;
    });
  new Function(SW_REGISTER_SCRIPT)();
  onLoad?.();
  return { update, rejectSpy };
}

async function runChecks(n: number) {
  await jest.advanceTimersByTimeAsync(0); // register + primul update
  for (let i = 1; i < n; i++) await jest.advanceTimersByTimeAsync(60000);
}

describe("SW_REGISTER_SCRIPT — prag de eșecuri la update", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it(`raportează O dată după ${SW_UPDATE_FAIL_THRESHOLD} eșecuri consecutive online`, async () => {
    const { update, rejectSpy } = setup(["fail"]);
    await runChecks(SW_UPDATE_FAIL_THRESHOLD - 1);
    expect(rejectSpy).not.toHaveBeenCalled();
    // pragul + încă 3 eșecuri, câte o verificare la 60s
    for (let i = 0; i < 4; i++) await jest.advanceTimersByTimeAsync(60000);
    expect(update).toHaveBeenCalledTimes(SW_UPDATE_FAIL_THRESHOLD + 3);
    expect(rejectSpy).toHaveBeenCalledTimes(1);
    expect(rejectSpy.mock.calls[0][0]).toBeInstanceOf(TypeError);
  });

  it("un succes resetează contorul — eșecurile trecătoare nu se raportează", async () => {
    const { rejectSpy } = setup(["fail", "fail", "ok", "fail", "fail", "ok"]);
    await runChecks(6);
    expect(rejectSpy).not.toHaveBeenCalled();
  });

  it("offline: eșecurile nu se numără deloc", async () => {
    const { update, rejectSpy } = setup(["fail"], false);
    await runChecks(6);
    expect(update).toHaveBeenCalledTimes(6);
    expect(rejectSpy).not.toHaveBeenCalled();
  });
});
