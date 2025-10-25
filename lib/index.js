'use strict';

import express from 'express';
import gplay from "google-play-scraper";
import path from 'path';
import qs from 'querystring';

const router = express.Router();

const toList = (apps) => ({ results: apps });

const cleanUrls = (req) => (app) => Object.assign({}, app, {
  playstoreUrl: app.url,
  url: buildUrl(req, 'apps/' + app.appId),
  permissions: buildUrl(req, 'apps/' + app.appId + '/permissions'),
  similar: buildUrl(req, 'apps/' + app.appId + '/similar'),
  reviews: buildUrl(req, 'apps/' + app.appId + '/reviews'),
  datasafety: buildUrl(req, 'apps/' + app.appId + '/datasafety'),
  developer: {
    devId: app.developer,
    url: buildUrl(req, 'developers/' + qs.escape(app.developer))
  },
  categories: buildUrl(req, 'categories/')
});

const buildUrl = (req, subpath) =>
  req.protocol + '://' + path.join(req.get('host'), req.baseUrl, subpath);

/* Index */
router.get('/', (req, res) =>
  res.json({
    apps: buildUrl(req, 'apps'),
    developers: buildUrl(req, 'developers'),
    categories: buildUrl(req, 'categories')
  }));

/* App search */
router.get('/apps/', function (req, res, next) {
  if (!req.query.q) {
    return next();
  }

  const opts = Object.assign({ term: req.query.q }, req.query);

  gplay.search(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* Search suggest */
router.get('/apps/', function (req, res, next) {
  if (!req.query.suggest) {
    return next();
  }

  const toJSON = (term) => ({
    term,
    url: buildUrl(req, '/apps/') + '?' + qs.stringify({ q: term })
  });

  gplay.suggest({ term: req.query.suggest })
    .then((terms) => terms.map(toJSON))
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* App list */
router.get('/apps/', function (req, res, next) {
  function paginate(apps) {
    const num = parseInt(req.query.num || '60');
    const start = parseInt(req.query.start || '0');

    if (start - num >= 0) {
      req.query.start = start - num;
      apps.prev = buildUrl(req, '/apps/') + '?' + qs.stringify(req.query);
    }

    if (start + num <= 500) {
      req.query.start = start + num;
      apps.next = buildUrl(req, '/apps/') + '?' + qs.stringify(req.query);
    }

    return apps;
  }

  gplay.list(req.query)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList).then(paginate)
    .then(res.json.bind(res))
    .catch(next);
});

/* App detail*/
router.get('/apps/:appId', function (req, res, next) {
  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.app(opts)
    .then(cleanUrls(req))
    .then(res.json.bind(res))
    .catch(next);
});

/* Similar apps */
router.get('/apps/:appId/similar', function (req, res, next) {
  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.similar(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* Data Safety */
router.get('/apps/:appId/datasafety', function (req, res, next) {
  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.datasafety(opts)
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* App permissions */
router.get('/apps/:appId/permissions', function (req, res, next) {
  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.permissions(opts)
    .then(toList)
    .then(res.json.bind(res))
    .catch(next);
});

/* App reviews */
router.get('/apps/:appId/reviews', function (req, res, next) {
  function paginate(apps) {
    const page = parseInt(req.query.page || '0');

    const subpath = '/apps/' + req.params.appId + '/reviews/';
    if (page > 0) {
      req.query.page = page - 1;
      apps.prev = buildUrl(req, subpath) + '?' + qs.stringify(req.query);
    }

    if (apps.results.length) {
      req.query.page = page + 1;
      apps.next = buildUrl(req, subpath) + '?' + qs.stringify(req.query);
    }

    return apps;
  }

  const opts = Object.assign({ appId: req.params.appId }, req.query);
  gplay.reviews(opts)
    .then(toList)
    .then(paginate)
    .then(res.json.bind(res))
    .catch(next);
});

/* Apps by developer */
router.get('/developers/:devId/', function (req, res, next) {
  const opts = Object.assign({ devId: req.params.devId }, req.query);

  gplay.developer(opts)
    .then((apps) => apps.map(cleanUrls(req)))
    .then((apps) => ({
      devId: req.params.devId,
      apps
    }))
    .then(res.json.bind(res))
    .catch(next);
});

/* Developer list (not supported) */
router.get('/developers/', (req, res) =>
  res.status(400).json({
    message: 'Please specify a developer id.',
    example: buildUrl(req, '/developers/' + qs.escape('Wikimedia Foundation'))
  }));

/* Category list */
router.get('/categories/', function (req, res, next) {
  // Lista completa hardcoded porque gplay.categories() está quebrado
  const categories = [
    // JOGOS
    { id: 'GAME_ACTION', name: 'Ação', type: 'GAME', namePtBr: 'Ação' },
    { id: 'GAME_ADVENTURE', name: 'Adventure', type: 'GAME', namePtBr: 'Aventura' },
    { id: 'GAME_ARCADE', name: 'Arcade', type: 'GAME', namePtBr: 'Arcade' },
    { id: 'GAME_BOARD', name: 'Board', type: 'GAME', namePtBr: 'Tabuleiro' },
    { id: 'GAME_CARD', name: 'Card', type: 'GAME', namePtBr: 'Cartas' },
    { id: 'GAME_CASINO', name: 'Casino', type: 'GAME', namePtBr: 'Cassino' },
    { id: 'GAME_CASUAL', name: 'Casual', type: 'GAME', namePtBr: 'Casual' },
    { id: 'GAME_EDUCATIONAL', name: 'Educational', type: 'GAME', namePtBr: 'Educacional' },
    { id: 'GAME_MUSIC', name: 'Music', type: 'GAME', namePtBr: 'Música' },
    { id: 'GAME_PUZZLE', name: 'Puzzle', type: 'GAME', namePtBr: 'Quebra-cabeça' },
    { id: 'GAME_RACING', name: 'Racing', type: 'GAME', namePtBr: 'Corrida' },
    { id: 'GAME_ROLE_PLAYING', name: 'Role Playing', type: 'GAME', namePtBr: 'RPG' },
    { id: 'GAME_SIMULATION', name: 'Simulation', type: 'GAME', namePtBr: 'Simulação' },
    { id: 'GAME_SPORTS', name: 'Sports', type: 'GAME', namePtBr: 'Esportes' },
    { id: 'GAME_STRATEGY', name: 'Strategy', type: 'GAME', namePtBr: 'Estratégia' },
    { id: 'GAME_TRIVIA', name: 'Trivia', type: 'GAME', namePtBr: 'Trivia' },
    { id: 'GAME_WORD', name: 'Word', type: 'GAME', namePtBr: 'Palavras' },

    // APPS
    { id: 'ART_AND_DESIGN', name: 'Art & Design', type: 'APPLICATION', namePtBr: 'Arte e Design' },
    { id: 'AUTO_AND_VEHICLES', name: 'Auto & Vehicles', type: 'APPLICATION', namePtBr: 'Automóveis' },
    { id: 'BEAUTY', name: 'Beauty', type: 'APPLICATION', namePtBr: 'Beleza' },
    { id: 'BOOKS_AND_REFERENCE', name: 'Books & Reference', type: 'APPLICATION', namePtBr: 'Livros e Referências' },
    { id: 'BUSINESS', name: 'Business', type: 'APPLICATION', namePtBr: 'Negócios' },
    { id: 'COMICS', name: 'Comics', type: 'APPLICATION', namePtBr: 'Quadrinhos' },
    { id: 'COMMUNICATION', name: 'Communication', type: 'APPLICATION', namePtBr: 'Comunicação' },
    { id: 'DATING', name: 'Dating', type: 'APPLICATION', namePtBr: 'Relacionamentos' },
    { id: 'EDUCATION', name: 'Education', type: 'APPLICATION', namePtBr: 'Educação' },
    { id: 'ENTERTAINMENT', name: 'Entertainment', type: 'APPLICATION', namePtBr: 'Entretenimento' },
    { id: 'EVENTS', name: 'Events', type: 'APPLICATION', namePtBr: 'Eventos' },
    { id: 'FINANCE', name: 'Finance', type: 'APPLICATION', namePtBr: 'Finanças' },
    { id: 'FOOD_AND_DRINK', name: 'Food & Drink', type: 'APPLICATION', namePtBr: 'Comida e Bebida' },
    { id: 'HEALTH_AND_FITNESS', name: 'Health & Fitness', type: 'APPLICATION', namePtBr: 'Saúde e Fitness' },
    { id: 'HOUSE_AND_HOME', name: 'House & Home', type: 'APPLICATION', namePtBr: 'Casa e Decoração' },
    { id: 'LIBRARIES_AND_DEMO', name: 'Libraries & Demo', type: 'APPLICATION', namePtBr: 'Bibliotecas e Demos' },
    { id: 'LIFESTYLE', name: 'Lifestyle', type: 'APPLICATION', namePtBr: 'Estilo de Vida' },
    { id: 'MAPS_AND_NAVIGATION', name: 'Maps & Navigation', type: 'APPLICATION', namePtBr: 'Mapas e Navegação' },
    { id: 'MEDICAL', name: 'Medical', type: 'APPLICATION', namePtBr: 'Medicina' },
    { id: 'MUSIC_AND_AUDIO', name: 'Music & Audio', type: 'APPLICATION', namePtBr: 'Música e Áudio' },
    { id: 'NEWS_AND_MAGAZINES', name: 'News & Magazines', type: 'APPLICATION', namePtBr: 'Notícias e Revistas' },
    { id: 'PARENTING', name: 'Parenting', type: 'APPLICATION', namePtBr: 'Para Pais' },
    { id: 'PERSONALIZATION', name: 'Personalization', type: 'APPLICATION', namePtBr: 'Personalização' },
    { id: 'PHOTOGRAPHY', name: 'Photography', type: 'APPLICATION', namePtBr: 'Fotografia' },
    { id: 'PRODUCTIVITY', name: 'Productivity', type: 'APPLICATION', namePtBr: 'Produtividade' },
    { id: 'SHOPPING', name: 'Shopping', type: 'APPLICATION', namePtBr: 'Compras' },
    { id: 'SOCIAL', name: 'Social', type: 'APPLICATION', namePtBr: 'Redes Sociais' },
    { id: 'SPORTS', name: 'Sports', type: 'APPLICATION', namePtBr: 'Esportes' },
    { id: 'TOOLS', name: 'Tools', type: 'APPLICATION', namePtBr: 'Ferramentas' },
    { id: 'TRAVEL_AND_LOCAL', name: 'Travel & Local', type: 'APPLICATION', namePtBr: 'Viagens e Local' },
    { id: 'VIDEO_PLAYERS', name: 'Video Players & Editors', type: 'APPLICATION', namePtBr: 'Reprodutores de Vídeo' },
    { id: 'WEATHER', name: 'Weather', type: 'APPLICATION', namePtBr: 'Clima' }
  ];

  // Retorna lista completa com URLs para cada categoria
  const categoriesWithUrls = categories.map(cat => ({
    ...cat,
    url: buildUrl(req, `apps/?category=${cat.id}`)
  }));

  res.json(categoriesWithUrls);
});


function errorHandler(err, req, res, next) {
  res.status(400).json({ message: err.message });
  next();
}

router.use(errorHandler);

export default router;
