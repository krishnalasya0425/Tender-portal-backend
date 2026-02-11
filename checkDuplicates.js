const mongoose = require('mongoose');
const Tender = require('./models/Tender');
require('dotenv').config();

async function checkDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tender-portal');
        console.log('Connected to MongoDB');

        const tenders = await Tender.find({});
        console.log(`Total tenders in database: ${tenders.length}`);

        // Check for duplicate TenderNumbers
        const tenderNumbers = {};
        tenders.forEach(t => {
            if (!tenderNumbers[t.TenderNumber]) {
                tenderNumbers[t.TenderNumber] = [];
            }
            tenderNumbers[t.TenderNumber].push({
                id: t._id.toString(),
                description: t.Description,
                deadline: t.Deadline
            });
        });

        console.log('\n=== Checking for duplicates ===');
        let foundDuplicates = false;
        Object.keys(tenderNumbers).forEach(num => {
            if (tenderNumbers[num].length > 1) {
                foundDuplicates = true;
                console.log(`\nDuplicate TenderNumber: ${num}`);
                console.log(`Count: ${tenderNumbers[num].length}`);
                tenderNumbers[num].forEach((t, idx) => {
                    console.log(`  ${idx + 1}. ID: ${t.id}, Desc: ${t.description}, Deadline: ${t.deadline}`);
                });
            }
        });

        if (!foundDuplicates) {
            console.log('No duplicate TenderNumbers found in database');
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

checkDuplicates();
