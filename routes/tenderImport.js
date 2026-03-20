const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const Tender = require('../models/Tender'); // Your Tender model
const auth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Import Excel file
router.post('/import-excel', auth, upload.single('file'), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const importedTenders = [];
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Map Excel columns to your schema
        const tenderData = {
          TenderNumber: row['Tender Number'] || row['TenderNumber'] || '',
          Description: row['Tender Brief'] || row['Description'] || '',
          Vertical: mapVertical(row['Vertical']), // Function to map vertical names
          Deadline: parseDeadline(row['Deadline']), // Function to parse deadline
          Status: row['Status'] || 'Inactive',
          BidPrice: extractBidPrice(row['Bid Price']), // Function to extract price
          CurrentStatusDescription: row['Current Status Description'] || '',
          Gem: row['Gem'] || '',
          OrganisationName: row['Location'] || '',
          EMD: extractEMD(row['EMD']), // Function to extract EMD
          Prebid: row['Prebid'] || '',
          L1BidDetails: row['L1 Bid and Details'] || '',
          L2BidDetails: row['L2 Bid and Details'] || '',
          L3BidDetails: row['L3 Bid and Details'] || '',
          MajorSpec: row['Major Spec'] || '',
          Link: row['Link'] || '',
          Remarks: row['Remarks'] || ''
        };

        // Validate required fields
        if (!tenderData.TenderNumber || !tenderData.Description) {
          errors.push(`Row ${i + 2}: Missing Tender Number or Description`);
          continue;
        }

        // Check for duplicate TenderNumber
        const existingTender = await Tender.findOne({ TenderNumber: tenderData.TenderNumber });
        if (existingTender) {
          errors.push(`Row ${i + 2}: Tender Number ${tenderData.TenderNumber} already exists`);
          continue;
        }

        const tender = new Tender(tenderData);
        await tender.save();
        importedTenders.push(tender);
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    res.json({
      message: 'Import completed',
      imported: importedTenders.length,
      errors: errors,
      total: data.length
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Error importing file', error: error.message });
  }
});

// Helper function to map vertical names
function mapVertical(vertical) {
  const verticalMap = {
    'AR /VR': 'AR/VR',
    'AR/VR': 'AR/VR',
    'AI': 'AI',
    'AI /UGV': 'AI/UGV',
    'AI/UGV': 'AI/UGV',
    'UGV': 'UGV',
    'OTHERS': 'OTHERS',
    'DRONE/AI': 'DRONE/AI',
    'UAV': 'UAV',
    'RCWS/AWS': 'RCWS/AWS'
  };
  return verticalMap[vertical] || vertical || 'OTHERS';
}

// Helper function to parse deadline
function parseDeadline(deadline) {
  if (!deadline) return null;
  
  // Handle different date formats
  let date;
  
  // Format: 11-03-2025 14:00:00
  if (typeof deadline === 'string') {
    // Check if it's DD-MM-YYYY format
    const match = deadline.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [_, day, month, year, hours, minutes, seconds] = match;
      date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    } else {
      date = new Date(deadline);
    }
  } else if (deadline instanceof Date) {
    date = deadline;
  } else {
    return null;
  }
  
  return isNaN(date.getTime()) ? null : date.toISOString();
}

// Helper function to extract bid price
function extractBidPrice(price) {
  if (!price) return '';
  
  // Extract numbers from string like "Applied 55 lakh" or "ef - 28 lakh"
  const match = price.match(/\d+(?:\.\d+)?/);
  if (match) {
    // Check if it's in lakhs
    if (price.toLowerCase().includes('lakh')) {
      return (parseFloat(match[0]) * 100000).toString();
    }
    return match[0];
  }
  return price.toString();
}

// Helper function to extract EMD
function extractEMD(emd) {
  if (!emd) return '';
  
  // Extract numbers from string like "3,62,519- SISAI TECHNOLOGIES PRIVATE LIMITED"
  const match = emd.match(/(\d+(?:,\d+)*)/);
  if (match) {
    return match[0].replace(/,/g, '');
  }
  return emd.toString();
}

module.exports = router;