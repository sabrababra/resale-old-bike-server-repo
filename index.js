const express = require('express');
const cors = require('cors');
const port= process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app=express();


app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}>@cluster0.r5wfiz1.mongodb.net/?retryWrites=true&w=majority`;
//console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        const collectionBike=client.db('resale-bike').collection('bikeCollection')
        app.get('/bikeCollection',async(req,res)=>{
            const query={};
            const options=await collectionBike.find(query).toArray();
            res.send(options);
        })
    }
    finally{

    }
}

run.catch(console.log);


app.get('/',async(req,res)=>{
    res.send('bike resale server is running')
})

app.listen(port,()=>{
    console.log('bike resale running on port', port);
})