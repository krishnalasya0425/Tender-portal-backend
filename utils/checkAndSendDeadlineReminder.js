const User = require("../models/User");
const sendEmail = require("./mailer");

module.exports = async function checkAndSendDeadlineReminder(tender) {
  if (!tender?.Deadline) return false;
  if (tender.Status !== "Active") return false;
  if (tender.DeadlineReminderSent) return false;

  const now = new Date();
  const deadline = new Date(tender.Deadline);

  const diffHours = (deadline - now) / (1000 * 60 * 60);

  // ✅ within next 48 hours
  if (diffHours <= 0 || diffHours > 48) return false;

  const admin = await User.findOne({ role: "admin" });
if (!admin?.email) return false;



  const deadlineStr = deadline.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  await sendEmail(
    admin.email,
    "⏰ Tender Deadline Approaching",
    `
      <h3>Tender Deadline Reminder</h3>
      <p><b>Tender:</b> ${tender.TenderNumber}</p>
      <p><b>Deadline:</b> ${deadlineStr}</p>
      <p>This tender will close within <b>48 hours</b>.</p>
    `
  );

  tender.DeadlineReminderSent = true;
  await tender.save();

  console.log(`📧 Reminder sent for ${tender.TenderNumber}`);
  return true;
};
