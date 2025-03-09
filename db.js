const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'https://online-chat-7l13.onrender.com',
    database: 'postgres',
    password: 'Rassell1933@',
    port: 5432
});

const query = (text, params) => {
    return pool.query(text, params);
};

module.exports = {query};