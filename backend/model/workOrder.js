const mongoose = require("mongoose");

const workOrderSchema = new mongoose.Schema({
  woNumber: String,
  poNumber: String,
  state: String,
  project: String,
  notes: String,
  pm: String,
});

const WorkOrder = mongoose.model("WorkOrder", workOrderSchema);

module.exports = WorkOrder;
