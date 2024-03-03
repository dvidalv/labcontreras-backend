let BASE_URL;
let ATLAS_URI;

if (window.location.hostname === "localhost") {
    BASE_URL = 'http://localhost:3000';
    ATLAS_URI = 'mongodb+srv://dvidalv:00Pht4CqHMxaKzP4@cluster0.m2ufsic.mongodb.net/';
} else {
    BASE_URL = 'https://api.alrededorusa.mooo.com';
    ATLAS_URI = process.env.ATLAS_URI;
}

module.exports = { BASE_URL, ATLAS_URI };
