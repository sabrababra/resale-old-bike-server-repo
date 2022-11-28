const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const jwt = require('jsonwebtoken');

const app = express();


app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hmg27un.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// token function
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try {
        const bikesCollection = client.db('resaleBike').collection('bikeCollection');
        const usersCollection = client.db('resaleBike').collection('user');
        const bookingCollection = client.db('resaleBike').collection('booking');
        const reportCollection = client.db('resaleBike').collection('report');

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        }

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        //add & update  user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options)

            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

            res.send({ result, token })
        })

        // get user by email
        app.get('/role/:email', verifyJWT, async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send(user)
        })


        // add booking 
        app.post('/addBooking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });

        // get product by email
        app.get('/myBuyers', async (req, res) => {
            const email = req.query.email;
            const query = { sellerEmail: email };
            const bikes = await bookingCollection.find(query).toArray();
            res.send(bikes);
        })

        // get booking
        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            const query = { buyerEmail: email };
            const bikes = await bookingCollection.find(query).toArray();
            res.send(bikes);
        })

        // get bike 
        app.get('/allBikes', async (req, res) => {
            const category = req.query.category;
            const query = { category: category };
            const bikes = await bikesCollection.find(query).toArray();
            res.send(bikes);
        })

        // get product by email
        app.get('/myProduct', async (req, res) => {
            const email = req.query.email;
            const query = { sellerEmail: email };
            const bikes = await bikesCollection.find(query).toArray();
            res.send(bikes);
        })

        // post bike 
        app.post('/addProduct', async (req, res) => {
            const product = req.body;
            const result = await bikesCollection.insertOne(product);
            res.send(result);
        });

        // delete bike 
        app.delete('/deleteAdvertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bikesCollection.deleteOne(filter);
            res.send(result);
        })

        app.put('/addAdvertise/:id', async (req, res) => {
            const id = req.params.id;
            const body = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    ads: body.ads
                }
            }
            const result = await bikesCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        // get ads 
        app.get('/getAdvertise', async (req, res) => {
            const query = { ads: true }
            const result = await bikesCollection.find(query).toArray()
            res.send(result);
        });

        // all seller 
        app.get('/allSellersAndBuyers', async (req, res) => {
            const role = req.query.role;
            const query = { role: role };
            const seller = await usersCollection.find(query).toArray();
            res.send(seller);
        })

        // delete bike 
        app.delete('/deleteSellerAndBuyer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        // verify seller 
        app.patch('/verifySeller', async (req, res) => {
            const email = req.query.email;
            const body = req.body;
            const filter = { email: email }
            const filterSeller = { sellerEmail: email }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isSellerVerify: body.isSellerVerify
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);

            const postUpdate = await bikesCollection.updateMany(filterSeller, updatedDoc, options);

            res.send(result);
        });


        // addReport
        app.post('/addReport', async (req, res) => {
            const product = req.body;
            const result = await reportCollection.insertOne(product);
            res.send(result);
        });

        // getReport
        app.get('/getReport', async (req, res) => {
            const query = {}
            const result = await reportCollection.find(query).toArray()
            res.send(result);
        });

        // delete report 
        app.delete('/removeReport/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await reportCollection.deleteOne(filter);
            res.send(result);
        })

        // delete post 
        app.delete('/removePost/:id', async (req, res) => {
            const id = req.params.id;
            const productId = req.body.productId

            const filter = { _id: ObjectId(id) };

            const filterProductId = { _id: ObjectId(productId) };

            const result = await reportCollection.deleteOne(filter);

            const resultProduct = await bikesCollection.deleteOne(filterProductId);

            res.send(result);
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