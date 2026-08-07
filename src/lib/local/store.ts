// In-memory data store for the LOCAL_MODE preview (no real Supabase).
// Lives on `globalThis` so it survives Next.js dev-server hot reloads of
// this module, but resets on a full server restart — by design, this is a
// throwaway preview data set, not persistent storage.

export const LOCAL_USER_ID = "00000000-0000-0000-0000-000000000001";
export const LOCAL_USER_EMAIL = "demo@kerenamar.local";

export type Row = Record<string, unknown>;

export interface Store {
  clients: Row[];
  treatments: Row[];
  appointments: Row[];
  treatment_log: Row[];
  product_sales: Row[];
  expense_categories: Row[];
  expenses: Row[];
  weekly_goals: Row[];
}

declare global {
  var __kaLocalStore: Store | undefined;
}

function uuid() {
  return crypto.randomUUID();
}

function atTime(daysFromToday: number, hours: number, minutes = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function isoDateOnly(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Sunday-based week start, matching lib/dates.ts weekStart().
function daysSinceSunday(): number {
  return new Date().getDay(); // 0 = Sunday
}

function buildSeed(): Store {
  const now = new Date();

  // ---- treatments -----------------------------------------------------
  const t = {
    lacquer: uuid(),
    acrylic: uuid(),
    deepClean: uuid(),
    phototherapy: uuid(),
    brightening: uuid(),
    meso: uuid(),
    electro: uuid(),
    rfExternal: uuid(),
    rfFace: uuid(),
    rfBody: uuid(),
    rfNeck: uuid(),
    rfNeckFace: uuid(),
    scarRemoval: uuid(),
  };

  const treatments: Row[] = [
    { id: t.lacquer, user_id: LOCAL_USER_ID, category: "ציפורניים", name: "מריחת לק", description: null, price: 150, price_note: null, duration_minutes: 45, is_series: false, series_size: null, series_price: null, sort_order: 1, created_at: now.toISOString() },
    { id: t.acrylic, user_id: LOCAL_USER_ID, category: "ציפורניים", name: "בניית ציפורניים באקריל + לק", description: null, price: 300, price_note: null, duration_minutes: 60, is_series: false, series_size: null, series_price: null, sort_order: 2, created_at: now.toISOString() },

    { id: t.deepClean, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "ניקוי עמוק", description: "אבחון עור, פילינג, ניקוז, לחויות במכשור מתקדם, מסכות, פוטותרפיה", price: 400, price_note: null, duration_minutes: 60, is_series: false, series_size: null, series_price: null, sort_order: 10, created_at: now.toISOString() },
    { id: t.phototherapy, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "פוטותרפיה", description: "חיטוי, טיהור, אנטי-אייג'ינג, קולגן ואלסטין, הבהרה", price: 150, price_note: null, duration_minutes: 20, is_series: false, series_size: null, series_price: null, sort_order: 11, created_at: now.toISOString() },
    { id: t.brightening, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "טיפול הבהרה", description: "פילינג + מכשור מתקדם", price: 400, price_note: null, duration_minutes: 60, is_series: true, series_size: 4, series_price: 1400, sort_order: 12, created_at: now.toISOString() },
    { id: t.meso, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "מזותרפיה", description: "פציעה מבוקרת, מעודד התחדשות עור - בסדרה בלבד", price: 500, price_note: null, duration_minutes: 50, is_series: true, series_size: 5, series_price: 2000, sort_order: 13, created_at: now.toISOString() },
    { id: t.electro, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "אלקטרופורציה", description: "החדרת חומרים פעילים, השלמה לזוהר", price: null, price_note: "400-600 ₪", duration_minutes: 60, is_series: false, series_size: null, series_price: null, sort_order: 14, created_at: now.toISOString() },
    { id: t.rfExternal, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "RF חיצוני", description: "קולגן, אלסטין, מיצוק", price: 600, price_note: null, duration_minutes: 60, is_series: false, series_size: null, series_price: null, sort_order: 15, created_at: now.toISOString() },
    { id: t.rfFace, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "RF פנים", description: null, price: null, price_note: "700-900 ₪", duration_minutes: 60, is_series: false, series_size: null, series_price: null, sort_order: 16, created_at: now.toISOString() },
    { id: t.rfBody, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "RF גוף", description: null, price: null, price_note: "800-1500 ₪", duration_minutes: 75, is_series: false, series_size: null, series_price: null, sort_order: 17, created_at: now.toISOString() },
    { id: t.rfNeck, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "RF צוואר", description: null, price: 800, price_note: null, duration_minutes: 50, is_series: false, series_size: null, series_price: null, sort_order: 18, created_at: now.toISOString() },
    { id: t.rfNeckFace, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "RF צוואר ופנים", description: null, price: 1000, price_note: null, duration_minutes: 75, is_series: false, series_size: null, series_price: null, sort_order: 19, created_at: now.toISOString() },
    { id: t.scarRemoval, user_id: LOCAL_USER_ID, category: "טיפולי פנים", name: "הסרת סרחי עור", description: null, price: null, price_note: "לפי הערכה בייעוץ", duration_minutes: 60, is_series: false, series_size: null, series_price: null, sort_order: 20, created_at: now.toISOString() },
  ];

  // ---- clients ----------------------------------------------------------
  const c = {
    michal: uuid(),
    shira: uuid(),
    noa: uuid(),
    talya: uuid(),
    rachel: uuid(),
    yael: uuid(),
  };

  const clients: Row[] = [
    { id: c.michal, user_id: LOCAL_USER_ID, name: "מיכל לוי", phone: "050-1234567", notes: null, created_at: now.toISOString() },
    { id: c.shira, user_id: LOCAL_USER_ID, name: "שירה כהן", phone: "052-2345678", notes: "רגישה לחומרי פילינג חזקים", created_at: now.toISOString() },
    { id: c.noa, user_id: LOCAL_USER_ID, name: "נועה אברהם", phone: "054-3456789", notes: null, created_at: now.toISOString() },
    { id: c.talya, user_id: LOCAL_USER_ID, name: "טליה מזרחי", phone: null, notes: null, created_at: now.toISOString() },
    { id: c.rachel, user_id: LOCAL_USER_ID, name: "רחל בן דוד", phone: "053-4567890", notes: null, created_at: now.toISOString() },
    { id: c.yael, user_id: LOCAL_USER_ID, name: "יעל אזולאי", phone: "050-5678901", notes: "לקוחה חדשה — הגיעה בהמלצה", created_at: now.toISOString() },
  ];

  // ---- appointments + treatment_log + product_sales ---------------------
  const appointments: Row[] = [];
  const treatmentLog: Row[] = [];
  const productSales: Row[] = [];

  function addCompleted(opts: {
    daysFromToday: number;
    hour: number;
    clientId: string;
    treatmentId: string;
    price: number;
    duration: number;
    isPaid?: boolean;
    followUpOf?: string;
  }): string {
    const id = uuid();
    appointments.push({
      id,
      user_id: LOCAL_USER_ID,
      client_id: opts.clientId,
      treatment_id: opts.treatmentId,
      treatment_name_freetext: null,
      expected_price: opts.price,
      starts_at: atTime(opts.daysFromToday, opts.hour),
      duration_minutes: opts.duration,
      status: "completed",
      notes: null,
      follow_up_of_appointment_id: opts.followUpOf ?? null,
      created_at: now.toISOString(),
    });
    const treatment = treatments.find((tr) => tr.id === opts.treatmentId)!;
    treatmentLog.push({
      id: uuid(),
      user_id: LOCAL_USER_ID,
      appointment_id: id,
      client_id: opts.clientId,
      treatment_id: opts.treatmentId,
      treatment_name: treatment.name,
      amount: opts.price,
      duration_minutes: opts.duration,
      payment_method: ["cash", "card", "bit", "transfer"][Math.floor(Math.random() * 4)],
      is_paid: opts.isPaid ?? true,
      performed_at: atTime(opts.daysFromToday, opts.hour),
      notes: null,
      created_at: now.toISOString(),
    });
    return id;
  }

  function addPlanned(opts: {
    daysFromToday: number;
    hour: number;
    clientId: string;
    treatmentId: string;
    price: number;
    duration: number;
    followUpOf?: string;
  }): string {
    const id = uuid();
    appointments.push({
      id,
      user_id: LOCAL_USER_ID,
      client_id: opts.clientId,
      treatment_id: opts.treatmentId,
      treatment_name_freetext: null,
      expected_price: opts.price,
      starts_at: atTime(opts.daysFromToday, opts.hour),
      duration_minutes: opts.duration,
      status: "planned",
      notes: null,
      follow_up_of_appointment_id: opts.followUpOf ?? null,
      created_at: now.toISOString(),
    });
    return id;
  }

  // Past 3 weeks: a realistic mix of nails/facials, mostly completed.
  const past1 = addCompleted({ daysFromToday: -21, hour: 10, clientId: c.michal, treatmentId: t.acrylic, price: 300, duration: 60 });
  addPlanned({ daysFromToday: -14, hour: 10, clientId: c.michal, treatmentId: t.acrylic, price: 300, duration: 60, followUpOf: past1 });
  addCompleted({ daysFromToday: -20, hour: 12, clientId: c.shira, treatmentId: t.deepClean, price: 400, duration: 60 });
  addCompleted({ daysFromToday: -19, hour: 9, clientId: c.noa, treatmentId: t.lacquer, price: 150, duration: 45 });
  addCompleted({ daysFromToday: -18, hour: 15, clientId: c.rachel, treatmentId: t.rfExternal, price: 600, duration: 60, isPaid: false });
  const past2 = addCompleted({ daysFromToday: -17, hour: 11, clientId: c.talya, treatmentId: t.brightening, price: 400, duration: 60 });
  addPlanned({ daysFromToday: -3, hour: 11, clientId: c.talya, treatmentId: t.brightening, price: 400, duration: 60, followUpOf: past2 });
  appointments[appointments.length - 1].status = "completed";
  treatmentLog.push({
    id: uuid(), user_id: LOCAL_USER_ID, appointment_id: appointments[appointments.length - 1].id,
    client_id: c.talya, treatment_id: t.brightening, treatment_name: "טיפול הבהרה",
    amount: 400, duration_minutes: 60, payment_method: "card", is_paid: true,
    performed_at: atTime(-3, 11), notes: null, created_at: now.toISOString(),
  });

  addCompleted({ daysFromToday: -13, hour: 10, clientId: c.yael, treatmentId: t.acrylic, price: 300, duration: 60 });
  addCompleted({ daysFromToday: -12, hour: 13, clientId: c.michal, treatmentId: t.phototherapy, price: 150, duration: 20 });
  addCompleted({ daysFromToday: -11, hour: 16, clientId: c.shira, treatmentId: t.meso, price: 500, duration: 50 });
  addCompleted({ daysFromToday: -10, hour: 9, clientId: c.noa, treatmentId: t.acrylic, price: 300, duration: 60, isPaid: false });
  addCompleted({ daysFromToday: -9, hour: 12, clientId: c.rachel, treatmentId: t.lacquer, price: 150, duration: 45 });
  addCompleted({ daysFromToday: -8, hour: 14, clientId: c.talya, treatmentId: t.deepClean, price: 400, duration: 60 });

  // No-show / cancelled examples for status-badge variety.
  const nsId = uuid();
  appointments.push({
    id: nsId, user_id: LOCAL_USER_ID, client_id: c.yael, treatment_id: t.lacquer,
    treatment_name_freetext: null, expected_price: 150, starts_at: atTime(-6, 11),
    duration_minutes: 45, status: "no_show", notes: null, follow_up_of_appointment_id: null,
    created_at: now.toISOString(),
  });
  const cnId = uuid();
  appointments.push({
    id: cnId, user_id: LOCAL_USER_ID, client_id: c.michal, treatment_id: t.rfFace,
    treatment_name_freetext: null, expected_price: 800, starts_at: atTime(-5, 13),
    duration_minutes: 60, status: "cancelled", notes: null, follow_up_of_appointment_id: null,
    created_at: now.toISOString(),
  });

  // This week: mix of already-completed (earlier today / earlier this
  // week) and still-planned, so "today" + dashboard have live content.
  const todayOffset = -daysSinceSunday(); // start of this week (Sunday)
  addCompleted({ daysFromToday: todayOffset + 1, hour: 10, clientId: c.noa, treatmentId: t.deepClean, price: 400, duration: 60 });
  addCompleted({ daysFromToday: todayOffset + 2, hour: 11, clientId: c.rachel, treatmentId: t.acrylic, price: 300, duration: 60 });
  addCompleted({ daysFromToday: 0, hour: Math.max(new Date().getHours() - 3, 8), clientId: c.shira, treatmentId: t.lacquer, price: 150, duration: 45, isPaid: false });
  addPlanned({ daysFromToday: 0, hour: Math.min(new Date().getHours() + 3, 19), clientId: c.talya, treatmentId: t.phototherapy, price: 150, duration: 20 });
  addPlanned({ daysFromToday: 1, hour: 10, clientId: c.michal, treatmentId: t.acrylic, price: 300, duration: 60 });
  addPlanned({ daysFromToday: 2, hour: 12, clientId: c.yael, treatmentId: t.deepClean, price: 400, duration: 60 });
  addPlanned({ daysFromToday: 3, hour: 9, clientId: c.noa, treatmentId: t.lacquer, price: 150, duration: 45 });
  addPlanned({ daysFromToday: 4, hour: 15, clientId: c.rachel, treatmentId: t.rfNeck, price: 800, duration: 50 });

  // Next week: a couple of planned appointments.
  addPlanned({ daysFromToday: 8, hour: 10, clientId: c.shira, treatmentId: t.meso, price: 500, duration: 50 });
  addPlanned({ daysFromToday: 9, hour: 11, clientId: c.talya, treatmentId: t.acrylic, price: 300, duration: 60 });

  // ---- product sales ------------------------------------------------------
  productSales.push(
    { id: uuid(), user_id: LOCAL_USER_ID, client_id: c.michal, treatment_log_id: null, product_name: "קרם לחות פנים", amount: 120, is_paid: true, notes: null, sold_at: atTime(-9, 12), created_at: now.toISOString() },
    { id: uuid(), user_id: LOCAL_USER_ID, client_id: c.shira, treatment_log_id: null, product_name: "סרום ויטמין C", amount: 180, is_paid: false, notes: null, sold_at: atTime(-4, 10), created_at: now.toISOString() },
    { id: uuid(), user_id: LOCAL_USER_ID, client_id: null, treatment_log_id: null, product_name: "שמן לחיפוי ציפורניים", amount: 60, is_paid: true, notes: "לקוחה מזדמנת", sold_at: atTime(-2, 16), created_at: now.toISOString() },
  );

  // ---- expense categories + expenses ---------------------------------------
  const ec = {
    materials: uuid(),
    equipment: uuid(),
    rent: uuid(),
    marketing: uuid(),
    other: uuid(),
  };
  const expenseCategories: Row[] = [
    { id: ec.materials, user_id: LOCAL_USER_ID, name: "חומרי גלם", default_amount: null, sort_order: 1, created_at: now.toISOString() },
    { id: ec.equipment, user_id: LOCAL_USER_ID, name: "ציוד", default_amount: null, sort_order: 2, created_at: now.toISOString() },
    { id: ec.rent, user_id: LOCAL_USER_ID, name: "שכירות", default_amount: 2500, sort_order: 3, created_at: now.toISOString() },
    { id: ec.marketing, user_id: LOCAL_USER_ID, name: "שיווק", default_amount: null, sort_order: 4, created_at: now.toISOString() },
    { id: ec.other, user_id: LOCAL_USER_ID, name: "אחר", default_amount: null, sort_order: 5, created_at: now.toISOString() },
  ];

  const expenses: Row[] = [
    { id: uuid(), user_id: LOCAL_USER_ID, category_id: ec.rent, description: "שכירות חודשית", amount: 2500, notes: null, spent_at: atTime(-15, 9), created_at: now.toISOString() },
    { id: uuid(), user_id: LOCAL_USER_ID, category_id: ec.materials, description: "מלאי חומרי גלם לטיפולי פנים", amount: 650, notes: null, spent_at: atTime(-12, 9), created_at: now.toISOString() },
    { id: uuid(), user_id: LOCAL_USER_ID, category_id: ec.marketing, description: "קידום ברשתות חברתיות", amount: 200, notes: null, spent_at: atTime(-8, 9), created_at: now.toISOString() },
    { id: uuid(), user_id: LOCAL_USER_ID, category_id: ec.equipment, description: "מכשיר RF - תחזוקה", amount: 350, notes: null, spent_at: atTime(-6, 9), created_at: now.toISOString() },
    { id: uuid(), user_id: LOCAL_USER_ID, category_id: ec.materials, description: "לקים וחומרי גימור לציפורניים", amount: 300, notes: null, spent_at: atTime(-2, 9), created_at: now.toISOString() },
  ];

  // ---- weekly goals ---------------------------------------------------------
  const weeklyGoals: Row[] = [
    { id: uuid(), user_id: LOCAL_USER_ID, week_start: isoDateOnly(todayOffset - 14), target_count: 5, target_revenue: 2000, created_at: now.toISOString() },
    { id: uuid(), user_id: LOCAL_USER_ID, week_start: isoDateOnly(todayOffset - 7), target_count: 6, target_revenue: 2200, created_at: now.toISOString() },
    { id: uuid(), user_id: LOCAL_USER_ID, week_start: isoDateOnly(todayOffset), target_count: 7, target_revenue: 2400, created_at: now.toISOString() },
  ];

  return {
    clients,
    treatments,
    appointments,
    treatment_log: treatmentLog,
    product_sales: productSales,
    expense_categories: expenseCategories,
    expenses,
    weekly_goals: weeklyGoals,
  };
}

export function getStore(): Store {
  if (!globalThis.__kaLocalStore) {
    globalThis.__kaLocalStore = buildSeed();
  }
  return globalThis.__kaLocalStore;
}

export function resetStore(): Store {
  globalThis.__kaLocalStore = buildSeed();
  return globalThis.__kaLocalStore;
}
