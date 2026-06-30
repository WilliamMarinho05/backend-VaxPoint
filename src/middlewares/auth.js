const jwt = require('jsonwebtoken');
require('dotenv').config();

function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    const [, token] = header.split(' '); // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: "Token inválido" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token expirado ou inválido" });
    }
}

module.exports = auth;