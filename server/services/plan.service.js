const { ProfilePlan, Sequelize } = require("../models");
const { touchLastInteraction } = require("./profile.service");

/* ── Subscription packages — hardcoded ── */
const SUBSCRIPTION_PLANS = {
  bronze:  { name: "bronze",  years: 0.5  }, // 6 months
  silver:  { name: "silver",  years: 1    }, // 12 months
  gold:    { name: "gold",    years: 2    }, // 24 months
  diamond: { name: "diamond", years: 3    }, // 36 months
};

const calculateExpiry = (startDate, years) => {
  const expiry = new Date(startDate);
  expiry.setFullYear(expiry.getFullYear() + Math.floor(years));
  // handle 0.5 years = 6 months
  if (years % 1 !== 0) {
    expiry.setMonth(expiry.getMonth() + Math.round((years % 1) * 12));
  }
  return expiry;
};

const determinePaymentStatus = (planExpiry) => {
  if (!planExpiry) return "unpaid";
  const now = new Date();
  const expiry = new Date(planExpiry);
  const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry < 0)   return "expired";
  if (daysUntilExpiry <= 15) return "expiring";
  return "paid";
};

/* ── Get latest plan for a profile ── */
exports.getLatestPlan = (profileid) => {
  return ProfilePlan.findOne({
    where: { profileid },
    order: [["id", "DESC"]]
  });
};

/* ── Get all plans for a profile (history) ── */
exports.getPlanHistory = (profileid) => {
  return ProfilePlan.findAll({
    where: { profileid },
    order: [["id", "DESC"]]
  });
};

/* ── Assign a new plan by subscription name — always starts as unpaid ── */
exports.assignPlan = async (profileid, subscriptionName, createdBy) => {
  const pkg = SUBSCRIPTION_PLANS[subscriptionName?.toLowerCase()];
  if (!pkg) throw new Error(`Invalid subscription: ${subscriptionName}. Must be bronze, silver, gold or diamond.`);

  const startDate  = new Date();
  const planExpiry = calculateExpiry(startDate, pkg.years);

  const plan = await ProfilePlan.create({
    profileid,
    plan_start:        startDate,
    plan_expiry:       planExpiry,
    subscription_name: pkg.name,
    payment_status:    "unpaid",
    created_by:        createdBy || null
  });

  await touchLastInteraction(profileid);

  return plan;
};

/* ── Confirm payment — flips latest plan to active/expiring ── */
exports.confirmPayment = async (profileid) => {
  const plan = await exports.getLatestPlan(profileid);
  if (!plan) throw new Error("No plan found for this profile");

  const paymentStatus = determinePaymentStatus(plan.plan_expiry);
  await plan.update({ payment_status: paymentStatus, payment_confirmed_at: new Date() });

  await plan.reload();
  
  console.log("plan after update:", plan.toJSON());  // ← add this
  

  await touchLastInteraction(profileid);

  return plan;
};

/* ── Refresh all paid plans (called on admin page load) ── */
exports.refreshAllPaymentStatuses = async () => {
  const plans = await ProfilePlan.findAll({
    where: {
      payment_status: { [Sequelize.Op.in]: ["paid", "expiring"] }
    },
    attributes: ["id", "plan_expiry", "payment_status"]
  });

  let updated = 0;
  for (const plan of plans) {
    const newStatus = determinePaymentStatus(plan.plan_expiry);
    if (plan.payment_status !== newStatus) {
      await plan.update({ payment_status: newStatus });
      updated++;
    }
  }
  return updated;
};