// Seeds a fictional "Demo Company" so the dashboard reads real rows.
// Deterministic (fixed PRNG seed) and idempotent: re-running wipes and rebuilds the demo org.
// Run: npx prisma db seed
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import type {
  ApplicationStage,
  Prisma,
  ReviewStatus,
  RiskLevel,
} from "../src/generated/prisma/client";

export const DEMO_ORG_ID = "demo-org";
export const DEMO_USER_ID = "demo-user";

const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

// ── deterministic randomness ────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261012);
const between = (min: number, max: number) => min + rand() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
function weighted<T>(items: readonly T[], weights: readonly number[]) {
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

const DAY = 86_400_000;
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * DAY);

// ── reference data ──────────────────────────────────────────────
const FIRST = [
  "Aisha", "Mateo", "Priya", "Jonas", "Lena", "Kwame", "Sofia", "Hiro", "Amara", "Diego",
  "Noor", "Liam", "Mei", "Tariq", "Elena", "Femi", "Ingrid", "Rahul", "Zara", "Oskar",
  "Yuki", "Carmen", "Idris", "Hannah", "Arjun", "Leila", "Marcus", "Ana", "Tomas", "Chloe",
  "Samir", "Nadia", "Eli", "Rosa", "Kenji", "Maya", "Omar", "Freya", "Luca", "Imani",
] as const;
const LAST = [
  "Okafor", "Silva", "Sharma", "Becker", "Novak", "Mensah", "Rossi", "Tanaka", "Diallo", "Morales",
  "Haddad", "Walsh", "Chen", "Rahman", "Petrova", "Adeyemi", "Larsen", "Iyer", "Khan", "Lindqvist",
  "Sato", "Ortega", "Bello", "Fischer", "Mehta", "Farah", "Reid", "Costa", "Kowalski", "Martin",
] as const;

type Gender = "Woman" | "Man" | "Non-binary" | null;
const GENDERS: Gender[] = ["Woman", "Man", "Non-binary", null];

const DEPARTMENTS = [
  { name: "Engineering", active: 38, exits: 6, risk: 0, gender: [0.28, 0.62, 0.04, 0.06],
    head: "VP of Engineering", titles: ["Software Engineer", "Senior Software Engineer", "Staff Engineer", "QA Engineer", "DevOps Engineer"] },
  { name: "Product", active: 10, exits: 1, risk: 0, gender: [0.45, 0.45, 0.04, 0.06],
    head: "Head of Product", titles: ["Product Manager", "Product Designer", "UX Researcher"] },
  { name: "Sales", active: 22, exits: 6, risk: 8, gender: [0.4, 0.52, 0.02, 0.06],
    head: "VP of Sales", titles: ["Account Executive", "Sales Development Rep", "Sales Engineer"] },
  { name: "Customer Success", active: 18, exits: 7, risk: 22, gender: [0.58, 0.34, 0.03, 0.05],
    head: "Head of Customer Success", titles: ["Customer Success Manager", "Support Specialist", "Onboarding Specialist"] },
  { name: "Operations", active: 10, exits: 2, risk: 0, gender: [0.5, 0.42, 0.02, 0.06],
    head: "Head of Operations", titles: ["Finance Analyst", "Operations Associate", "IT Administrator"] },
  { name: "People", active: 6, exits: 0, risk: 0, gender: [0.67, 0.25, 0.04, 0.04],
    head: "Head of People", titles: ["People Partner", "Recruiter", "People Ops Coordinator"] },
] as const;

function riskLevel(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

const usedEmails = new Set<string>();
function person() {
  for (;;) {
    const firstName = pick(FIRST);
    const lastName = pick(LAST);
    const email = `${firstName}.${lastName}@demo.talentmind.app`.toLowerCase();
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      return { firstName, lastName, email };
    }
  }
}

async function main() {
  console.log("Resetting demo organization…");
  await db.organization.deleteMany({ where: { id: DEMO_ORG_ID } });

  await db.organization.create({
    data: {
      id: DEMO_ORG_ID,
      name: "Demo Company",
      slug: "demo",
      industry: "B2B software",
      headcountBand: "50-200",
      country: "US",
      region: "CA",
    },
  });
  await db.user.create({
    data: {
      id: DEMO_USER_ID,
      email: "admin@demo.talentmind.app",
      name: "Demo Admin",
      role: "ADMIN",
      organizationId: DEMO_ORG_ID,
    },
  });

  // ── departments & employees ───────────────────────────────────
  const employees: Prisma.EmployeeCreateManyInput[] = [];
  const deptIds: Record<string, string> = {};
  let n = 0;

  for (const dept of DEPARTMENTS) {
    const deptId = `dept-${dept.name.toLowerCase().replace(/\s+/g, "-")}`;
    deptIds[dept.name] = deptId;
    await db.department.create({ data: { id: deptId, name: dept.name, organizationId: DEMO_ORG_ID } });

    const headId = `emp-${String(++n).padStart(3, "0")}`;
    const total = dept.active + dept.exits;
    for (let i = 0; i < total; i++) {
      const isHead = i === 0;
      const id = isHead ? headId : `emp-${String(++n).padStart(3, "0")}`;
      const leaver = i > dept.active - 1;
      // ~30% of current staff joined in the last year, so headcount trends up.
      const startDate = isHead
        ? daysAgo(int(1200, 1500))
        : leaver
          ? daysAgo(int(500, 1400))
          : rand() < 0.3
            ? daysAgo(int(10, 360))
            : daysAgo(int(370, 1450));
      // Exits spread over the last 24 months, weighted toward recent months.
      const endDate = leaver ? daysAgo(Math.floor(Math.pow(rand(), 1.6) * 720) + 5) : null;
      const score = Math.min(96, Math.round(between(6, 44) + (isHead ? 0 : dept.risk * rand() * 1.9)));
      const level = isHead ? "Director" : pick(["IC1", "IC2", "IC3", "IC4", "Senior"]);

      employees.push({
        id,
        organizationId: DEMO_ORG_ID,
        employeeNumber: `E${1000 + n}`,
        ...person(),
        jobTitle: isHead ? dept.head : pick(dept.titles),
        level,
        departmentId: deptId,
        managerId: isHead ? null : headId,
        employmentType: rand() < 0.06 ? "CONTRACTOR" : "FULL_TIME",
        status: leaver ? "TERMINATED" : rand() < 0.03 ? "ON_LEAVE" : "ACTIVE",
        startDate: leaver && endDate && endDate.getTime() - startDate.getTime() < 120 * DAY
          ? new Date(endDate.getTime() - int(150, 600) * DAY)
          : startDate,
        endDate,
        country: "US",
        region: pick(["CA", "CA", "CA", "NY", "TX", "WA"]),
        genderIdentity: weighted(GENDERS, dept.gender),
        skills: [],
        turnoverRiskScore: leaver ? null : score,
        riskLevel: leaver ? null : riskLevel(score),
        riskUpdatedAt: leaver ? null : daysAgo(1),
      });
    }
  }
  // Heads first so the self-relation (managerId) resolves.
  await db.employee.createMany({ data: employees.filter((e) => !e.managerId) });
  await db.employee.createMany({ data: employees.filter((e) => e.managerId) });
  const active = employees.filter((e) => e.status !== "TERMINATED");
  console.log(`Employees: ${employees.length} (${active.length} current)`);

  // ── hiring ────────────────────────────────────────────────────
  const filled = [
    { title: "Senior Frontend Engineer", dept: "Engineering", opened: 330, days: 41 },
    { title: "Product Designer", dept: "Product", opened: 260, days: 34 },
    { title: "Sales Development Rep", dept: "Sales", opened: 190, days: 23 },
    { title: "Support Specialist", dept: "Customer Success", opened: 140, days: 29 },
    { title: "DevOps Engineer", dept: "Engineering", opened: 110, days: 57 },
    { title: "Recruiter", dept: "People", opened: 85, days: 38 },
  ];
  for (const [i, job] of filled.entries()) {
    await db.jobPosting.create({
      data: {
        id: `job-filled-${i}`,
        organizationId: DEMO_ORG_ID,
        title: job.title,
        departmentId: deptIds[job.dept],
        description: `${job.title} role (filled).`,
        requirements: [],
        status: "FILLED",
        openedAt: daysAgo(job.opened),
        filledAt: daysAgo(job.opened - job.days),
        createdById: DEMO_USER_ID,
      },
    });
  }

  const open = [
    { id: "job-backend", title: "Senior Backend Engineer", dept: "Engineering", opened: 38,
      reqs: ["5+ years backend experience", "PostgreSQL", "TypeScript or Go", "Distributed systems"] },
    { id: "job-ae", title: "Account Executive, Mid-Market", dept: "Sales", opened: 26,
      reqs: ["3+ years closing B2B SaaS", "Consultative selling", "Salesforce"] },
    { id: "job-csm", title: "Customer Success Manager", dept: "Customer Success", opened: 19,
      reqs: ["2+ years in customer success", "Renewals and expansion", "Calm under pressure"] },
  ];
  for (const job of open) {
    await db.jobPosting.create({
      data: {
        id: job.id,
        organizationId: DEMO_ORG_ID,
        title: job.title,
        departmentId: deptIds[job.dept],
        description: `We're hiring a ${job.title} to join our ${job.dept} team.`,
        requirements: job.reqs,
        location: "San Francisco, CA",
        remote: true,
        status: "OPEN",
        openedAt: daysAgo(job.opened),
        createdById: DEMO_USER_ID,
      },
    });
  }

  const stagePlan: ApplicationStage[] = [
    ...Array<ApplicationStage>(9).fill("APPLIED"),
    ...Array<ApplicationStage>(6).fill("SCREENING"),
    ...Array<ApplicationStage>(5).fill("INTERVIEW"),
    ...Array<ApplicationStage>(3).fill("OFFER"),
    ...Array<ApplicationStage>(3).fill("REJECTED"),
  ];
  for (const [i, stage] of stagePlan.entries()) {
    const job = open[i % open.length];
    const who = person();
    const candidateId = `cand-${i}`;
    await db.candidate.create({
      data: {
        id: candidateId,
        organizationId: DEMO_ORG_ID,
        firstName: who.firstName,
        lastName: who.lastName,
        email: who.email.replace("@demo.talentmind.app", "@example.com"),
        source: pick(["Referral", "LinkedIn", "Careers page", "Careers page"]),
        consentGivenAt: daysAgo(int(2, job.opened)),
      },
    });
    const fit = stage === "OFFER" ? int(82, 94) : stage === "REJECTED" ? int(38, 58) : int(55, 90);
    await db.application.create({
      data: {
        organizationId: DEMO_ORG_ID,
        candidateId,
        jobPostingId: job.id,
        stage,
        boardPosition: i,
        fitScore: fit,
        appliedAt: daysAgo(int(3, job.opened)),
        stageChangedAt: stage === "OFFER" ? daysAgo(int(1, 4)) : daysAgo(int(0, 10)),
      },
    });
  }
  const offers = stagePlan.filter((s) => s === "OFFER").length;

  // ── engagement: two pulse surveys ─────────────────────────────
  const questions = [
    { id: "enps", type: "enps", prompt: "How likely are you to recommend working here to a friend?" },
    { id: "workload", type: "scale", prompt: "My workload is manageable." },
    { id: "growth", type: "scale", prompt: "I can see how I grow here." },
    { id: "open", type: "text", prompt: "What is one thing we should change?" },
  ];
  // Mean eNPS answer by department. Customer Success and Sales dip in October.
  const enpsMean: Record<string, [q3: number, oct: number]> = {
    Engineering: [8.4, 8.5], Product: [8.6, 8.6], Sales: [8.5, 7.7],
    "Customer Success": [8.0, 7.0], Operations: [8.3, 8.4], People: [8.8, 8.9],
  };
  const themesBy: Record<string, string[]> = {
    "Customer Success": ["workload", "ticket volume", "staffing"],
    Sales: ["quota", "comp plan", "territories"],
  };
  const surveys = [
    { id: "survey-q3", title: "Q3 pulse", status: "CLOSED" as const, opens: 60, closes: 46, idx: 0, rate: 0.78 },
    { id: "survey-oct", title: "October pulse", status: "ACTIVE" as const, opens: 9, closes: -5, idx: 1, rate: 0.66 },
  ];
  for (const s of surveys) {
    await db.pulseSurvey.create({
      data: {
        id: s.id,
        organizationId: DEMO_ORG_ID,
        createdById: DEMO_USER_ID,
        title: s.title,
        questions,
        status: s.status,
        opensAt: daysAgo(s.opens),
        closesAt: daysAgo(s.closes),
      },
    });
    const responses: Prisma.SurveyResponseCreateManyInput[] = [];
    for (const e of active) {
      if (rand() > s.rate) continue;
      const deptName = DEPARTMENTS.find((d) => deptIds[d.name] === e.departmentId)!.name;
      const mean = enpsMean[deptName][s.idx];
      const enps = Math.max(0, Math.min(10, Math.round(mean + (rand() + rand() + rand() - 1.5) * 1.9)));
      const sentimentScore = Math.max(-1, Math.min(1, (enps - 7) / 3 + between(-0.15, 0.15)));
      responses.push({
        surveyId: s.id,
        departmentId: e.departmentId,
        answers: { enps, workload: Math.max(1, Math.min(5, Math.round(enps / 2))), growth: int(2, 5) },
        enpsScore: enps,
        sentimentScore: Math.round(sentimentScore * 100) / 100,
        sentimentLabel: sentimentScore > 0.2 ? "positive" : sentimentScore < -0.2 ? "negative" : "neutral",
        themes: enps <= 6 && themesBy[deptName] ? [pick(themesBy[deptName])] : [],
        createdAt: daysAgo(int(Math.max(0, s.closes), s.opens)),
      });
    }
    await db.surveyResponse.createMany({ data: responses });
  }

  // eNPS per department for the alert copy, computed from what was just written.
  async function deptEnps(surveyId: string, deptName: string) {
    const rows = await db.surveyResponse.findMany({
      where: { surveyId, departmentId: deptIds[deptName] },
      select: { enpsScore: true },
    });
    const promoters = rows.filter((r) => (r.enpsScore ?? 0) >= 9).length;
    const detractors = rows.filter((r) => (r.enpsScore ?? 0) <= 6).length;
    return Math.round(((promoters - detractors) / Math.max(rows.length, 1)) * 100);
  }
  const csNow = await deptEnps("survey-oct", "Customer Success");
  const salesBefore = await deptEnps("survey-q3", "Sales");
  const salesNow = await deptEnps("survey-oct", "Sales");

  // ── risk alerts (feed the Daily Briefing and the bell) ───────
  const csHighRisk = active.filter(
    (e) => e.departmentId === deptIds["Customer Success"] && (e.turnoverRiskScore ?? 0) >= 55,
  );
  const flight = [...active]
    .filter((e) => e.managerId)
    .sort((a, b) => (b.turnoverRiskScore ?? 0) - (a.turnoverRiskScore ?? 0))[0];

  await db.riskAlert.createMany({
    data: [
      {
        organizationId: DEMO_ORG_ID,
        departmentId: deptIds["Customer Success"],
        type: "BURNOUT",
        level: "HIGH",
        title: `${csHighRisk.length} people in Customer Success show burnout signals`,
        reason: `October pulse eNPS for the team is ${csNow}. "Workload" and "ticket volume" lead the comments.`,
        suggestedActions: [
          { action: "Hold 1:1s focused on workload this week", owner: "Head of Customer Success", dueInDays: 5 },
          { action: "Review ticket routing and on-call load", owner: "Head of Customer Success", dueInDays: 14 },
        ],
        createdAt: daysAgo(0.2),
      },
      {
        organizationId: DEMO_ORG_ID,
        employeeId: flight.id!,
        type: "FLIGHT_RISK",
        level: "HIGH",
        title: `Flight risk: ${flight.firstName} ${flight.lastName}`,
        reason: `Retention risk score ${flight.turnoverRiskScore}. No level change in over 2 years.`,
        suggestedActions: [{ action: "Career conversation with their manager", owner: "Manager", dueInDays: 7 }],
        createdAt: daysAgo(0.5),
      },
      {
        organizationId: DEMO_ORG_ID,
        type: "HIRING",
        level: "MEDIUM",
        title: `${offers} offers are waiting on a decision`,
        reason: "The oldest offer was sent 4 days ago. Candidates typically accept elsewhere after a week.",
        suggestedActions: [{ action: "Chase approvals with hiring managers", owner: "Recruiter", dueInDays: 2 }],
        createdAt: daysAgo(1),
      },
      {
        organizationId: DEMO_ORG_ID,
        departmentId: deptIds["Sales"],
        type: "ENGAGEMENT_DROP",
        level: "MEDIUM",
        title: `Sales eNPS fell from ${salesBefore} to ${salesNow}`,
        reason: "Comments mention the new comp plan and territory changes.",
        suggestedActions: [{ action: "Run a comp-plan Q&A with the sales team", owner: "VP of Sales", dueInDays: 10 }],
        createdAt: daysAgo(2),
      },
      {
        organizationId: DEMO_ORG_ID,
        type: "COMPLIANCE",
        level: "LOW",
        title: "Remote work policy is due for its annual review",
        reason: "Last published 12 months ago. Run a compliance check before renewing.",
        createdAt: daysAgo(3),
      },
    ],
  });

  // ── performance: H2 cycle in progress ─────────────────────────
  const statuses: ReviewStatus[] = [
    ...Array<ReviewStatus>(11).fill("DRAFT"),
    ...Array<ReviewStatus>(6).fill("AI_DRAFTED"),
    ...Array<ReviewStatus>(9).fill("SUBMITTED"),
    ...Array<ReviewStatus>(5).fill("ACKNOWLEDGED"),
  ];
  const reviewees = active.filter((e) => e.managerId).slice(0, statuses.length);
  await db.performanceReview.createMany({
    data: reviewees.map((e, i) => ({
      organizationId: DEMO_ORG_ID,
      employeeId: e.id!,
      reviewerId: e.managerId,
      cycleName: "H2 2026",
      periodStart: new Date(Date.UTC(2026, 6, 1)),
      periodEnd: new Date(Date.UTC(2026, 11, 31)),
      status: statuses[i],
      submittedAt: ["SUBMITTED", "ACKNOWLEDGED"].includes(statuses[i]) ? daysAgo(int(1, 12)) : null,
    })),
  });

  await db.policy.create({
    data: {
      organizationId: DEMO_ORG_ID,
      authorId: DEMO_USER_ID,
      title: "Remote Work Policy",
      slug: "remote-work",
      category: "remote-work",
      country: "US",
      region: "CA",
      content: "# Remote Work Policy\n\n(Seeded placeholder: regenerate with the Policy Generator.)",
      status: "PUBLISHED",
      complianceStatus: "PASSED",
      publishedAt: daysAgo(365),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
