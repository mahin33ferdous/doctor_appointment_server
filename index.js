const express=require('express')
const cors=require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port=process.env.PORT || 5000

const app=express()

//middleware
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2qayojn.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run(){
  try{
    const appointmentOptionCollection=client.db('doctorAppoinment').collection('appointmentCollection')

    app.get('/appointment',async(req,res)=>{
      const query={}
      const slots=await appointmentOptionCollection.find(query).toArray()
      res.send(slots)
    })
  }
  finally{
  
  }
}
run().catch(console.dir);

app.get('/',async(req,res)=>{
    res.send('doctor portal runinng')
})

app.listen(port,()=>console.log(`port is ${port}`))