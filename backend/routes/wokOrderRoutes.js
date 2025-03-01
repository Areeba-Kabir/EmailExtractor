const { WorkOrder } = require("../model/workOrder");
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const path = require("path");
const fs = require("fs");
const router = express.Router();

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

    console.log({
      woNumber: woNumberMatch ? woNumberMatch[1] : "Not Found",
      poNumber: poNumberMatch ? poNumberMatch[1] : "Not Found",
      notes: notesCleaned,
      pm: pmCleaned,
    });

    const workOrder = new WorkOrder({
      woNumber: woNumberMatch ? woNumberMatch[1] : "N/A",
      poNumber: poNumberMatch ? poNumberMatch[1] : "N/A",
      state: "Pending",
      project: "General Project",
      notes: notesCleaned,
      pm: pmCleaned,
    });

    await workOrder.save();

    fs.unlinkSync(req.file.path);

    res.status(201).json({ message: "PDF processed successfully", workOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
