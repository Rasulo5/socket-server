const { Pool } = require('pg');

const pool = new Pool({
    user: 'Rassell1933@',
    host: 'https://online-chat-7l13.onrender.com',
    database: 'postgres',
    password: 'postgres',
    port: 5432
});

const query = (text, params) => {
    return pool.query(text, params);
};

module.exports = {query};