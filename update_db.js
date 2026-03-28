const path = require('path');
const knexLib = require('knex');

// 1. Manually define the paths
const dbPath = path.join(__dirname, 'backend', 'db', 'database.sqlite');
const knexfile = require('./backend/db/knexfile.js');

// 2. Override the connection to use the absolute path to the .sqlite file
const config = {
    ...knexfile.development,
    connection: {
        filename: dbPath
    }
};

const knex = knexLib(config);

async function addPhone() {
    console.log("Searching for database at:", dbPath);
    try {
        const hasColumn = await knex.schema.hasColumn('emergencies', 'phone');
        
        if (!hasColumn) {
            await knex.schema.table('emergencies', (table) => {
                table.string('phone').nullable(); 
            });
            console.log("✅ SUCCESS: 'phone' column added to 'emergencies' table!");
        } else {
            console.log("ℹ️ INFO: 'phone' column already exists.");
        }
    } catch (err) {
        console.error("❌ DATABASE ERROR:", err.message);
    } finally {
        await knex.destroy();
        process.exit();
    }
}

addPhone();