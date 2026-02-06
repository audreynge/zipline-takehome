import express from 'express';

const app = express();

app.post('/init-catalog', ()=>{});

app.post('/process-order', ()=>{});

app.post('/process-restock', ()=>{});

app.post('/ship-package', ()=>{});


export default app;