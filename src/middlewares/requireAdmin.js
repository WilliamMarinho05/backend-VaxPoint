module.exports = function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: "Não autenticado" });
    }

    if (req.user.is_admin !== 1 && req.user.is_admin !== true) {
        return res.status(403).json({ error: "Acesso negado: admin apenas" });
    }

    next();
};