import { PrismaClient, BenefitClass, ClaimStatus, ExpenseCategory, Role } from "@prisma/client";

const prisma = new PrismaClient();

const EMPLOYEE_ALLOCATION = 3500;
const EXECUTIVE_ALLOCATION = 15000;

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.claimDocument.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.approvedUser.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@endinmind.example",
      fullName: "Avery Admin",
      role: Role.ADMIN,
      benefitClass: BenefitClass.EXECUTIVE,
      annualAllocation: EXECUTIVE_ALLOCATION,
      isActive: true,
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: "employee@endinmind.example",
      fullName: "Elliot Employee",
      role: Role.EMPLOYEE,
      benefitClass: BenefitClass.EMPLOYEE,
      annualAllocation: EMPLOYEE_ALLOCATION,
      isActive: true,
    },
  });

  const executive = await prisma.user.create({
    data: {
      email: "executive@endinmind.example",
      fullName: "Xander Executive",
      role: Role.EXECUTIVE,
      benefitClass: BenefitClass.EXECUTIVE,
      annualAllocation: EXECUTIVE_ALLOCATION,
      isActive: true,
    },
  });

  await prisma.approvedUser.createMany({
    data: [
      {
        email: admin.email,
        fullName: admin.fullName,
        role: Role.ADMIN,
        benefitClass: BenefitClass.EXECUTIVE,
        annualAllocation: EXECUTIVE_ALLOCATION,
        createdByUserId: admin.id,
        isActive: true,
      },
      {
        email: employee.email,
        fullName: employee.fullName,
        role: Role.EMPLOYEE,
        benefitClass: BenefitClass.EMPLOYEE,
        annualAllocation: EMPLOYEE_ALLOCATION,
        createdByUserId: admin.id,
        isActive: true,
      },
      {
        email: executive.email,
        fullName: executive.fullName,
        role: Role.EXECUTIVE,
        benefitClass: BenefitClass.EXECUTIVE,
        annualAllocation: EXECUTIVE_ALLOCATION,
        createdByUserId: admin.id,
        isActive: true,
      },
    ],
  });

  const approvedClaim = await prisma.claim.create({
    data: {
      userId: employee.id,
      expenseDate: new Date("2026-02-10"),
      providerName: "Main Street Dental",
      category: ExpenseCategory.DENTAL,
      description: "Dental cleaning and x-rays",
      amount: 220.5,
      status: ClaimStatus.APPROVED,
      planYear: 2026,
      submittedAt: new Date("2026-02-11"),
      decidedAt: new Date("2026-02-13"),
      decidedByUserId: admin.id,
      userNotes: "Submitted with complete receipt and insurance coordination details.",
      adminNotes: "Eligible under plan rules.",
    },
  });

  await prisma.claim.create({
    data: {
      userId: employee.id,
      expenseDate: new Date("2026-02-16"),
      providerName: "Metro Pharmacy",
      category: ExpenseCategory.PRESCRIPTIONS,
      description: "Prescription refill",
      amount: 48.25,
      status: ClaimStatus.PENDING,
      planYear: 2026,
      submittedAt: new Date("2026-02-17"),
      userNotes: "Prescription for seasonal allergy treatment.",
    },
  });

  await prisma.claim.create({
    data: {
      userId: executive.id,
      expenseDate: new Date("2026-01-21"),
      providerName: "Vision Plus",
      category: ExpenseCategory.VISION,
      description: "Prescription glasses",
      amount: 460.0,
      status: ClaimStatus.DENIED,
      planYear: 2026,
      submittedAt: new Date("2026-01-22"),
      decidedAt: new Date("2026-01-24"),
      decidedByUserId: admin.id,
      userNotes: "Submitting optometry and frames receipt.",
      denialReason: "Receipt did not include provider details.",
      adminNotes: "Please resubmit with detailed receipt.",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        entityType: "CLAIM",
        entityId: approvedClaim.id,
        action: "CLAIM_CREATED",
        performedByUserId: employee.id,
        metadata: { status: ClaimStatus.APPROVED },
      },
      {
        entityType: "CLAIM",
        entityId: approvedClaim.id,
        action: "CLAIM_APPROVED",
        performedByUserId: admin.id,
      },
      {
        entityType: "USER",
        entityId: employee.id,
        action: "USER_CREATED",
        performedByUserId: admin.id,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
