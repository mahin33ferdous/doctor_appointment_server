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
    const bookingCollection=client.db('doctorAppoinment').collection('bookCollection')

    app.get('/appointment',async(req,res)=>{
       const date=req.query.date
       console.log(date)
      const query={}
      const allAppointmentOptions=await appointmentOptionCollection.find(query).toArray() //getting all options for appointment
      const bookingQuery={appointmentDate : date}
      const alreadyBooked=await bookingCollection.find(bookingQuery).toArray() // getting all the booking from database
      allAppointmentOptions.forEach(appointmentOption=>{
        const appointmentBooked=alreadyBooked.filter(book=>book.treatment===appointmentOption.name) //distincting all the bookings according to treatment name
        const timeSlot=appointmentBooked.map(book=>book.slot) //getting the selected slot time
        const remainingtimeSlots= appointmentOption.slots.filter(slot=>!timeSlot.includes(slot))
        appointmentOption.slots=remainingtimeSlots; // setting the new remainingslot to the available slot of appointment options
        console.log(date,appointmentOption.name,timeSlot,remainingtimeSlots.length)
        
      })
      res.send(allAppointmentOptions)
    })
    app.post('/bookings',async(req,res)=>{
      const booking=req.body
      //console.log(booking)
      const result=await bookingCollection.insertOne(booking)
      res.send(result)
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