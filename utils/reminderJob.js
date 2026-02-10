
const cron = require("node-cron");
const Tender = require("../models/Tender");
const checkAndSendDeadlineReminder = require("../utils/checkAndSendDeadlineReminder");

cron.schedule("0 * * * *", async () => {
  console.log("⏰ Running hourly tender deadline reminder check...");
  console.log("Server time:", new Date().toLocaleString());

  try {
    const tenders = await Tender.find({
      Deadline: { $ne: null },
      Status: "Active",
      DeadlineReminderSent: false
    });

    let remindersSent = 0;

    for (const tender of tenders) {
      const sent = await checkAndSendDeadlineReminder(tender);
      if (sent) remindersSent++;
    }

    console.log(`✅ Cron completed. Reminders sent: ${remindersSent}`);
  } catch (err) {
    console.error("❌ Cron job error:", err.message);
  }
});

console.log("📅 Tender reminder cron job scheduled (runs every hour)");
