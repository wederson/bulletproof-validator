import BulletProofChecker from './BulletProofChecker/index.js';

const pages = [
    'https://blog.estacio.br/'
];

const bulletProofChecker = new BulletProofChecker(pages);
bulletProofChecker.run();
