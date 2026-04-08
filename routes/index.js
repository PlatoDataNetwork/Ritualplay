const configureRoutes = (app) => {
  app.use('/api/auth', require('./api/auth'));
  app.use('/api/users', require('./api/users'));
  app.use('/api/chips', require('./api/chips'));
  app.get('/healthz', (req, res) => {
    res.status(200).json({ ok: true });
  });
  app.use('/', (req, res) => {
    res.status(200).send('RollPlay API Documents');
  });
};

module.exports = configureRoutes;  