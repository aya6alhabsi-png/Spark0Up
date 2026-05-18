import fs from "fs";
import assert from "node:assert/strict";

const index = fs.readFileSync(new URL("../index.js", import.meta.url), "utf8");
const ideaModel = fs.readFileSync(new URL("../models/Idea.js", import.meta.url), "utf8");
const eventModel = fs.readFileSync(new URL("../models/Event.js", import.meta.url), "utf8");

const checks = [
  ["idea submission route exists", /app\.post\('\/ideas'/.test(index)],
  ["idea submission requires IP form", /IP form file is required/.test(index)],
  ["admin review route exists", /app\.patch\('\/ideas\/:id\/admin-review'/.test(index)],
  ["admin review requires comments for reject/change", /Comment is required before requesting changes/.test(index)],
  ["reviewer evaluation route exists", /app\.post\('\/reviewer\/ideas\/:id\/evaluation'/.test(index)],
  ["reviewer textbox/comment validation exists", /Reviewer comment is required/.test(index)],
  ["present idea to funders route exists", /app\.patch\('\/ideas\/:id\/present'/.test(index)],
  ["only approved funders are selected", /No approved funders were found/.test(index)],
  ["funder accept\/reject route exists", /app\.patch\('\/funder\/ideas\/:id\/decision'/.test(index)],
  ["approved funder middleware exists", /requireApprovedFunderAccount/.test(index)],
  ["events disable\/hide instead of delete", /Event archived\/hidden/.test(index) && /status: \{ type: String, enum: \["active", "disabled", "archived", "draft"\]/.test(eventModel)],
  ["event date validation blocks past dates", /Event start date cannot be in the past/.test(index)],
  ["feedback submit route exists", /app\.post\('\/feedback'/.test(index)],
  ["notifications are created", /createNotification/.test(index) && /\/notifications/.test(index)],
  ["contract validation exists", /Valid final budget is required before issuing contract/.test(index) && /Contract conditions are required/.test(index)],
  ["audit log route exists", /\/admin\/activity-logs/.test(index)],
  ["clear CAT A flow is exported in idea responses", /PUBLIC_IDEA_FLOW/.test(index) && /flow: PUBLIC_IDEA_FLOW/.test(index)],
  ["idea model supports full flow statuses", /contract_drafted/.test(ideaModel) && /resolved/.test(ideaModel)],
];

for (const [name, passed] of checks) {
  assert.equal(passed, true, `CAT A check failed: ${name}`);
  console.log(`✓ ${name}`);
}
