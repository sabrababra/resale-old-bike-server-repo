const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();


app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hmg27un.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const bikesCollection = client.db('resaleBike').collection('bikeCollection');
        const userCollection = client.db('resaleBike').collection('user');
        const bookingCollection = client.db('resaleBike').collection('booking');

        // user 
        app.put('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.updateOne(user);
            res.send(result);
        });

        // add booking 
        app.post('/addBooking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });

        // get bike 
        app.get('/allBikes', async (req, res) => {
            const category = req.query.category;
            const query = { category: category };
            const bikes = await bikesCollection.find(query).toArray();
            res.send(bikes);
        })
    }
    finally {

    }
}

run().catch(console.log);


app.get('/', async (req, res) => {
    res.send('bike resale server is running')
})

app.listen(port, () => {
    console.log('bike resale running on port', port);
})