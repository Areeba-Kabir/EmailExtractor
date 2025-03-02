
const WorkOrder = require("../model/workOrder");
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const mondaySdk = require("monday-sdk-js");

const monday = mondaySdk();
monday.setToken(process.env.MONDAY_API_TOKEN); 

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/uploadPdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const pdfBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    console.log("Extracted Text:\n", text);

    const woNumberMatch = text.match(/Work Order:\s*(\d+)/);
    const poNumberMatch = text.match(/P\.O\. #:\s*(\d+)/);
    const pmMatch = text.match(/Tax Code:\s*\n([A-Za-z\s]+)/);
    const notesMatch = text.match(
      /Instructions:\s*\n(?:.*\d+\s*)*\n([\s\S]+?)(?=\n\d{4,}|\nTotal:|\nSTANDARD TERMS)/
    );

    const notesCleaned = notesMatch
      ? notesMatch[1].trim().replace(/\n\s*\n/g, " ")
      : "No notes available";
    const pmCleaned = pmMatch ? pmMatch[1].split("\n")[0].trim() : "Unknown";

    const workOrder = new WorkOrder({
      woNumber: woNumberMatch ? woNumberMatch[1] : "N/A",
      poNumber: poNumberMatch ? poNumberMatch[1] : "N/A",
      state: "TX",
      project: "NewProject",
      notes: notesCleaned,
      pm: pmCleaned,
    });

    await workOrder.save();

    const columnValues = JSON.stringify({
      person: { personsAndTeams: [{ id: workOrder.pmId, kind: "person" }] },  
      wo_no: workOrder.woNumber.toString(),
      po_no: workOrder.poNumber.toString(),
      status: { label: workOrder.state },  
      notes: workOrder.notes,
    });

    const mondayResponse = await monday.api(`
  mutation {
    create_item (
      board_id: ${process.env.MONDAY_BOARD_ID}, 
      item_name: "${workOrder.project}", 
      column_values: ${JSON.stringify(columnValues)}
    ) {
      id
    }
  }
`);

    console.log(JSON.stringify(columnValues));
    console.log("Monday.com Response:", mondayResponse);

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: "PDF processed successfully",
      workOrder,
      mondayResponse,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
