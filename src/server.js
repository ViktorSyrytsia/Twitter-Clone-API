const express = require('express');
const mongoose = require('mongoose');


const auth = require('./controller/api/auth');

const app = express();

app.use(express.json());

const dbUri = require('./config/keys').mongoURI;

mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})
    .then(() => console.log('db connected'))
    .catch(() => console.error('err'));


app.use('/api/auth', auth );


const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`server started on port ${port}`));